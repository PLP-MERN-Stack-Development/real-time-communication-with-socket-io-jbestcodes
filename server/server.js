// JBest Chat Server - Week 5 Assignment
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: false
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store active users and messages
const activeUsers = new Map();
const messages = [];

// Basic API route
app.get('/', (req, res) => {
  res.json({
    message: 'JBest Chat Server is running!',
    status: 'online',
    users: activeUsers.size,
    totalMessages: messages.length
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`� User connected: ${socket.id}`);

  // Handle user joining
  socket.on('join', (userData) => {
    const { username } = userData;
    
    // Store user info
    activeUsers.set(socket.id, {
      id: socket.id,
      username: username,
      joinedAt: new Date().toISOString()
    });

    console.log(`👋 ${username} joined the chat`);
    
    // Notify all users about the new user
    socket.broadcast.emit('userJoined', {
      username: username,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString()
    });

    // Send current users list to the new user
    socket.emit('usersList', Array.from(activeUsers.values()));
    
    // Send recent messages to the new user
    socket.emit('messageHistory', messages.slice(-20)); // Send last 20 messages
  });

  // Handle new messages
  socket.on('sendMessage', (messageData) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now(),
      username: user.username,
      message: messageData.message,
      timestamp: new Date().toISOString()
    };

    // Store message
    messages.push(message);
    
    // Keep only last 100 messages in memory
    if (messages.length > 100) {
      messages.shift();
    }

    console.log(`💬 ${user.username}: ${message.message}`);

    // Broadcast message to all users
    io.emit('newMessage', message);
  });

  // Handle typing indicators
  socket.on('typing', (isTyping) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    socket.broadcast.emit('userTyping', {
      username: user.username,
      isTyping: isTyping
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    
    if (user) {
      console.log(`👋 ${user.username} left the chat`);
      
      // Remove user from active users
      activeUsers.delete(socket.id);
      
      // Notify other users
      socket.broadcast.emit('userLeft', {
        username: user.username,
        message: `${user.username} left the chat`,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 JBest Chat Server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to http://localhost:${PORT}`);
});