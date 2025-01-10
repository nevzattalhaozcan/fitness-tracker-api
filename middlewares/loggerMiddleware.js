const logger = require('../config/logger');

// Logger for all requests coming to server
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  logger.info(`Request: ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    logger.info(`Response: ${res.statusCode} ${res.statusMessage} ${responseTime}ms`);
  });

  // Pass control to the next middleware
  next(); 
};

module.exports = requestLogger;
