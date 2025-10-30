import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const payload = jwtDecode(token);
                const userId = payload?.id;

                if (userId) {
                    const newSocket = io('http://localhost:9999', {
                        auth: {
                            token: token
                        }
                    });

                    newSocket.on('connect', () => {
                        console.log('Connected to server');
                        setIsConnected(true);
                        newSocket.emit('join', userId);
                    });

                    newSocket.on('disconnect', () => {
                        console.log('Disconnected from server');
                        setIsConnected(false);
                    });

                    newSocket.on('connect_error', (error) => {
                        console.error('Connection error:', error);
                        setIsConnected(false);
                    });

                    setSocket(newSocket);

                    return () => {
                        newSocket.close();
                    };
                }
            }
        } catch (error) {
            console.error('Error initializing socket:', error);
        }
    }, []);

    const joinChat = (chatId) => {
        if (socket) {
            socket.emit('join-chat', chatId);
        }
    };

    const leaveChat = (chatId) => {
        if (socket) {
            socket.emit('leave-chat', chatId);
        }
    };

    const sendMessage = (chatId, message, senderId) => {
        if (socket) {
            socket.emit('send-message', {
                chatId,
                message,
                senderId
            });
        }
    };

    const sendTyping = (chatId, userId, isTyping) => {
        if (socket) {
            socket.emit('typing', {
                chatId,
                userId,
                isTyping
            });
        }
    };

    const value = {
        socket,
        isConnected,
        joinChat,
        leaveChat,
        sendMessage,
        sendTyping
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
