const express = require('express');
const app = express();
const cors = require('cors');
const userRoutes = require('../routes/userRoutes');
const workoutRoutes = require('../routes/workoutRoutes');
const adminRoutes = require('../routes/adminRoutes');
const activityRoutes = require('../routes/activityRoutes');
const workoutPlanRoutes = require('../routes/workoutPlanRoutes');
const logger = require('../config/logger');
const requestLogger = require('../middlewares/loggerMiddleware');
const { loginLimiter, generalLimiter } = require('../middlewares/rateLimiter');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv-safe').config();

/// Middleware setup
app.use(express.json());
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true
}));
app.use(requestLogger);
app.use(cookieParser());
app.use(generalLimiter);
app.use(helmet());

// Error-handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Test route
app.get('/', (req, res) => {
  res.send('Fitness Tracker API is running');
});

/// Routes
app.use('/user', userRoutes);
app.use('/user/login', loginLimiter);
app.use('/workout', workoutRoutes);
app.use('/admin', adminRoutes);
app.use('/activity', activityRoutes);
app.use('/workout-plan', workoutPlanRoutes);

// Start the server
//const PORT = process.env.PORT || 3000;
const backend_server = 'https://fitness-tracker-api-x3cg.onrender.com'
app.listen(PORT, () => {
  logger.info(`Server running on ${backend_server}`);
});