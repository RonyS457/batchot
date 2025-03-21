const translate = require('@vitalets/google-translate-api');
const NodeCache = require('node-cache');

// Cache translations for 1 hour
const translationCache = new NodeCache({ stdTTL: 3600 });

// Implement rate limiting
const rateLimiter = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,     // Maximum 100 requests per minute
  requests: {},
  
  canMakeRequest: function(userId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clear old entries
    this.requests = Object.entries(this.requests)
      .filter(([_, timestamp]) => timestamp > windowStart)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    
    // Count requests for this user
    const userRequests = Object.entries(this.requests)
      .filter(([key, _]) => key.startsWith(userId))
      .length;
    
    if (userRequests >= this.maxRequests) {
      return false;
    }
    
    // Record this request
    const requestId = `${userId}-${now}`;
    this.requests[requestId] = now;
    return true;
  }
};

// Validate input parameters
const validateTranslationParams = (text, targetLang) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text for translation');
  }
  
  if (!targetLang || typeof targetLang !== 'string') {
    throw new Error('Invalid target language');
  }
  
  // List of supported languages
  const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja'];
  if (!supportedLanguages.includes(targetLang)) {
    throw new Error(`Unsupported language: ${targetLang}`);
  }
  
  return true;
};

// Alternative translation service as fallback
const fallbackTranslate = async (text, targetLang) => {
  // In a real app, you would implement a different translation service
  // This is just a placeholder
  console.log('Using fallback translation service');
  return `[FALLBACK] ${text}`;
};

const translateText = async (text, targetLang, userId = 'anonymous') => {
  try {
    // Validate input
    validateTranslationParams(text, targetLang);
    
    // Check rate limits
    if (!rateLimiter.canMakeRequest(userId)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Check cache first
    const cacheKey = `${text}-${targetLang}`;
    const cachedTranslation = translationCache.get(cacheKey);
    if (cachedTranslation) {
      return cachedTranslation;
    }
    
    // Perform translation
    try {
      const result = await translate(text, { to: targetLang });
      const translatedText = result.text;
      
      // Cache the result
      translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (primaryError) {
      console.error('Primary translation service failed:', primaryError);
      
      // Try fallback translation service
      const fallbackResult = await fallbackTranslate(text, targetLang);
      return fallbackResult;
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

module.exports = { translateText };