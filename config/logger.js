const winston = require('winston');
const { combine, timestamp, printf } = winston.format;

// Define custom log format
const customFormat = printf(({ timestamp, level, message, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// Create a logger instance
const logger = winston.createLogger({
  level: 'info', 
  format: combine(
    timestamp(), 
    customFormat
  ),
  transports: [
    new winston.transports.Console({ 
      format: combine(customFormat), 
    })
  ],
});

module.exports = logger;
