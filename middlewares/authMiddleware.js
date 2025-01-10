const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
require('dotenv').config();

// Middleware function to verify and decode a JWT token
const verifyToken = async (req, res, next) => {
  let token = '';
  
  // Extract the token from the Authorization header (in the format "Bearer <token>")
  if (req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Fallback to checking cookies
  if (!token && req.cookies?.authToken) {
    token = req.cookies.authToken;
  }

  
  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  try {
    const secret_key = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secret_key);
    req.user = decoded;

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Export the middleware for use in other parts of the application
module.exports = verifyToken;