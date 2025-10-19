const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

// Get all chats for a specific user
const getAllChatsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Getting chats for user:', userId);

    // Find all chats where the user is a participant
    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'fullName userName email')
    .populate('lastMessage.sender', 'fullName userName')
    .sort({ updatedAt: -1 });

    // Format the response to include the other participant's info
    const formattedChats = chats.map(chat => {
      const otherParticipant = chat.participants.find(
        participant => participant._id.toString() !== userId
      );

      return {
        _id: chat._id,
        otherParticipant: {
          _id: otherParticipant._id,
          fullName: otherParticipant.fullName,
          userName: otherParticipant.userName,
          email: otherParticipant.email
        },
        lastMessage: chat.lastMessage,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      data: formattedChats,
      message: "Chats retrieved successfully"
    });

  } catch (error) {
    console.error("Error getting chats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get messages for a specific chat
const getChatMessagesById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50, userId } = req.query;

    console.log('Getting messages for chat:', chatId, 'user:', userId);

    // Verify the chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Check if the current user is a participant in this chat
    if (userId && !chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this chat"
      });
    }

    // Get messages with pagination
    const messages = await Message.find({ chatId })
      .populate('sender', 'fullName userName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Reverse to get chronological order (oldest first)
    messages.reverse();

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(await Message.countDocuments({ chatId }) / limit),
        totalMessages: await Message.countDocuments({ chatId })
      },
      message: "Messages retrieved successfully"
    });

  } catch (error) {
    console.error("Error getting chat messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Create or get existing chat between two users
const createOrGetChat = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    console.log('Creating/getting chat between users:', userId1, userId2);

    if (!userId1 || !userId2) {
      return res.status(400).json({
        success: false,
        message: "Both user IDs are required"
      });
    }

    if (userId1 === userId2) {
      return res.status(400).json({
        success: false,
        message: "Cannot create chat with yourself"
      });
    }

    // Check if chat already exists between these users
    let chat = await Chat.findOne({
      participants: { $all: [userId1, userId2] }
    })
    .populate('participants', 'fullName userName email')
    .populate('lastMessage.sender', 'fullName userName');

    if (chat) {
      // Return existing chat
      const otherParticipant = chat.participants.find(
        participant => participant._id.toString() !== userId1
      );

      return res.status(200).json({
        success: true,
        data: {
          _id: chat._id,
          otherParticipant: {
            _id: otherParticipant._id,
            fullName: otherParticipant.fullName,
            userName: otherParticipant.userName,
            email: otherParticipant.email
          },
          lastMessage: chat.lastMessage,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        },
        message: "Existing chat retrieved successfully"
      });
    }

    // Create new chat
    chat = new Chat({
      participants: [userId1, userId2]
    });

    const savedChat = await chat.save();
    await savedChat.populate('participants', 'fullName userName email');

    const otherParticipant = savedChat.participants.find(
      participant => participant._id.toString() !== userId1
    );

    res.status(201).json({
      success: true,
      data: {
        _id: savedChat._id,
        otherParticipant: {
          _id: otherParticipant._id,
          fullName: otherParticipant.fullName,
          userName: otherParticipant.userName,
          email: otherParticipant.email
        },
        lastMessage: null,
        createdAt: savedChat.createdAt,
        updatedAt: savedChat.updatedAt
      },
      message: "New chat created successfully"
    });

  } catch (error) {
    console.error("Error creating/getting chat:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, senderId } = req.body;

    console.log('Send message request:', { chatId, content, senderId });

    if (!chatId || !content) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and content are required"
      });
    }

    // Verify the chat exists and user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send messages to this chat"
      });
    }

    // Create new message
    const message = new Message({
      chatId,
      sender: senderId,
      content: content.trim()
    });

    console.log('Creating message:', message);
    const savedMessage = await message.save();
    console.log('Message saved:', savedMessage);
    await savedMessage.populate('sender', 'fullName userName');

    // Update chat's last message
    chat.lastMessage = {
      messageId: savedMessage._id,
      content: savedMessage.content,
      sender: savedMessage.sender,
      createdAt: savedMessage.createdAt
    };
    await chat.save();

    res.status(201).json({
      success: true,
      data: savedMessage,
      message: "Message sent successfully"
    });

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Search users by username or email
const searchUsers = async (req, res) => {
  try {
    const { query, currentUserId } = req.query;
    console.log('Searching users with query:', query, 'excluding user:', currentUserId);

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { userName: searchRegex },
        { email: searchRegex },
        { fullName: searchRegex }
      ],
      status: 'active' // Only active users
    })
    .select('fullName userName email')
    .limit(10);

    res.status(200).json({
      success: true,
      data: users,
      message: "Users found successfully"
    });

  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getAllChatsByUserId,
  getChatMessagesById,
  createOrGetChat,
  sendMessage,
  searchUsers
};
