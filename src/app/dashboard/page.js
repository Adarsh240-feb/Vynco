"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FAB } from '@/components/ui/FAB';
import { FeedSkeleton, ProfileSkeleton } from '@/components/ui/Skeleton';
import { subscribeToPosts, createPost, toggleLike, formatTimestamp } from '@/lib/firestore';
import { QrCode, Mail, Phone, Building2, UserCircle, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [feedLoading, setFeedLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Real-time posts subscription
  useEffect(() => {
    const unsubscribe = subscribeToPosts(20, (fetchedPosts) => {
      setPosts(fetchedPosts);
      setFeedLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel rounded-2xl p-8 w-full max-w-lg glow-border">
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
                onClick={() => { setShowPostModal(false); setNewPostContent(''); }}
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
