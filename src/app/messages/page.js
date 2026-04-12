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
  fetchPopulatedConnections
} from '@/lib/firestore';
import { Send, ArrowLeft, MessageSquare, Search } from 'lucide-react';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [network, setNetwork] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const targetUserId = searchParams.get('userId');

  // Load user's network for creating new chats
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

  // Subscribe to all chats for this user
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = subscribeToChats(user.uid, (data) => {
      setChats(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Handle URL param ?userId=X to init/open chat
  useEffect(() => {
    if (!user || !profile || !targetUserId || network.length === 0) return;
    
    async function initChat() {
      const targetUser = network.find(n => n.id === targetUserId);
      if (!targetUser) return; // if not in network, maybe ignore or fetch them differently
      
      try {
        const userInfo = {
          name: profile.fullName || profile.name || 'User',
          photoURL: profile.photoURL || null
        };
        const targetInfo = {
          name: targetUser.fullName || targetUser.name || 'User',
          photoURL: targetUser.photoURL || null
        };
        
        const chat = await getOrCreateChat(user.uid, targetUserId, userInfo, targetInfo);
        openChat(chat);
        // Clear param from url quietly
        router.replace('/messages', undefined, { shallow: true });
      } catch (err) {
        console.error('Failed to init chat:', err);
      }
    }
    
    initChat();
  }, [user, profile, targetUserId, network, router]);

  // Subscribe to active chat messages
  useEffect(() => {
    if (!activeChat || !user) return;

    markChatAsRead(activeChat.id, user.uid);
    
    const unsubscribe = subscribeToMessages(activeChat.id, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
    });
    return () => unsubscribe();
  }, [activeChat, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openChat = (chat) => {
    setActiveChat(chat);
    setShowNewChat(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;

    const text = newMessage.trim();
    setNewMessage('');
    
    // Find the other participant's ID
    const otherUserId = activeChat.participants.find(id => id !== user.uid);
    try {
      await sendMessage(activeChat.id, user.uid, otherUserId, text);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const startNewChat = async (targetUser) => {
    if (!user || !profile) return;
    try {
      const userInfo = {
        name: profile.fullName || profile.name || 'User',
        photoURL: profile.photoURL || null
      };
      const targetInfo = {
        name: targetUser.fullName || targetUser.name || 'User',
        photoURL: targetUser.photoURL || null
      };
      
      const chat = await getOrCreateChat(user.uid, targetUser.id, userInfo, targetInfo);
      openChat({ ...chat, participantInfo: { [user.uid]: userInfo, [targetUser.id]: targetInfo } });
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const filteredNetwork = network.filter(n => {
    const term = searchQuery.toLowerCase();
    const name = (n.fullName || n.name || '').toLowerCase();
    return name.includes(term);
  });

  if (!user) return <div className="section-container py-20 text-center"><p className="text-white">Please sign in to view messages.</p></div>;

  return (
    <div className="section-container py-10 h-[calc(100vh-64px)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Messages</h1>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex border border-white/[0.04]">
        
        {/* Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 flex-col border-r border-white/[0.04] bg-sapphire-900/30 ${activeChat || showNewChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/[0.04]">
            <button 
              onClick={() => { setShowNewChat(true); setActiveChat(null); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> New Message
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sapphire-500 text-sm text-center">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sapphire-400 text-sm">No recent chats.</p>
              </div>
            ) : (
              chats.map(chat => {
                const otherUserId = chat.participants.find(id => id !== user.uid);
                const otherUser = chat.participantInfo?.[otherUserId] || { name: 'Unknown User' };
                const isUnread = (chat.unreadCount?.[user.uid] || 0) > 0;
                const isActive = activeChat?.id === chat.id;

                return (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] text-left ${isActive ? 'bg-white/[0.04]' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sapphire-600 to-sapphire-800 flex items-center justify-center text-white font-bold border border-cyan-neon/20 overflow-hidden flex-shrink-0 relative">
                      {otherUser.photoURL ? (
                        <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (otherUser.name || 'U').charAt(0).toUpperCase()
                      )}
                      {isUnread && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-sapphire-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h3 className={`font-medium truncate ${isUnread ? 'text-white' : 'text-sapphire-200'}`}>
                          {otherUser.name}
                        </h3>
                        {chat.lastMessageTime && (
                          <span className="text-[10px] text-sapphire-500 flex-shrink-0 ml-2">
                            {formatTimestamp(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${isUnread ? 'text-cyan-neon font-medium' : 'text-sapphire-500'}`}>
                        {chat.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col bg-sapphire-900/10 ${!activeChat && !showNewChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Default Empty State */}
          {!activeChat && !showNewChat && (
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

          {/* New Chat Area */}
          {showNewChat && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                <button 
                  onClick={() => setShowNewChat(false)}
                  className="md:hidden text-sapphire-400 hover:text-white"
                >
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
                  filteredNetwork.map(person => (
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

          {/* Active Chat Thread */}
          {activeChat && !showNewChat && (() => {
            const otherUserId = activeChat.participants.find(id => id !== user.uid);
            const otherUser = activeChat.participantInfo?.[otherUserId] || { name: 'Unknown User' };

            return (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/[0.04] bg-sapphire-900/40 flex items-center gap-4">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden text-sapphire-400 hover:text-white flex-shrink-0"
                  >
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

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {messages.map((msg, index) => {
                    const isMine = msg.senderId === user.uid;
                    const showTime = index === 0 || msg.createdAt?.seconds - messages[index - 1].createdAt?.seconds > 300;
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        {showTime && msg.createdAt && (
                          <div className="text-[10px] text-sapphire-500 mb-2 w-full text-center">
                            {formatTimestamp(msg.createdAt)}
                          </div>
                        )}
                        <div 
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            isMine 
                            ? 'bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 rounded-br-sm' 
                            : 'bg-white/5 border border-white/10 text-sapphire-200 rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-white/[0.04] bg-sapphire-900/20">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-sapphire-900/50 text-white placeholder:text-sapphire-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-neon/50 border border-white/[0.04]"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-3 rounded-xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
