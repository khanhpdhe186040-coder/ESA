import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import ChatButton from './ChatButton';
import ChatList from './ChatList';
import ChatBox from './ChatBox';
import { useSocket } from '../../contexts/SocketContext';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = jwtDecode(token);
        if (payload?.id) {
          setCurrentUserId(payload.id);
        }
      }
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  }, []);

  const handleChatButtonClick = () => {
    if (isOpen) {
      // If chat list is open, close it but keep chat box open if it exists
      setIsOpen(false);
    } else {
      // If chat list is closed, open it
      setIsOpen(true);
      // Opening the list counts as viewing messages
      setUnreadCount(0);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    // Selecting a chat means user is viewing messages
    setUnreadCount(0);
  };

  const handleCloseChatList = () => {
    setIsOpen(false);
    // Don't close the chat box when closing the chat list
  };

  const handleCloseChatBox = () => {
    setSelectedChat(null);
  };

  // Track unread messages via socket
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleNewMessage = (data) => {
      // Only count messages from other users
      if (data.senderId === currentUserId) return;

      const messageIsForOpenChat = selectedChat && data.chatId === selectedChat._id;
      const chatUIVisible = isOpen || Boolean(selectedChat);

      // If the user is not currently viewing the conversation where the
      // message arrived, increase unread count
      if (!(chatUIVisible && messageIsForOpenChat)) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, currentUserId, isOpen, selectedChat]);

  if (!currentUserId) {
    return null; // Don't show chat widget if user is not logged in
  }

  return (
    <>
      <ChatButton onClick={handleChatButtonClick} isOpen={isOpen || selectedChat} unreadCount={unreadCount} />
      
      {isOpen && (
        <ChatList
          onChatSelect={handleChatSelect}
          onClose={handleCloseChatList}
          currentUserId={currentUserId}
        />
      )}
      
      {selectedChat && (
        <ChatBox
          chat={selectedChat}
          onClose={handleCloseChatBox}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
};

export default ChatWidget;
