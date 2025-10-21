import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useSocket } from '../../contexts/SocketContext';

const ChatBox = ({ chat, onClose, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { socket, joinChat, leaveChat, sendMessage, sendTyping } = useSocket();

  useEffect(() => {
    if (chat && chat._id) {
      fetchMessages();
      joinChat(chat._id);
    }
    
    return () => {
      if (chat && chat._id) {
        leaveChat(chat._id);
      }
    };
  }, [chat, joinChat, leaveChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [isTyping]);

  // Socket event listeners
  useEffect(() => {
    if (socket && chat?._id) {
      socket.on('new-message', (data) => {
        if (data.chatId === chat._id) {
          // Add the new message to the list
          const newMessage = {
            _id: Date.now().toString(), // Temporary ID for real-time messages
            content: data.message,
            sender: { _id: data.senderId },
            createdAt: data.timestamp
          };
          setMessages(prev => [...prev, newMessage]);
        }
      });

      socket.on('user-typing', (data) => {
        if (data.userId !== currentUserId) {
          setTypingUser(data.userId);
          setIsTyping(data.isTyping);
          
          // Clear typing indicator after 3 seconds
          if (data.isTyping) {
            setTimeout(() => {
              setIsTyping(false);
              setTypingUser(null);
            }, 3000);
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new-message');
        socket.off('user-typing');
      }
    };
  }, [socket, chat, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!chat) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:9999/api/chat/${chat._id}/messages?userId=${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !chat?._id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Immediately refocus the input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    try {
      setSending(true);
      
      // Send via Socket.IO for real-time delivery
      sendMessage(chat._id, messageContent, currentUserId);
      
      // Also save to database via API
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:9999/api/chat/send', {
        chatId: chat._id,
        content: messageContent,
        senderId: currentUserId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update the message with the real ID from database
        setMessages(prev => prev.map(msg => 
          msg._id === Date.now().toString() 
            ? { ...response.data.data, sender: { _id: currentUserId } }
            : msg
        ));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Revert the message if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      // Additional focus restoration after async operations complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (chat?._id && currentUserId) {
      if (value.trim()) {
        sendTyping(chat._id, currentUserId, true);
      } else {
        sendTyping(chat._id, currentUserId, false);
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chat) return null;

  return (
    <div className="fixed bottom-6 right-[400px] z-40 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {chat.otherParticipant.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{chat.otherParticipant.fullName}</h4>
            <p className="text-xs text-gray-500">@{chat.otherParticipant.userName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
          title="Close chat"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.sender._id === currentUserId;
              return (
                <div
                  key={message._id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                  <p className="text-sm italic">Someone is typing...</p>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
            autoFocus
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              !newMessage.trim() || sending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
