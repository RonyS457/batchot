const axios = require('axios');

const checkGrammar = async (text, language = 'en') => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }

  try {
    // This is a placeholder - in a real application, you would use a grammar checking API
    // Example using a mock API call:
    // const response = await axios.post('https://api.grammarcheck.com/check', {
    //   text,
    //   language
    // });
    
    // For now, let's implement a simple grammar check for demo purposes
    const corrections = [];
    
    // Example basic checks (expand these for real implementation)
    if (language === 'en') {
      // Check for double spaces
      if (text.includes('  ')) {
        corrections.push({
          original: text,
          corrected: text.replace(/  +/g, ' '),
          explanation: 'Removed double spaces'
        });
      }
      
      // Check for common mistakes
      const commonMistakes = [
        { wrong: /\bthier\b/g, right: 'their', explanation: 'Corrected spelling' },
        { wrong: /\byour\b(?=\s+(?:going|coming))/g, right: "you're", explanation: 'Corrected contraction' },
        { wrong: /\bit's\b(?=\s+(?:car|house|book))/g, right: 'its', explanation: 'Corrected possessive form' }
      ];
      
      for (const mistake of commonMistakes) {
        if (mistake.wrong.test(text)) {
          corrections.push({
            original: text,
            corrected: text.replace(mistake.wrong, mistake.right),
            explanation: mistake.explanation
          });
        }
      }
    }
    
    return corrections;
  } catch (error) {
    console.error('Grammar check error:', error);
    throw new Error('Grammar check failed');
  }
};

module.exports = { checkGrammar };
