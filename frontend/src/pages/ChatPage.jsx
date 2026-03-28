import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('channels'); // 'channels' or 'dms'
  const [channels, setChannels] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null); // For threads
  const [threads, setThreads] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [threadInput, setThreadInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showThreadPanel, setShowThreadPanel] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: useAuthStore.getState().token
      }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-user-room', user.id);
    });

    socketRef.current.on('new-message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketRef.current.on('new-dm', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketRef.current.on('user-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setTypingUsers(prev => prev.filter(uid => uid !== data.userId));
      }
    });

    return () => socketRef.current?.disconnect();
  }, [user.id]);

  // Fetch channels
  useEffect(() => {
    if (tab === 'channels') {
      const fetchChannels = async () => {
        try {
          const response = await api.get('/api/chat/channels');
          setChannels(response.data.data);
        } catch (error) {
          toast.error('Failed to load channels');
        }
      };
      fetchChannels();
    }
  }, [tab]);

  // Fetch conversations
  useEffect(() => {
    if (tab === 'dms') {
      const fetchConversations = async () => {
        try {
          const response = await api.get('/api/dm/conversations');
          setConversations(response.data.data);
        } catch (error) {
          toast.error('Failed to load conversations');
        }
      };
      fetchConversations();
    }
  }, [tab]);

  // Fetch messages when channel/conversation selected
  useEffect(() => {
    if (!selectedChannel && !selectedConversation) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        if (selectedChannel) {
          const response = await api.get(`/api/chat/channels/${selectedChannel.id}/messages`);
          setMessages(response.data.data);
          socketRef.current?.emit('join-channel', {
            channelId: selectedChannel.id,
            userId: user.id,
            companyId: user.company_id
          });
        } else if (selectedConversation) {
          const response = await api.get(`/api/dm/conversation/${selectedConversation.other_user_id}/messages`);
          setMessages(response.data.data);
          await api.put(`/api/dm/conversation/${selectedConversation.other_user_id}/read`);
          socketRef.current?.emit('join-user-room', user.id);
        }
        setThreads([]);
      } catch (error) {
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChannel, selectedConversation, user]);

  // Fetch threads when message selected
  useEffect(() => {
    if (!selectedMessage || !selectedChannel) return;

    const fetchThreads = async () => {
      try {
        const response = await api.get(`/api/threads/message/${selectedMessage.id}`);
        setThreads(response.data.data);
      } catch (error) {
        console.error('Failed to load threads');
      }
    };

    fetchThreads();
  }, [selectedMessage, selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, threads]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim()) {
      toast.error('Cannot send empty message');
      return;
    }

    if (selectedChannel) {
      const newMessage = {
        id: Date.now(),
        channelId: selectedChannel.id,
        userId: user.id,
        content: messageInput,
        companyId: user.company_id,
        userName: `${user.first_name || 'User'}`,
        createdAt: new Date(),
        replyCount: 0
      };

      socketRef.current?.emit('send-message', newMessage);
      setMessages(prev => [...prev, newMessage]);
    } else if (selectedConversation) {
      const newMessage = {
        id: Date.now(),
        senderId: user.id,
        recipientId: selectedConversation.other_user_id,
        content: messageInput,
        createdAt: new Date(),
        read_at: null
      };

      socketRef.current?.emit('send-dm', {
        ...newMessage,
        companyId: user.company_id
      });
      setMessages(prev => [...prev, newMessage]);
    }

    setMessageInput('');
  };

  const handleSendThread = (e) => {
    e.preventDefault();

    if (!threadInput.trim() || !selectedMessage) {
      toast.error('Reply cannot be empty');
      return;
    }

    const newThread = {
      id: Date.now(),
      parentMessageId: selectedMessage.id,
      userId: user.id,
      content: threadInput,
      first_name: user.first_name || 'User',
      created_at: new Date()
    };

    socketRef.current?.emit('send-thread-reply', {
      parentMessageId: selectedMessage.id,
      channelId: selectedChannel.id,
      userId: user.id,
      content: threadInput,
      companyId: user.company_id
    });

    setThreads(prev => [...prev, newThread]);
    setThreadInput('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Channels/DMs */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Tab switcher */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('channels')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              tab === 'channels'
                ? 'border-b-2 border-emerald-600 text-emerald-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => setTab('dms')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              tab === 'dms'
                ? 'border-b-2 border-emerald-600 text-emerald-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Messages
          </button>
        </div>

        {/* Header with action button */}
        <div className="p-4 border-b border-gray-200">
          {tab === 'channels' && (
            <button
              onClick={() => setShowCreateChannel(!showCreateChannel)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              + New Channel
            </button>
          )}
        </div>

        {/* Create Channel Form */}
        {showCreateChannel && tab === 'channels' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            // TODO: Handle channel creation
            setShowCreateChannel(false);
          }} className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-sm font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateChannel(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List - Channels or DMs */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'channels' ? (
            channels.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No channels</div>
            ) : (
              channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannel(channel);
                    setSelectedMessage(null);
                    setShowThreadPanel(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 transition ${
                    selectedChannel?.id === channel.id
                      ? 'bg-emerald-50 border-l-4 border-l-emerald-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-800 text-sm">
                    # {channel.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {channel.message_count} messages
                  </div>
                </button>
              ))
            )
          ) : (
            conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No conversations</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setSelectedMessage(null);
                    setShowThreadPanel(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 transition relative ${
                    selectedConversation?.id === conv.id
                      ? 'bg-emerald-50 border-l-4 border-l-emerald-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(conv.status)}`} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm">
                        {conv.first_name} {conv.last_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {conv.last_message}
                      </div>
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="absolute right-4 top-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex ${showThreadPanel ? 'gap-0' : ''}`}>
        {/* Messages Area */}
        <div className={`flex flex-col ${showThreadPanel ? 'w-1/2' : 'w-full'} border-right`}>
          {selectedChannel || selectedConversation ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedChannel ? `# ${selectedChannel.name}` : `${selectedConversation?.first_name} ${selectedConversation?.last_name}`}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedChannel?.department_name ? `${selectedChannel.department_name}` : 'Direct Message'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        setShowThreadPanel(true);
                      }}
                      className="w-full text-left hover:bg-gray-50 p-3 rounded transition group"
                    >
                      <div className="flex gap-3 mb-1">
                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-emerald-800">
                            {msg.userName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-gray-800">{msg.userName}</span>
                            <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{msg.content}</p>
                          {msg.reply_count > 0 && (
                            <p className="text-xs text-emerald-600 mt-1 group-hover:underline">
                              💬 {msg.reply_count} replies
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-6 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select {tab === 'channels' ? 'a channel' : 'a conversation'} to start</p>
            </div>
          )}
        </div>

        {/* Thread Panel */}
        {showThreadPanel && selectedMessage && (
          <div className="w-1/2 border-l border-gray-200 bg-gray-50 flex flex-col">
            {/* Thread Header */}
            <div className="border-b border-gray-200 px-6 py-4 bg-white flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Thread ({threads.length} replies)</h3>
              <button
                onClick={() => {
                  setShowThreadPanel(false);
                  setSelectedMessage(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* Parent Message */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-800">
                    {selectedMessage.userName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-800 text-sm">{selectedMessage.userName}</span>
                    <span className="text-xs text-gray-500">{formatTime(selectedMessage.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{selectedMessage.content}</p>
                </div>
              </div>
            </div>

            {/* Thread Replies */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {threads.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No replies yet</p>
              ) : (
                threads.map(thread => (
                  <div key={thread.id} className="bg-white p-3 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-blue-800">
                          {thread.first_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-1">
                          <span className="font-medium text-gray-800 text-xs">{thread.first_name}</span>
                          <span className="text-xs text-gray-500">{formatTime(thread.created_at)}</span>
                        </div>
                        <p className="text-gray-700 text-xs mt-1">{thread.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Thread Input */}
            <form onSubmit={handleSendThread} className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={threadInput}
                  onChange={(e) => setThreadInput(e.target.value)}
                  placeholder="Reply in thread..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Reply
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
  const { user } = useAuthStore();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: useAuthStore.getState().token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
      socketRef.current.emit('join-user-room', user.id);
    });

    socketRef.current.on('new-message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketRef.current.on('user-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setTypingUsers(prev => prev.filter(uid => uid !== data.userId));
      }
    });

    socketRef.current.on('user-joined', (data) => {
      toast.success(`${data.userId} joined the channel`);
    });

    socketRef.current.on('user-left', (data) => {
      toast.info(`${data.userId} left the channel`);
    });

    socketRef.current.on('online-users-count', (data) => {
      setOnlineUsers(data.count);
    });

    socketRef.current.on('message-edited', (data) => {
      setMessages(prev =>
        prev.map(msg => msg.id === data.messageId ? { ...msg, content: data.content } : msg)
      );
    });

    socketRef.current.on('message-deleted', (data) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    socketRef.current.on('reaction-added', (data) => {
      setMessages(prev =>
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, reactions: [...(msg.reactions || []), { emoji: data.emoji, userId: data.userId }] }
            : msg
        )
      );
    });

    socketRef.current.on('error', (error) => {
      toast.error(error.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user.id]);

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await api.get('/api/chat/channels');
        setChannels(response.data.data);
        if (response.data.data.length > 0 && !selectedChannel) {
          setSelectedChannel(response.data.data[0]);
        }
      } catch (error) {
        toast.error('Failed to load channels');
      }
    };

    fetchChannels();
  }, []);

  // Fetch messages when channel selected
  useEffect(() => {
    if (!selectedChannel) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/chat/channels/${selectedChannel.id}/messages`);
        setMessages(response.data.data);

        // Join channel via socket
        socketRef.current?.emit('join-channel', {
          channelId: selectedChannel.id,
          userId: user.id,
          companyId: user.company_id
        });

        // Get online users count
        socketRef.current?.emit('get-online-users', selectedChannel.id);
      } catch (error) {
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChannel, user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim()) {
      toast.error('Cannot send empty message');
      return;
    }

    if (!selectedChannel) {
      toast.error('Select a channel first');
      return;
    }

    socketRef.current?.emit('send-message', {
      channelId: selectedChannel.id,
      userId: user.id,
      content: messageInput,
      companyId: user.company_id
    });

    setMessageInput('');
    setTypingUsers([]);

    // Emit stop typing
    socketRef.current?.emit('user-typing', {
      channelId: selectedChannel.id,
      userId: user.id,
      isTyping: false
    });
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessageInput(value);

    if (selectedChannel && socketRef.current) {
      socketRef.current.emit('user-typing', {
        channelId: selectedChannel.id,
        userId: user.id,
        isTyping: value.length > 0
      });
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();

    if (!newChannelName.trim()) {
      toast.error('Channel name is required');
      return;
    }

    try {
      const response = await api.post('/api/chat/channels', {
        name: newChannelName,
        departmentId: null
      });

      setChannels(prev => [...prev, response.data.data]);
      setNewChannelName('');
      setShowCreateChannel(false);
      toast.success('Channel created');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create channel');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Channels */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Channels</h2>
          <button
            onClick={() => setShowCreateChannel(!showCreateChannel)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + New Channel
          </button>
        </div>

        {showCreateChannel && (
          <form onSubmit={handleCreateChannel} className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-sm font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateChannel(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-2 py-1 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          {channels.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No channels yet
            </div>
          ) : (
            channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 transition ${
                  selectedChannel?.id === channel.id
                    ? 'bg-emerald-50 border-l-4 border-l-emerald-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-800 text-sm">
                  # {channel.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {channel.message_count} messages
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChannel ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    # {selectedChannel.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedChannel.department_name} • {onlineUsers} online
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-emerald-800">
                        {msg.userName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-800">{msg.userName}</span>
                        <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mt-1">{msg.content}</p>
                      {msg.fileUrls && msg.fileUrls.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.fileUrls.map((fileUrl, idx) => (
                            <a
                              key={idx}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              📎 {fileUrl.split('/').pop()}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex gap-2 items-center text-sm text-gray-500">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </span>
                  <span>
                    {typingUsers.length === 1
                      ? 'Someone is typing...'
                      : `${typingUsers.length} people are typing...`}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-gray-200 p-6 bg-white"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
