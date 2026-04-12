"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { ConnectionSkeleton } from '@/components/ui/Skeleton';
import { fetchUsers, searchUsers, fetchGroups, sendConnectionRequest, fetchConnections, fetchPopulatedConnections, createGroup, fetchPendingRequests, fetchSentPendingRequests, respondToRequest } from '@/lib/firestore';
import { Search, UserPlus, Users as UsersIcon, Plus, Check, Bell, CheckCircle, X, Users, Mail, Phone, Link2 } from 'lucide-react';

export default function ConnectionsPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [people, setPeople] = useState([]);
  const [network, setNetwork] = useState([]);
  const [groups, setGroups] = useState([]);
  const [myConnections, setMyConnections] = useState(new Set());
  const [sentRequests, setSentRequests] = useState(new Set());
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const incomingRequestIds = new Set(requests.map((req) => req.senderId));

  // Load pending requests
  useEffect(() => {
    if (!user) return;
    async function loadRequests() {
      setRequestsLoading(true);
      try {
        const data = await fetchPendingRequests(user.uid);
        setRequests(data);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setRequestsLoading(false);
      }
    }
    loadRequests();
  }, [user]);

  const handleAccept = async (req) => {
    setRespondingTo(req.id);
    try {
      await respondToRequest(req, 'accepted');
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setPeople((prev) => prev.filter((p) => p.id !== req.senderId));
      
      // Optimistically add to network
      setNetwork((prev) => [
        {
          id: req.senderId,
          name: req.senderName,
          photoURL: req.senderProfileImageUrl,
          organization: 'Newly Connected', // Stub
        },
        ...prev
      ]);
      setMyConnections((prev) => new Set([...prev, req.senderId]));
    } catch (err) {
      console.error('Failed to accept:', err);
    } finally {
      setRespondingTo(null);
    }
  };

  const handleDecline = async (req) => {
    setRespondingTo(req.id);
    try {
      await respondToRequest(req, 'declined');
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err) {
      console.error('Failed to decline:', err);
    } finally {
      setRespondingTo(null);
    }
  };

  // Load users & connections
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [usersData, networkData, sentPending] = await Promise.all([
          fetchUsers(30),
          fetchPopulatedConnections(user.uid),
          fetchSentPendingRequests(user.uid),
        ]);

        setSentRequests(new Set(sentPending.map((req) => req.receiverId)));

        const connectedIds = new Set(networkData.map(u => u.id));
        setMyConnections(connectedIds);
        setNetwork(networkData);

        // Filter out self and already-connected users
        const filtered = usersData.filter(
          (u) => u.id !== user.uid && !connectedIds.has(u.id)
        );
        setPeople(filtered);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  // Load groups
  useEffect(() => {
    if (!user || activeTab !== 'groups') return;

    async function loadGroups() {
      setIsLoading(true);
      try {
        const data = await fetchGroups(user.uid, profile?.id || null);
        setGroups(data);
      } catch (err) {
        console.error('Failed to load groups:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadGroups();
  }, [user, activeTab, profile?.id]);

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim() || !user) return;

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchUsers(searchQuery.trim());
        setPeople(results.filter((u) => u.id !== user.uid));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, user]);

  // Reset search
  useEffect(() => {
    if (searchQuery.trim() === '' && user) {
      fetchUsers(30).then((data) => {
        setPeople(data.filter((u) => u.id !== user.uid && !myConnections.has?.(u.id)));
      });
    }
  }, [searchQuery, user, myConnections]);

  const handleConnect = async (targetUser) => {
    if (!user || !profile) return;
    try {
      await sendConnectionRequest({
        senderId: user.uid,
        senderName: profile.fullName || profile.name || 'User',
        senderProfileImageUrl: profile.photoURL || null,
        receiverId: targetUser.id,
        receiverName: targetUser.name || targetUser.fullName || 'User',
        receiverProfileImageUrl: targetUser.photoURL || null,
      });
      setSentRequests((prev) => new Set([...prev, targetUser.id]));
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setCreatingGroup(true);
    try {
      const groupRef = await createGroup({
        name: newGroupName.trim(),
        createdBy: user.uid,
        members: selectedGroupMemberIds,
      });
      const createdGroup = {
        id: groupRef.id,
        name: newGroupName.trim(),
        members: [user.uid, ...selectedGroupMemberIds],
      };
      setNewGroupName('');
      setSelectedGroupMemberIds([]);
      setShowGroupModal(false);
      // Reload groups
      const data = await fetchGroups(user.uid);
      setGroups(data);
      window.location.href = `/messages?groupId=${createdGroup.id}`;
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const getContactRows = (person) => {
    const rows = [];
    const phoneMode = person.phoneVisibilityMode || (person.phonePublic ? 'connection-only' : 'private');
    const canViewPhone =
      phoneMode === 'connection-only' ||
      (phoneMode === 'custom' && Array.isArray(person.phoneVisibilityAllowedIds) && user && person.phoneVisibilityAllowedIds.includes(user.uid));

    if (person.email) {
      rows.push({ key: 'email', icon: Mail, text: person.email });
    }

    if (person.linkedinProfile) {
      rows.push({ key: 'linkedin', icon: Link2, text: person.linkedinProfile });
    }

    if (canViewPhone && person.phone) {
      rows.push({ key: 'phone', icon: Phone, text: person.phone });
    }

    return rows;
  };

  const toggleGroupMember = (memberId) => {
    setSelectedGroupMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  };

  return (
    <div className="section-container py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Connections</h1>
          <p className="text-sapphire-400 mt-1">Discover professionals and grow your network</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-xl">
        <Input
          icon={Search}
          placeholder="Search people by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-sapphire-800/30 rounded-xl p-1.5 mb-8 border border-white/[0.04] w-full sm:w-fit">
        {[
          { key: 'discover', label: 'Discover', icon: UserPlus },
          { key: 'network', label: 'My Network', icon: Users },
          { key: 'requests', label: 'Requests', icon: Bell, badge: requests.length },
          { key: 'groups', label: 'Groups', icon: UsersIcon },
        ].map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 relative ${
              activeTab === key
                ? 'bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                : 'text-sapphire-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(key)}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge > 0 && (
              <span className={`ml-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 ${
                activeTab === key ? 'bg-sapphire-900/30 text-sapphire-900' : 'bg-cyan-neon text-sapphire-900'
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pb-10">
        {activeTab === 'discover' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {searchQuery ? 'Search Results' : 'Suggested for you'}
              </h2>
              <span className="text-xs text-sapphire-500">{people.length} people found</span>
            </div>

            {isLoading ? (
              <ConnectionSkeleton count={4} />
            ) : people.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <p className="text-sapphire-400 text-lg mb-2">No people found</p>
                <p className="text-sapphire-500 text-sm">Try a different search term or check back later.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {people.map(person => {
                  const alreadySent = sentRequests.has(person.id);
                  const hasIncomingRequest = incomingRequestIds.has(person.id);
                  return (
                    <div key={person.id} className="glass-panel rounded-2xl p-6 hover:border-white/[0.1] transition-all group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-cyan-neon/20 overflow-hidden">
                          {person.photoURL ? (
                            <img src={person.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (person.name || person.fullName || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">{person.name || person.fullName || 'User'}</h3>
                          <p className="text-sapphire-500 text-sm truncate">
                            {person.organization || person.company || person.bio || 'Vynco Member'}
                          </p>
                          {person.jobTitle && (
                            <p className="text-cyan-dark text-xs mt-1 truncate">{person.jobTitle}</p>
                          )}
                        </div>
                      </div>
                      {person.username && (
                        <p className="text-cyan-dark text-xs mb-4">@{person.username}</p>
                      )}
                      <button
                        onClick={() => {
                          if (hasIncomingRequest) {
                            setActiveTab('requests');
                            return;
                          }
                          if (!alreadySent) {
                            handleConnect(person);
                          }
                        }}
                        disabled={alreadySent}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                          hasIncomingRequest
                            ? 'border border-amber-400/40 text-amber-300 hover:bg-amber-300/10'
                            :
                          alreadySent
                            ? 'border border-sapphire-600 text-sapphire-500 cursor-default'
                            : 'border border-cyan-neon/20 text-cyan-neon hover:bg-cyan-neon/10'
                        }`}
                      >
                        {hasIncomingRequest ? (
                          <><Bell className="w-4 h-4" /> Respond to Request</>
                        ) : alreadySent ? (
                          <><Check className="w-4 h-4" /> Request Sent</>
                        ) : (
                          <><UserPlus className="w-4 h-4" /> Connect</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'network' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">My Network</h2>
              <span className="text-xs text-sapphire-500">{network.length} connections</span>
            </div>

            {isLoading ? (
              <ConnectionSkeleton count={4} />
            ) : network.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <p className="text-sapphire-400 text-lg mb-2">You don't have any connections yet</p>
                <p className="text-sapphire-500 text-sm">Head over to the Discover tab to find professionals.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {network.map(person => (
                  <div key={person.id} className="glass-panel rounded-2xl p-6 hover:border-white/[0.1] transition-all group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-cyan-neon/20 overflow-hidden">
                        {person.photoURL ? (
                          <img src={person.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (person.name || person.fullName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{person.name || person.fullName || 'User'}</h3>
                        <p className="text-sapphire-500 text-sm truncate">
                          {person.organization || person.company || person.bio || 'Vynco Member'}
                        </p>
                        {person.jobTitle && (
                          <p className="text-cyan-dark text-xs mt-1 truncate">{person.jobTitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {getContactRows(person).map(({ key, icon: Icon, text }) => (
                        <div key={key} className="flex items-center gap-3 rounded-xl bg-sapphire-900/40 border border-white/[0.04] px-3 py-2">
                          <Icon className="w-4 h-4 text-cyan-neon flex-shrink-0" />
                          <span className="text-xs text-sapphire-300 truncate">{text}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/messages?userId=${person.id}`}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-sapphire-600 text-sapphire-400 hover:text-white transition-all"
                    >
                      Message
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Pending Requests</h2>
              <span className="text-xs text-sapphire-500">{requests.length} pending</span>
            </div>

            {requestsLoading ? (
              <ConnectionSkeleton count={3} />
            ) : requests.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <Bell className="w-12 h-12 text-sapphire-600 mx-auto mb-4" />
                <p className="text-sapphire-400 text-lg mb-2">No pending requests</p>
                <p className="text-sapphire-500 text-sm">When someone sends you a connection request, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-cyan-neon/20 overflow-hidden flex-shrink-0">
                        {req.senderProfileImageUrl ? (
                          <img src={req.senderProfileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (req.senderName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{req.senderName || 'User'}</h3>
                        <p className="text-sapphire-500 text-sm truncate">{req.message || 'Wants to connect with you'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(req)}
                        disabled={respondingTo === req.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={() => handleDecline(req)}
                        disabled={respondingTo === req.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-sapphire-600 text-sapphire-400 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'groups' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Your Networking Groups</h2>
              <button
                onClick={() => setShowGroupModal(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-cyan-neon hover:text-cyan-dark transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Group
              </button>
            </div>

            {isLoading ? (
              <ConnectionSkeleton count={3} />
            ) : groups.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <p className="text-sapphire-400 text-lg mb-2">No groups yet</p>
                <p className="text-sapphire-500 text-sm">Create a group to start collaborating with your network!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {groups.map(group => (
                  <div key={group.id} className="glass-panel rounded-2xl p-6 hover:border-white/[0.1] transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-sapphire-700 rounded-xl flex items-center justify-center border border-white/[0.06]">
                        <UsersIcon className="w-6 h-6 text-cyan-dark" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{group.name}</h3>
                        <p className="text-sapphire-500 text-sm">{group.members?.length || 0} members</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { window.location.href = `/messages?groupId=${group.id}`; }}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-sapphire-700/50 text-white hover:bg-sapphire-600/50 transition-colors border border-white/[0.06]"
                    >
                      Open In Messages
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel rounded-2xl p-8 w-full max-w-lg glow-border">
            <h3 className="text-xl font-bold text-white mb-4">Create a Group</h3>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full p-4 rounded-xl glass-input text-white placeholder:text-sapphire-500 mb-4"
            />

            <div className="mb-5">
              <p className="text-sm text-sapphire-400 mb-3">Add people from your network only</p>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {network.length === 0 ? (
                  <div className="text-xs text-sapphire-500 py-2">No connections available yet.</div>
                ) : (
                  network.map((person) => {
                    const memberUid = person.uid || person.id;
                    const selected = selectedGroupMemberIds.includes(memberUid);
                    return (
                      <button
                        key={memberUid}
                        type="button"
                        onClick={() => toggleGroupMember(memberUid)}
                        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                          selected ? 'border-cyan-neon/30 bg-cyan-neon/10' : 'border-white/[0.06] hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate">{person.fullName || person.name || 'User'}</div>
                          <div className="text-xs text-sapphire-500 truncate">{person.organization || person.company || 'Vynco Member'}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-cyan-neon bg-cyan-neon' : 'border-sapphire-600'}`}>
                          {selected && <Check className="w-3 h-3 text-sapphire-900" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowGroupModal(false); setNewGroupName(''); setSelectedGroupMemberIds([]); }}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-sapphire-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup || !newGroupName.trim()}
                className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50"
              >
                {creatingGroup ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
