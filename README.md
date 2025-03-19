# Language Learning Chatbot

A real-time chat application for language learning, built with React, Node.js, Socket.IO, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a MongoDB Atlas connection string)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies for both server and client:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start MongoDB (if running locally)

4. Start the server:
```bash
cd server
npm start
```

5. Start the client (in a new terminal):
```bash
cd client
npm start
```

The application will be available at:
- Client: http://localhost:3000
- Server: http://localhost:4000

## Features

- Real-time messaging using Socket.IO
- Message persistence using MongoDB
- Modern UI with Material-UI components
- Responsive design
- Message history
- User identification

## Project Structure

```
batchot/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Application entry point
│   └── package.json       # Client dependencies
├── server/                 # Node.js backend
│   ├── server.js          # Server implementation
│   └── package.json       # Server dependencies
└── README.md              # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 