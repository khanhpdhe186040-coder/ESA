import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useSocket } from '../../contexts/SocketContext';

const ChatList = ({ onChatSelect, onClose, currentUserId }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (currentUserId) {
      fetchChats();
    }
  }, [currentUserId]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:9999/api/chat/user/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setChats(response.data.data);
      }
    } catch (err) {
      setError('Failed to load chats');
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for new messages in real-time and update lastMessage in the list
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleNewMessage = (data) => {
      // Update the chat's last message and bubble it to the top
      setChats((prevChats) => {
        const index = prevChats.findIndex((c) => c._id === data.chatId);
        const newLastMessage = {
          content: data.message,
          createdAt: data.timestamp,
          sender: { _id: data.senderId }
        };

        if (index !== -1) {
          const updatedChat = { ...prevChats[index], lastMessage: newLastMessage };
          const remaining = prevChats.filter((_, i) => i !== index);
          return [updatedChat, ...remaining];
        }

        // If chat not found (e.g., newly created), refetch the list
        fetchChats();
        return prevChats;
      });
    };

    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, currentUserId]);

  const searchUsers = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:9999/api/chat/search/users?query=${encodeURIComponent(query)}&currentUserId=${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const startNewChat = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:9999/api/chat/create', {
        userId1: currentUserId,
        userId2: user._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        onChatSelect(response.data.data);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        fetchChats(); // Refresh chat list
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  return (
    <div className="fixed bottom-6 right-20 z-40 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Messages</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Search users"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            title="Close"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Section */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => startNewChat(user)}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded flex items-center space-x-2"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{user.fullName}</div>
                    <div className="text-xs text-gray-500">@{user.userName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No conversations yet</p>
              <p className="text-sm">Search for users to start chatting</p>
            </div>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => onChatSelect(chat)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {chat.otherParticipant.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 truncate">
                      {chat.otherParticipant.fullName}
                    </h4>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
