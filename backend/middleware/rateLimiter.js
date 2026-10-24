const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'अत्यधिक अनुरोध। कृपया कुछ समय बाद पुनः प्रयास करें।',
  },
});

// Stricter rate limiter specifically for vote submission
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 votes/minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'बहुत तेज़ी से वोटिंग अनुरोध प्राप्त हो रहे हैं। कृपया कुछ क्षण प्रतीक्षा करें।',
  },
});

module.exports = {
  apiLimiter,
  voteLimiter,
};
