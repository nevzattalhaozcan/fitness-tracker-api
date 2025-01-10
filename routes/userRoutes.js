const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const verifyToken = require('../middlewares/authMiddleware');
const logger = require('../config/logger');
const validateUserRegistrationInput = require('../utils/validations');
require('dotenv').config();

// Route: Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, height, weight } = req.body;
  const errors = validateUserRegistrationInput(name, email, password, height, weight);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (name, email, password, height, weight) VALUES ($1, $2, $3, $4, $5) RETURNING id', [name, email, hashedPassword, height, weight]);
    res.status(201).json({ message: 'User registered', userId: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    logger.error(error.stack || error.message || error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Route: Login user and generate a token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
    res.json({ accessToken, userRole: user.isAdmin ? 'admin' : 'user' });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logger.error('Database connection refused:', error);
      return res.status(500).json({ message: 'Database connection refused.' });
    }
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.SECRET_KEY, { expiresIn: '15m' });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.SECRET_KEY, { expiresIn: '7d' });
}

// Route: Create new access token with refresh token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required.' });
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.SECRET_KEY);
    const result = await pool.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [payload.id, refreshToken]);
    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }
    const user = result.rows[0];
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid or expired refresh token.' });
  }
});

// Route: Get user details (requires authentication)
router.get('/me', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query('SELECT id, name, email, height, weight, "isAdmin" FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Get stats for the user, including total calories burned and average workout duration
router.get('/stats', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { timeframe } = req.query;
  let interval;
  switch (timeframe) {
    case 'daily':
      interval = '1 day';
      break;
    case 'weekly':
      interval = '7 days';
      break;
    case 'monthly':
      interval = '1 month';
      break;
    default:
      interval = null;
  }
  try {
    let query = 'SELECT SUM(calories_burned) AS total_calories, AVG(duration) AS avg_duration FROM activities WHERE user_id = $1';
    const params = [userId];
    if (interval) {
      query += ` AND date >= NOW() - INTERVAL '${interval}'`;
    }
    const result = await pool.query(query, params);
    res.json({
      total_calories: parseInt(result.rows[0].total_calories || 0, 10),
      avg_duration: parseFloat(parseFloat(result.rows[0].avg_duration || 0).toFixed(2)),
      timeframe: timeframe || 'lifetime',
    });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Update user details
router.put('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const { name, height, weight } = req.body;
  try {
    if (id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const result = await pool.query('UPDATE users SET name = $1, height = $2, weight = $3 WHERE id = $4 RETURNING id, name, email, height, weight', [name, height, weight, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Update email
router.patch('/email', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { email } = req.body;

  // Ensure required fields are provided
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const result = await pool.query('UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email', [
      email,
      userId,
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Update password
router.patch('/password', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;

  // Ensure required fields are provided
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Delete user
router.delete('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user.id;

  try {
    // Allow deletion only by the user themselves or an admin
    if (id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(204).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export the router for use in the app
module.exports = router;
