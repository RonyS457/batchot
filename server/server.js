const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const io = require('socket.io');

const app = express();
const PORT = process.env.PORT || 4000;

mongoose.connect('mongodb://localhost/language_chatbot', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

io(server).on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('sendMessage', (message) => {
    console.log('Received message:', message);
    io.emit('newMessage', message);
  });
});

app.get('/', (req, res) => {
  res.send('Language Learning Chatbot API');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
