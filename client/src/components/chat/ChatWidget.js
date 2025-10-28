import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import ChatButton from './ChatButton';
import ChatList from './ChatList';
import ChatBox from './ChatBox';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

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
    setIsOpen(!isOpen);
    if (isOpen) {
      setSelectedChat(null);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleCloseChatList = () => {
    setIsOpen(false);
    // Don't close the chat box when closing the chat list
  };

  const handleCloseChatBox = () => {
    setSelectedChat(null);
  };

  if (!currentUserId) {
    return null; // Don't show chat widget if user is not logged in
  }

  return (
    <>
      <ChatButton onClick={handleChatButtonClick} isOpen={isOpen} />
      
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
