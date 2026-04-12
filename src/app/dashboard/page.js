"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FAB } from '@/components/ui/FAB';
import { FeedSkeleton, ProfileSkeleton } from '@/components/ui/Skeleton';
import { subscribeToPosts, createPost, toggleLike, formatTimestamp, fetchUserByUsername, sendConnectionRequest, fetchSentPendingRequests, fetchConnections } from '@/lib/firestore';
import { useSearchParams } from 'next/navigation';
import { QrCode, Mail, Phone, Building2, UserCircle, ThumbsUp, MessageCircle, Share2, ScanLine, X, Link2, Briefcase, UserPlus, Check } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('feed');
  const [feedLoading, setFeedLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [networkAuthorIds, setNetworkAuthorIds] = useState(new Set());
  const [networkFilterReady, setNetworkFilterReady] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanRestartToken, setScanRestartToken] = useState(0);
  const [scanStatus, setScanStatus] = useState('Initializing scanner...');
  const [scanError, setScanError] = useState('');
  const [scannedProfile, setScannedProfile] = useState(null);
  const [showScannedCardModal, setShowScannedCardModal] = useState(false);
  const [sendingScannedRequest, setSendingScannedRequest] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState(new Set());

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'feed' || tab === 'card') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    setNetworkFilterReady(false);

    async function loadNetworkAuthors() {
      try {
        const connections = await fetchConnections(user.uid);
        const ids = new Set([user.uid]);

        connections.forEach((connection) => {
          connection.users?.forEach((uid) => ids.add(uid));
        });

        if (active) {
          setNetworkAuthorIds(ids);
          setNetworkFilterReady(true);
        }
      } catch (err) {
        console.error('Failed to load network for feed filter:', err);
        if (active) {
          setNetworkAuthorIds(new Set([user.uid]));
          setNetworkFilterReady(true);
        }
      }
    }

    loadNetworkAuthors();

    return () => {
      active = false;
    };
  }, [user]);

  // Real-time posts subscription (network-only)
  useEffect(() => {
    if (!user || !networkFilterReady) return;

    setFeedLoading(true);
    const unsubscribe = subscribeToPosts(20, (fetchedPosts) => {
      const visiblePosts = fetchedPosts.filter((post) => networkAuthorIds.has(post.authorId));
      setPosts(visiblePosts);
      setFeedLoading(false);
    });

    return () => unsubscribe();
  }, [user, networkFilterReady, networkAuthorIds]);

  useEffect(() => {
    if (!user) return;

    async function loadSentRequests() {
      try {
        const pending = await fetchSentPendingRequests(user.uid);
        setSentRequestIds(new Set(pending.map((req) => req.receiverId)));
      } catch (err) {
        console.error('Failed to load sent requests:', err);
      }
    }

    loadSentRequests();
  }, [user]);

  const handlePostCreate = () => {
    setShowPostModal(true);
  };

  const handleSubmitPost = async () => {
    if (!newPostContent.trim() || !user) return;
    setPosting(true);
    try {
      await createPost({
        authorId: user.uid,
        authorName: profile?.fullName || profile?.name || 'Anonymous',
        authorPhoto: profile?.photoURL || null,
        content: newPostContent.trim(),
      });
      setNewPostContent('');
      setShowPostModal(false);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return;
    try {
      await toggleLike(postId, user.uid);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const closeScannerModal = () => {
    setShowScannerModal(false);
    setScanError('');
    setScanStatus('Initializing scanner...');
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setNewPostContent('');
  };

  const closeScannedCardModal = () => {
    setScannedProfile(null);
    setShowScannedCardModal(false);
  };

  useEffect(() => {
    const hasOpenModal = showScannerModal || showScannedCardModal || showPostModal;
    if (!hasOpenModal) return;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      if (showScannedCardModal) {
        closeScannedCardModal();
        return;
      }

      if (showScannerModal) {
        closeScannerModal();
        return;
      }

      if (showPostModal) {
        closePostModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showScannerModal, showScannedCardModal, showPostModal]);

  useEffect(() => {
    if (!showScannerModal) return;

    let stream;
    let intervalId;
    let canceled = false;

    const stopScanner = () => {
      if (intervalId) window.clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    const extractUsername = (rawValue) => {
      if (!rawValue) return '';

      const trimmed = rawValue.trim();
      if (!trimmed) return '';

      try {
        const asUrl = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        const pathUser = asUrl.pathname.replace(/^\//, '').split('/')[0];
        if (pathUser) return pathUser.toLowerCase();
      } catch {
        // Fallback to non-URL payload.
      }

      return trimmed.replace(/^@/, '').split(/[/?#]/)[0].toLowerCase();
    };

    const startScanner = async () => {
      setScanError('');
      setScanStatus('Requesting camera access...');

      if (typeof window === 'undefined' || typeof window.BarcodeDetector === 'undefined') {
        setScanError('QR scanner is not supported in this browser. Use Chrome/Edge on HTTPS or localhost.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (canceled) {
          stopScanner();
          return;
        }

        const video = document.getElementById('dashboard-qr-video');
        if (!video) {
          setScanError('Scanner video element is unavailable.');
          stopScanner();
          return;
        }

        video.srcObject = stream;
        await video.play();

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        setScanStatus('Point the camera at a Vynco digital card QR code...');

        intervalId = window.setInterval(async () => {
          if (canceled || !video || video.readyState < 2) return;

          try {
            const barcodes = await detector.detect(video);
            if (!barcodes.length) return;

            const username = extractUsername(barcodes[0]?.rawValue || '');
            if (!username) return;

            setScanStatus('Looking up digital card...');
            const foundProfile = await fetchUserByUsername(username);

            canceled = true;
            stopScanner();

            if (!foundProfile) {
              setScanError('User not found. Try to search with username.');
              setScanStatus('Scan complete');
              return;
            }

            setScannedProfile(foundProfile);
            setShowScannerModal(false);
            setShowScannedCardModal(true);
          } catch {
            // Keep scanning on transient detection errors.
          }
        }, 500);
      } catch (err) {
        console.error('Scanner startup failed:', err);
        setScanError('Unable to access camera. Please allow camera permissions and try again.');
      }
    };

    startScanner();

    return () => {
      canceled = true;
      stopScanner();
    };
  }, [showScannerModal, scanRestartToken]);

  const handleConnectScannedProfile = async () => {
    if (!user || !profile || !scannedProfile || scannedProfile.id === user.uid || sendingScannedRequest) return;

    setSendingScannedRequest(true);
    try {
      await sendConnectionRequest({
        senderId: user.uid,
        senderName: profile.fullName || profile.name || 'User',
        senderProfileImageUrl: profile.photoURL || null,
        receiverId: scannedProfile.id,
        receiverName: scannedProfile.name || scannedProfile.fullName || 'User',
        receiverProfileImageUrl: scannedProfile.photoURL || null,
      });
      setSentRequestIds((prev) => new Set([...prev, scannedProfile.id]));
    } catch (err) {
      console.error('Failed to send scanned connection request:', err);
    } finally {
      setSendingScannedRequest(false);
    }
  };

  const scannedRequestAlreadySent = !!scannedProfile && sentRequestIds.has(scannedProfile.id);

  return (
    <div className="section-container py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Welcome back, <span className="text-gradient">{profile?.fullName || profile?.name || 'User'}</span>
          </h1>
          <p className="text-sapphire-400 mt-1">Manage your feed and digital business card</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-cyan-neon/30 text-cyan-neon hover:bg-cyan-neon/10 transition-all flex items-center gap-2"
          >
            <ScanLine className="w-4 h-4" /> Scan Card
          </button>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-neon/30 bg-sapphire-700 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : profile?.name ? profile.name.charAt(0).toUpperCase() : <UserCircle className="w-7 h-7" />}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-sapphire-800/30 rounded-xl p-1.5 mb-8 border border-white/[0.04] w-full sm:w-fit">
        {['feed', 'card'].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                : 'text-sapphire-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'feed' ? 'Networking Feed' : 'Digital Card'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pb-10">

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {feedLoading ? (
                <FeedSkeleton count={3} />
              ) : posts.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                  <p className="text-sapphire-400 text-lg mb-2">No posts yet</p>
                  <p className="text-sapphire-500 text-sm">Be the first to share something with your network!</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="glass-panel rounded-2xl p-6 hover:border-white/[0.1] transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-white/[0.06] overflow-hidden">
                        {post.authorPhoto ? (
                          <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (post.authorName || 'A').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold">{post.authorName || 'Unknown'}</h4>
                        <p className="text-sapphire-500 text-xs">
                          {post.visibility === 'connections' ? 'Connections only' : 'Public'}
                          {' '}&middot;{' '}
                          {formatTimestamp(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    <p className="text-sapphire-400 leading-relaxed mb-3">{post.content}</p>

                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden mb-4">
                        <img src={post.imageUrl} alt="" className="w-full object-cover max-h-96" />
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-4 border-t border-white/[0.04]">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-2 text-sapphire-500 hover:text-cyan-neon text-sm transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" /> {post.likes || 0}
                      </button>
                      <button className="flex items-center gap-2 text-sapphire-500 hover:text-cyan-neon text-sm transition-colors">
                        <MessageCircle className="w-4 h-4" /> {post.comments || 0}
                      </button>
                      <button className="flex items-center gap-2 text-sapphire-500 hover:text-cyan-neon text-sm transition-colors ml-auto">
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block space-y-6">
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Your Profile</h3>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-sapphire-700 mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold border-2 border-cyan-neon/20">
                    {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <p className="text-white font-semibold">{profile?.fullName || profile?.name || 'Your Name'}</p>
                  <p className="text-sapphire-500 text-sm">@{profile?.username || 'username'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/[0.06]">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{profile?.connectionsCount || 0}</div>
                    <div className="text-xs text-sapphire-500">Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{profile?.postsCount || 0}</div>
                    <div className="text-xs text-sapphire-500">Posts</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Trending Topics</h3>
                <div className="space-y-2">
                  {['#Startups', '#RemoteWork', '#AITools', '#Networking'].map(tag => (
                    <span key={tag} className="inline-block mr-2 mb-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-neon/[0.06] text-cyan-neon border border-cyan-neon/10 hover:bg-cyan-neon/[0.12] transition-colors cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Digital Card Tab */}
        {activeTab === 'card' && (
          <div className="flex justify-center py-8">
            {loading ? (
              <div className="w-full max-w-md">
                <ProfileSkeleton />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-neon/15 to-transparent blur-2xl scale-110" />
                <div className="relative w-full max-w-md glass-panel p-10 rounded-[2rem] text-center glow-border">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-cyan-neon/10 rounded-full blur-3xl" />

                  <div className="w-24 h-24 bg-gradient-to-br from-sapphire-600 to-sapphire-800 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-cyan-neon/30 shadow-[0_0_20px_rgba(0,229,255,0.15)] overflow-hidden">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <QrCode className="w-10 h-10 text-cyan-neon" />
                    )}
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                    {profile?.fullName || profile?.name || 'Your Name'}
                  </h2>
                  <p className="text-cyan-dark mb-8 font-medium">@{profile?.username || 'username'}</p>

                  <div className="bg-white p-5 rounded-2xl inline-block mx-auto shadow-[0_0_30px_rgba(0,229,255,0.1)] mb-8">
                    <QRCode
                      value={profile?.username ? `vynco.app/${profile.username}` : "vynco.app/example"}
                      size={160}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#0B1120"
                    />
                  </div>

                  <div className="space-y-3 text-left">
                    {[
                      { icon: Building2, label: profile?.organization || profile?.company || 'Company / College' },
                      { icon: Mail, label: profile?.email || 'email@example.com' },
                      { icon: Phone, label: profile?.phone || 'Phone Number' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-4 text-sapphire-400 bg-sapphire-800/40 p-3.5 rounded-xl">
                        <Icon className="text-cyan-neon w-5 h-5 flex-shrink-0" />
                        <span className="truncate text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'feed' && <FAB onClick={handlePostCreate} />}

      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={closeScannerModal}>
          <div className="glass-panel rounded-2xl p-8 w-full max-w-xl glow-border relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeScannerModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-white/[0.08] text-sapphire-400 hover:text-white hover:border-white/[0.16] transition-colors"
            >
              <X className="w-4 h-4 mx-auto" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Scan Digital Card</h3>
            <p className="text-sm text-sapphire-400 mb-4">Scan a Vynco QR to open that profile directly.</p>

            <div className="rounded-2xl border border-white/[0.08] bg-sapphire-900/50 p-3 mb-4">
              <video
                id="dashboard-qr-video"
                className="w-full aspect-video rounded-xl bg-black object-cover"
                muted
                playsInline
              />
            </div>

            {scanError ? (
              <div className="text-sm rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 px-3 py-2 mb-4">
                {scanError}
              </div>
            ) : (
              <div className="text-sm rounded-xl border border-cyan-neon/20 bg-cyan-neon/10 text-cyan-neon px-3 py-2 mb-4">
                {scanStatus}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeScannerModal}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-sapphire-400 hover:text-white transition-colors"
              >
                Close
              </button>
              {!!scanError && (
                <button
                  type="button"
                  onClick={() => {
                    setScanError('');
                    setScanStatus('Initializing scanner...');
                    setScanRestartToken((prev) => prev + 1);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-sapphire-600 text-sapphire-300 hover:text-white transition-colors"
                >
                  Scan Another
                </button>
              )}
              {!!scanError && (
                <button
                  type="button"
                  onClick={() => {
                    closeScannerModal();
                    window.location.href = '/connections';
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-cyan-neon/30 text-cyan-neon hover:bg-cyan-neon/10 transition-colors"
                >
                  Search by Username
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showScannedCardModal && scannedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={closeScannedCardModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-neon/20 via-cyan-dark/10 to-transparent blur-2xl animate-pulse pointer-events-none" />
              <div className="relative glass-panel rounded-[2rem] p-8 glow-border overflow-hidden">
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-cyan-neon/10 blur-3xl pointer-events-none" />

                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-cyan-neon text-xs font-semibold uppercase tracking-[0.2em]">Scan Success</p>
                    <h3 className="text-xl font-bold text-white mt-1">Digital Card</h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeScannedCardModal}
                    className="relative z-20 w-8 h-8 rounded-lg border border-white/[0.08] text-sapphire-400 hover:text-white hover:border-white/[0.16] transition-colors"
                  >
                    <X className="w-4 h-4 mx-auto" />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0.82, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08, duration: 0.3 }}
                    className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-sapphire-600 to-sapphire-800 border-2 border-cyan-neon/30 shadow-[0_0_28px_rgba(0,229,255,0.18)] overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
                  >
                    {scannedProfile.photoURL ? (
                      <img src={scannedProfile.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (scannedProfile.fullName || scannedProfile.name || 'U').charAt(0).toUpperCase()
                    )}
                  </motion.div>

                  <h4 className="text-white text-xl font-bold truncate">{scannedProfile.fullName || scannedProfile.name || 'User'}</h4>
                  {scannedProfile.username && (
                    <p className="text-cyan-dark text-sm font-medium mt-1">@{scannedProfile.username}</p>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  {(scannedProfile.jobTitle || scannedProfile.organization || scannedProfile.company) && (
                    <div className="flex items-center gap-3 rounded-xl bg-sapphire-900/40 border border-white/[0.04] px-3 py-2">
                      <Briefcase className="w-4 h-4 text-cyan-neon flex-shrink-0" />
                      <span className="text-xs text-sapphire-300 truncate">{scannedProfile.jobTitle || scannedProfile.organization || scannedProfile.company}</span>
                    </div>
                  )}
                  {scannedProfile.email && (
                    <div className="flex items-center gap-3 rounded-xl bg-sapphire-900/40 border border-white/[0.04] px-3 py-2">
                      <Mail className="w-4 h-4 text-cyan-neon flex-shrink-0" />
                      <span className="text-xs text-sapphire-300 truncate">{scannedProfile.email}</span>
                    </div>
                  )}
                  {scannedProfile.linkedinProfile && (
                    <div className="flex items-center gap-3 rounded-xl bg-sapphire-900/40 border border-white/[0.04] px-3 py-2">
                      <Link2 className="w-4 h-4 text-cyan-neon flex-shrink-0" />
                      <span className="text-xs text-sapphire-300 truncate">{scannedProfile.linkedinProfile}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeScannedCardModal();
                      setShowScannerModal(true);
                      setScanError('');
                      setScanStatus('Initializing scanner...');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-sapphire-600 text-sapphire-400 hover:text-white transition-colors"
                  >
                    Scan Another
                  </button>
                  <button
                    type="button"
                    onClick={handleConnectScannedProfile}
                    disabled={sendingScannedRequest || scannedRequestAlreadySent || scannedProfile.id === user?.uid}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-cyan-neon/30 text-cyan-neon hover:bg-cyan-neon/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scannedProfile.id === user?.uid ? (
                      'This is your card'
                    ) : scannedRequestAlreadySent ? (
                      <><Check className="w-4 h-4 inline-block mr-1" /> Request Sent</>
                    ) : (
                      <><UserPlus className="w-4 h-4 inline-block mr-1" /> {sendingScannedRequest ? 'Connecting...' : 'Connect'}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={closePostModal}>
          <div className="glass-panel rounded-2xl p-8 w-full max-w-lg glow-border relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closePostModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-white/[0.08] text-sapphire-400 hover:text-white hover:border-white/[0.16] transition-colors"
            >
              <X className="w-4 h-4 mx-auto" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Create a Post</h3>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full p-4 rounded-xl glass-input text-white placeholder:text-sapphire-500 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closePostModal}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-sapphire-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPost}
                disabled={posting || !newPostContent.trim()}
                className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
