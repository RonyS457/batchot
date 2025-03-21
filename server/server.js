require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const io = require('socket.io');
const rateLimit = require('express-rate-limit');
const Message = require('./models/message');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 4000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// MongoDB Connection with error handling and retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/language_chatbot', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000',
  methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '10kb' }));
app.use(limiter);

const server = http.createServer(app);

// Socket.IO with error handling and connection management
const socketIO = io(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Keep track of connected users
const connectedUsers = new Map();

socketIO.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send previous messages to new client
  Message.find()
    .sort({ timestamp: -1 })
    .limit(50)
    .exec()
    .then(messages => {
      socket.emit('previousMessages', messages.reverse());
    })
    .catch(err => {
      console.error('Error fetching previous messages:', err);
      socket.emit('error', { message: 'Failed to fetch message history' });
    });

  socket.on('userJoined', (userName) => {
    connectedUsers.set(socket.id, userName);
    socketIO.emit('userList', Array.from(connectedUsers.values()));
  });

  socket.on('disconnect', () => {
    const userName = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    socketIO.emit('userList', Array.from(connectedUsers.values()));
    console.log('Client disconnected:', socket.id, userName);
  });

  socket.on('sendMessage', async (message) => {
    try {
      validateMessageInput(message);
      
      // Process language and translations if available
      const language = message.language || 'en';
      
      // Create and save the message with proper validation
      const newMessage = new Message({
        text: message.text.trim(),
        sender: message.sender.trim(),
        language,
        timestamp: new Date()
      });
      
      await newMessage.save();
      
      // Emit to all clients
      socketIO.emit('newMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// API endpoints with error handling
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/', (req, res) => {
  res.send('Language Learning Chatbot API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Connect to MongoDB before starting the server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

const validateMessageInput = (message) => {
  if (!message || typeof message !== 'object') {
    throw new Error('Invalid message format');
  }
  
  if (!message.text || typeof message.text !== 'string' || message.text.trim().length === 0) {
    throw new Error('Message text is required');
  }
  
  if (!message.sender || typeof message.sender !== 'string' || message.sender.trim().length === 0) {
    throw new Error('Sender name is required');
  }
  
  if (message.text.length > 1000) {
    throw new Error('Message is too long (max 1000 characters)');
  }
  
  if (message.sender.length > 50) {
    throw new Error('Sender name is too long (max 50 characters)');
  }
  
  return true;
};
