const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message too long']
  },
  sender: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true,
    maxlength: [50, 'Sender name too long']
  },
  language: {
    type: String,
    required: true,
    default: 'en'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  translations: [{
    language: String,
    text: String
  }],
  corrections: [{
    original: String,
    corrected: String,
    explanation: String,
    timestamp: Date
  }]
});

// Add indexes for better query performance
messageSchema.index({ timestamp: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
