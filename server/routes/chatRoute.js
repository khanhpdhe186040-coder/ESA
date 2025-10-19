const express = require("express");
const chatRouter = express.Router();
const{getAllChatsByUserId, getChatMessagesById, createOrGetChat, sendMessage, searchUsers} = require("../controllers/chatController");

// Get all chats for current user
chatRouter.get("/user/:userId", getAllChatsByUserId);

// Get messages for a specific chat
chatRouter.get("/:chatId/messages", getChatMessagesById);

// Create or get existing chat between two users
chatRouter.post("/create", createOrGetChat);

// Send a message
chatRouter.post("/send", sendMessage);

// Search users by username or email
chatRouter.get("/search/users", searchUsers);

module.exports = chatRouter;
