const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const io = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Message Schema with validation
const messageSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message cannot be longer than 1000 characters']
  },
  sender: { 
    type: String, 
    required: [true, 'Sender name is required'],
    trim: true,
    maxlength: [50, 'Sender name cannot be longer than 50 characters']
  },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// MongoDB Connection with error handling and retry logic
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost/language_chatbot', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

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
      ? 'https://your-production-domain.com' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
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
      // Validate message
      if (!message.text?.trim() || !message.sender?.trim()) {
        throw new Error('Invalid message format');
      }

      // Sanitize input
      const sanitizedMessage = {
        text: message.text.trim(),
        sender: message.sender.trim(),
        timestamp: new Date()
      };

      // Create and save new message
      const newMessage = new Message(sanitizedMessage);
      await newMessage.save();

      // Broadcast message to all connected clients
      socketIO.emit('newMessage', newMessage);
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { 
        message: error.message || 'Failed to process message',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
