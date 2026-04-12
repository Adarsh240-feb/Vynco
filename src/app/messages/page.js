"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  subscribeToChats,
  getOrCreateChat,
  subscribeToMessages,
  sendMessage,
  markChatAsRead,
  formatTimestamp,
  fetchPopulatedConnections,
  fetchGroups,
  subscribeToGroupMessages,
  sendGroupMessage,
  addMembersToGroup,
  removeMemberFromGroup,
  deleteGroup,
} from '@/lib/firestore';
import { Send, ArrowLeft, MessageSquare, Search, Users, Plus, UserPlus, UserMinus, Trash2 } from 'lucide-react';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [chatMode, setChatMode] = useState('direct');

  const [directChats, setDirectChats] = useState([]);
  const [activeDirectChat, setActiveDirectChat] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [newDirectMessage, setNewDirectMessage] = useState('');
  const [directLoading, setDirectLoading] = useState(true);

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [newGroupMessage, setNewGroupMessage] = useState('');
  const [sendingGroupMessage, setSendingGroupMessage] = useState(false);

  const [network, setNetwork] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const targetUserId = searchParams.get('userId');
  const targetGroupId = searchParams.get('groupId');

  useEffect(() => {
    if (!user) return;

    async function loadNetwork() {
      try {
        const networkData = await fetchPopulatedConnections(user.uid);
        setNetwork(networkData);
      } catch (err) {
        console.error('Failed to load network:', err);
      }
    }

    loadNetwork();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setDirectLoading(true);
    const unsubscribe = subscribeToChats(user.uid, (data) => {
      const oneToOneChats = data.filter((chat) => {
        if (chat.isGroup === true || chat.type === 'group') return false;
        const participants = Array.isArray(chat.participants) ? chat.participants : [];
        return participants.length === 2;
      });
      setDirectChats(oneToOneChats);
      setDirectLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    setGroupsLoading(true);

    fetchGroups(user.uid, profile?.id || null)
      .then((data) => {
        if (active) {
          setGroups(data);
          setGroupsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load groups:', err);
        if (active) {
          setGroupsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user, profile?.id]);

  useEffect(() => {
    if (!user || !profile || !targetUserId || network.length === 0) return;

    async function initDirectChat() {
      const targetUser = network.find((n) => n.id === targetUserId);
      if (!targetUser) return;

      try {
        const userInfo = {
          name: profile.fullName || profile.name || 'User',
          photoURL: profile.photoURL || null,
        };
        const targetInfo = {
          name: targetUser.fullName || targetUser.name || 'User',
          photoURL: targetUser.photoURL || null,
        };

        const chat = await getOrCreateChat(user.uid, targetUserId, userInfo, targetInfo);
        setChatMode('direct');
        setActiveDirectChat(chat);
        setActiveGroup(null);
        setShowNewChat(false);
        router.replace('/messages');
      } catch (err) {
        console.error('Failed to init direct chat:', err);
      }
    }

    initDirectChat();
  }, [user, profile, targetUserId, network, router]);

  useEffect(() => {
    if (!targetGroupId || groups.length === 0) return;

    const group = groups.find((g) => g.id === targetGroupId);
    if (!group) return;

    setChatMode('group');
    setActiveGroup(group);
    setActiveDirectChat(null);
    router.replace('/messages');
  }, [targetGroupId, groups, router]);

  useEffect(() => {
    if (!activeDirectChat || !user || chatMode !== 'direct') return;

    markChatAsRead(activeDirectChat.id, user.uid);

    const unsubscribe = subscribeToMessages(activeDirectChat.id, (msgs) => {
      setDirectMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeDirectChat, user, chatMode]);

  useEffect(() => {
    if (!activeGroup || !user || chatMode !== 'group') {
      setGroupMessages([]);
      return;
    }

    const unsubscribe = subscribeToGroupMessages(activeGroup.id, (msgs) => {
      setGroupMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeGroup, user, chatMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages, groupMessages, chatMode]);

  const openDirectChat = (chat) => {
    setChatMode('direct');
    setActiveDirectChat(chat);
    setActiveGroup(null);
    setShowNewChat(false);
  };

  const openGroupChat = (group) => {
    setChatMode('group');
    setActiveGroup(group);
    setActiveDirectChat(null);
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!newDirectMessage.trim() || !activeDirectChat || !user) return;

    const text = newDirectMessage.trim();
    setNewDirectMessage('');

    const otherUserId = activeDirectChat.participants.find((id) => id !== user.uid);
    try {
      await sendMessage(activeDirectChat.id, user.uid, otherUserId, text);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if (!newGroupMessage.trim() || !activeGroup || !user) return;

    setSendingGroupMessage(true);
    try {
      await sendGroupMessage(activeGroup.id, {
        senderId: user.uid,
        senderName: profile?.fullName || profile?.name || 'User',
        text: newGroupMessage.trim(),
      });
      setNewGroupMessage('');
    } catch (err) {
      console.error('Failed to send group message:', err);
    } finally {
      setSendingGroupMessage(false);
    }
  };

  const startNewChat = async (targetUser) => {
    if (!user || !profile) return;

    try {
      const userInfo = {
        name: profile.fullName || profile.name || 'User',
        photoURL: profile.photoURL || null,
      };
      const targetInfo = {
        name: targetUser.fullName || targetUser.name || 'User',
        photoURL: targetUser.photoURL || null,
      };

      const chat = await getOrCreateChat(user.uid, targetUser.id, userInfo, targetInfo);
      openDirectChat({ ...chat, participantInfo: { [user.uid]: userInfo, [targetUser.id]: targetInfo } });
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const toggleMemberToAdd = (memberId) => {
    setSelectedMembersToAdd((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
    );
  };

  const handleAddMembers = async () => {
    if (!activeGroup || selectedMembersToAdd.length === 0) return;

    setAddingMembers(true);
    try {
      await addMembersToGroup(activeGroup.id, selectedMembersToAdd);
      const refreshedGroups = await fetchGroups(user.uid, profile?.id || null);
      setGroups(refreshedGroups);
      const refreshedActiveGroup = refreshedGroups.find((g) => g.id === activeGroup.id);
      if (refreshedActiveGroup) {
        setActiveGroup(refreshedActiveGroup);
      }
      setSelectedMembersToAdd([]);
      setShowAddMembersModal(false);
    } catch (error) {
      console.error('Failed to add group members:', error);
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeGroup || !memberId) return;

    setRemovingMemberId(memberId);
    try {
      await removeMemberFromGroup(activeGroup.id, memberId);
      const refreshedGroups = await fetchGroups(user.uid, profile?.id || null);
      setGroups(refreshedGroups);
      const refreshedActiveGroup = refreshedGroups.find((g) => g.id === activeGroup.id);
      if (refreshedActiveGroup) {
        setActiveGroup(refreshedActiveGroup);
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup) return;

    setDeletingGroupId(activeGroup.id);
    try {
      await deleteGroup(activeGroup.id);
      const refreshedGroups = await fetchGroups(user.uid, profile?.id || null);
      setGroups(refreshedGroups);
      setActiveGroup(null);
      setGroupMessages([]);
      setShowManageMembersModal(false);
    } catch (error) {
      console.error('Failed to delete group:', error);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const filteredNetwork = network.filter((n) => {
    const term = searchQuery.toLowerCase();
    const name = (n.fullName || n.name || '').toLowerCase();
    return name.includes(term);
  });

  const addableMembers = activeGroup
    ? network.filter((person) => {
        const memberUid = person.uid || person.id;
        return !activeGroup.members?.includes(memberUid);
      })
    : [];

  const isGroupOwner = !!activeGroup && activeGroup.createdBy === user.uid;
  const memberProfiles = activeGroup
    ? activeGroup.members?.map((memberUid) => {
        if (memberUid === user.uid) {
          return {
            uid: memberUid,
            name: profile?.fullName || profile?.name || 'You',
            organization: profile?.organization || profile?.company || 'Vynco Member',
          };
        }
        const person = network.find((n) => (n.uid || n.id) === memberUid);
        return {
          uid: memberUid,
          name: person?.fullName || person?.name || 'Member',
          organization: person?.organization || person?.company || 'Vynco Member',
        };
      }) || []
    : [];

  if (!user) {
    return (
      <div className="section-container py-20 text-center">
        <p className="text-white">Please sign in to view messages.</p>
      </div>
    );
  }

  const isGroupMode = chatMode === 'group';
  const hasActiveConversation = isGroupMode ? !!activeGroup : !!activeDirectChat;

  return (
    <div className="section-container py-10 h-[calc(100vh-64px)] flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-white">Messages</h1>
        <div className="flex bg-sapphire-800/30 rounded-xl p-1.5 border border-white/[0.04]">
          <button
            type="button"
            onClick={() => {
              setChatMode('direct');
              setActiveGroup(null);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              !isGroupMode
                ? 'bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900'
                : 'text-sapphire-400 hover:text-white'
            }`}
          >
            Direct
          </button>
          <button
            type="button"
            onClick={() => {
              setChatMode('group');
              setActiveDirectChat(null);
              setShowNewChat(false);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              isGroupMode
                ? 'bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900'
                : 'text-sapphire-400 hover:text-white'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex border border-white/[0.04]">
        <div className={`w-full md:w-80 lg:w-96 flex-col border-r border-white/[0.04] bg-sapphire-900/30 ${hasActiveConversation || showNewChat ? 'hidden md:flex' : 'flex'}`}>
          {!isGroupMode && (
            <div className="p-4 border-b border-white/[0.04]">
              <button
                onClick={() => {
                  setShowNewChat(true);
                  setActiveDirectChat(null);
                }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> New Message
              </button>
            </div>
          )}

          {isGroupMode && (
            <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
              <p className="text-sm text-sapphire-400">Group conversations</p>
              <button
                type="button"
                onClick={() => (window.location.href = '/connections')}
                className="text-xs text-cyan-neon hover:text-cyan-dark transition-colors"
              >
                <Plus className="w-3 h-3 inline-block mr-1" /> New Group
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {!isGroupMode && (directLoading ? (
              <div className="p-4 text-sapphire-500 text-sm text-center">Loading chats...</div>
            ) : directChats.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sapphire-400 text-sm">No recent chats.</p>
              </div>
            ) : (
              directChats.map((chat) => {
                const otherUserId = chat.participants.find((id) => id !== user.uid);
                const otherUser = chat.participantInfo?.[otherUserId] || { name: 'Unknown User' };
                const isUnread = (chat.unreadCount?.[user.uid] || 0) > 0;
                const isActive = activeDirectChat?.id === chat.id;

                return (
                  <button
                    key={chat.id}
                    onClick={() => openDirectChat(chat)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] text-left ${isActive ? 'bg-white/[0.04]' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-cyan-neon/20 overflow-hidden flex-shrink-0 relative">
                      {otherUser.photoURL ? (
                        <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (otherUser.name || 'U').charAt(0).toUpperCase()
                      )}
                      {isUnread && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-sapphire-900" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h3 className={`font-medium truncate ${isUnread ? 'text-white' : 'text-sapphire-200'}`}>{otherUser.name}</h3>
                        {chat.lastMessageTime && <span className="text-[10px] text-sapphire-500 flex-shrink-0 ml-2">{formatTimestamp(chat.lastMessageTime)}</span>}
                      </div>
                      <p className={`text-sm truncate ${isUnread ? 'text-cyan-neon font-medium' : 'text-sapphire-500'}`}>
                        {chat.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            ))}

            {isGroupMode && (groupsLoading ? (
              <div className="p-4 text-sapphire-500 text-sm text-center">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sapphire-400 text-sm">No groups yet.</p>
                <p className="text-sapphire-500 text-xs mt-1">Create one from Connections.</p>
              </div>
            ) : (
              groups.map((group) => {
                const isActive = activeGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => openGroupChat(group)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] text-left ${isActive ? 'bg-white/[0.04]' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white border border-cyan-neon/20 flex-shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h3 className="font-medium truncate text-white">{group.name}</h3>
                        {group.lastMessageTime && <span className="text-[10px] text-sapphire-500 flex-shrink-0 ml-2">{formatTimestamp(group.lastMessageTime)}</span>}
                      </div>
                      <p className="text-sm truncate text-sapphire-500">{group.lastMessage || `${group.members?.length || 0} members`}</p>
                    </div>
                  </button>
                );
              })
            ))}
          </div>
        </div>

        <div className={`flex-1 flex flex-col bg-sapphire-900/10 ${!hasActiveConversation && !showNewChat ? 'hidden md:flex' : 'flex'}`}>
          {!isGroupMode && !activeDirectChat && !showNewChat && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-sapphire-800/50 flex items-center justify-center border border-white/[0.05] mb-4">
                <MessageSquare className="w-8 h-8 text-cyan-dark" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
              <p className="text-sapphire-500 max-w-sm">
                Select a conversation from the sidebar or start a new message with someone in your network.
              </p>
            </div>
          )}

          {isGroupMode && !activeGroup && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-sapphire-800/50 flex items-center justify-center border border-white/[0.05] mb-4">
                <Users className="w-8 h-8 text-cyan-dark" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Group Chats</h2>
              <p className="text-sapphire-500 max-w-sm">Select a group from the sidebar to open chat.</p>
            </div>
          )}

          {showNewChat && !isGroupMode && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                <button onClick={() => setShowNewChat(false)} className="md:hidden text-sapphire-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-white">Start a New Chat</h2>
              </div>
              <div className="p-4 border-b border-white/[0.04] bg-sapphire-900/30">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sapphire-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search your network..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-sapphire-800/50 text-white placeholder:text-sapphire-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-neon/50 border border-white/[0.04]"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredNetwork.length === 0 ? (
                  <p className="text-sapphire-500 text-sm text-center py-4">No connections found in your network.</p>
                ) : (
                  filteredNetwork.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => startNewChat(person)}
                      className="w-full p-3 glass-panel rounded-xl flex items-center gap-4 hover:border-white/[0.1] transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-cyan-neon/20 overflow-hidden flex-shrink-0">
                        {person.photoURL ? (
                          <img src={person.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (person.name || person.fullName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{person.name || person.fullName}</h3>
                        <p className="text-xs text-sapphire-500">{person.organization || 'Vynco Member'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeDirectChat && !isGroupMode && (() => {
            const otherUserId = activeDirectChat.participants.find((id) => id !== user.uid);
            const otherUser = activeDirectChat.participantInfo?.[otherUserId] || { name: 'Unknown User' };

            return (
              <>
                <div className="p-4 border-b border-white/[0.04] bg-sapphire-900/40 flex items-center gap-4">
                  <button onClick={() => setActiveDirectChat(null)} className="md:hidden text-sapphire-400 hover:text-white flex-shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-cyan-neon/20 overflow-hidden flex-shrink-0">
                    {otherUser.photoURL ? (
                      <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (otherUser.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-semibold truncate">{otherUser.name}</h2>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {directMessages.map((msg) => {
                    const isMine = msg.senderId === user.uid;

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 rounded-br-sm' : 'bg-white/5 border border-white/10 text-sapphire-200 rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                        {msg.createdAt && (
                          <div className={`text-[10px] text-sapphire-500 mt-1 ${isMine ? 'text-right pr-1' : 'text-left pl-1'}`}>
                            {formatTimestamp(msg.createdAt)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/[0.04] bg-sapphire-900/20">
                  <form onSubmit={handleSendDirectMessage} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newDirectMessage}
                      onChange={(e) => setNewDirectMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-sapphire-900/50 text-white placeholder:text-sapphire-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-neon/50 border border-white/[0.04]"
                    />
                    <button
                      type="submit"
                      disabled={!newDirectMessage.trim()}
                      className="p-3 rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            );
          })()}

          {activeGroup && isGroupMode && (
            <>
              <div className="p-4 border-b border-white/[0.04] bg-sapphire-900/40 flex items-center gap-4">
                <button onClick={() => setActiveGroup(null)} className="md:hidden text-sapphire-400 hover:text-white flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white border border-cyan-neon/20">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold truncate">{activeGroup.name}</h2>
                  <p className="text-xs text-sapphire-500">{activeGroup.members?.length || 0} members</p>
                </div>
                {isGroupOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMembersModal(true)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold border border-cyan-neon/30 text-cyan-neon hover:bg-cyan-neon/10"
                    >
                      <UserPlus className="w-3.5 h-3.5 inline-block mr-1" /> Add Members
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManageMembersModal(true)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold border border-amber-300/40 text-amber-300 hover:bg-amber-300/10"
                    >
                      <UserMinus className="w-3.5 h-3.5 inline-block mr-1" /> Manage
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {groupMessages.length === 0 ? (
                  <div className="text-sm text-sapphire-500 text-center py-8">No messages yet. Start the conversation.</div>
                ) : (
                  groupMessages.map((msg) => {
                    const isMine = msg.senderId === user.uid;

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 rounded-br-sm' : 'bg-white/5 border border-white/10 text-sapphire-200 rounded-bl-sm'}`}>
                          {!isMine && <p className="text-[10px] text-cyan-neon mb-1 truncate">{msg.senderName || 'Member'}</p>}
                          {msg.text}
                        </div>
                        {msg.createdAt && (
                          <div className={`text-[10px] text-sapphire-500 mt-1 ${isMine ? 'text-right pr-1' : 'text-left pl-1'}`}>
                            {formatTimestamp(msg.createdAt)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/[0.04] bg-sapphire-900/20">
                <form onSubmit={handleSendGroupMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newGroupMessage}
                    onChange={(e) => setNewGroupMessage(e.target.value)}
                    placeholder="Message the group..."
                    className="flex-1 bg-sapphire-900/50 text-white placeholder:text-sapphire-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-neon/50 border border-white/[0.04]"
                  />
                  <button
                    type="submit"
                    disabled={!newGroupMessage.trim() || sendingGroupMessage}
                    className="p-3 rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddMembersModal && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel rounded-2xl p-8 w-full max-w-lg glow-border">
            <h3 className="text-xl font-bold text-white mb-2">Add Members</h3>
            <p className="text-sm text-sapphire-400 mb-4">Select people from your network to add to this group.</p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {addableMembers.length === 0 ? (
                <div className="text-xs text-sapphire-500 py-2">No additional network members available.</div>
              ) : (
                addableMembers.map((person) => {
                  const memberUid = person.uid || person.id;
                  const selected = selectedMembersToAdd.includes(memberUid);
                  return (
                    <button
                      key={memberUid}
                      type="button"
                      onClick={() => toggleMemberToAdd(memberUid)}
                      className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                        selected ? 'border-cyan-neon/30 bg-cyan-neon/10' : 'border-white/[0.06] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{person.fullName || person.name || 'User'}</div>
                        <div className="text-xs text-sapphire-500 truncate">{person.organization || person.company || 'Vynco Member'}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-cyan-neon bg-cyan-neon' : 'border-sapphire-600'}`}>
                        {selected && <Plus className="w-3 h-3 text-sapphire-900 rotate-45" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddMembersModal(false);
                  setSelectedMembersToAdd([]);
                }}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-sapphire-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMembers}
                disabled={addingMembers || selectedMembersToAdd.length === 0}
                className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all disabled:opacity-50"
              >
                {addingMembers ? 'Adding...' : 'Add Members'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManageMembersModal && activeGroup && isGroupOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-panel rounded-2xl p-8 w-full max-w-lg glow-border">
            <h3 className="text-xl font-bold text-white mb-2">Manage Group</h3>
            <p className="text-sm text-sapphire-400 mb-4">Remove members or delete the group permanently.</p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {memberProfiles.filter((m) => m.uid !== user.uid).length === 0 ? (
                <div className="text-xs text-sapphire-500 py-2">No removable members yet.</div>
              ) : (
                memberProfiles
                  .filter((member) => member.uid !== user.uid)
                  .map((member) => (
                    <div
                      key={member.uid}
                      className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{member.name}</div>
                        <div className="text-xs text-sapphire-500 truncate">{member.organization}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.uid)}
                        disabled={removingMemberId === member.uid}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-400/40 text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                      >
                        {removingMemberId === member.uid ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={deletingGroupId === activeGroup.id}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-red-400/40 text-red-300 hover:bg-red-400/10 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline-block mr-1" />
                {deletingGroupId === activeGroup.id ? 'Deleting...' : 'Delete Group'}
              </button>

              <button
                type="button"
                onClick={() => setShowManageMembersModal(false)}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-sapphire-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
