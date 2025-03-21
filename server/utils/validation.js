// server/utils/validation.js
module.exports = {
  validateMessage: (message) => {
    if (!message.text?.trim() || !message.sender?.trim()) {
      throw new Error('Message and sender are required');
    }
    if (message.text.length > 1000) {
      throw new Error('Message is too long');
    }
    return true;
  }
};