require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
  })
);

const connectDB = require("./connect/database");
const classRoute = require("./routes/classRoute");
const userRoute = require("./routes/userRoute");
const roleRoute = require("./routes/roleRoute");
const courseRoute = require("./routes/courseRoute");
const slotRoute = require("./routes/slotRoute");
const newRoute = require("./routes/newRoute");
const quizRouter = require('./routes/quizRoute');
const chatRoute = require('./routes/chatRoute');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/classes", classRoute);
app.use("/api/users", userRoute);
app.use("/api/roles", roleRoute);
app.use("/api/courses", courseRoute);
app.use("/api/slots", slotRoute);
app.use("/api/news", newRoute);
app.use("/api/rooms", require("./routes/roomRoute"));
app.use("/api/teacher", require("./routes/teacherRoute"));
app.use('/api/quiz', quizRouter);
app.use('/api/chat', chatRoute);
const studentRoute = require("./routes/studentRoute");


app.use("/api/schedule", require("./routes/scheduleRoute"));
app.use("/api/teacher", require("./routes/teacherRoute"));
app.use("/api/student", studentRoute);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpressJS" });
});

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle joining a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // Handle leaving a chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User left chat: ${chatId}`);
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { chatId, message, senderId } = data;
      
      // Broadcast message to all users in the chat room
      io.to(chatId).emit('new-message', {
        chatId,
        message,
        senderId,
        timestamp: new Date()
      });
      
      console.log(`Message sent in chat ${chatId}:`, message);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 9999;
const HOSTNAME = "0.0.0.0";

server.listen(PORT, HOSTNAME, () => {
  console.log(`✅ Server is running at http://${HOSTNAME}:${PORT}`);
  // console.log(`✅ Swagger is running at http://localhost:${PORT}/api-docs`);
  connectDB();
});
