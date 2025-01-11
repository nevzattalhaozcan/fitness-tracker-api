const express = require('express');
const route = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const { pool } = require('../config/database');
const logger = require('../config/logger');

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
route.get('/', verifyToken, async (req, res) => {
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, height, weight FROM users'
    );

    res.json(result.rows);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export the router for use in the application
module.exports = route;
