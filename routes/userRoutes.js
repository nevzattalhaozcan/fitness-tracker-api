const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const verifyToken = require('../middlewares/authMiddleware');
const logger = require('../config/logger');
const validateUserRegistrationInput = require('../utils/validations');
require('dotenv').config();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         height:
 *           type: number
 *         weight:
 *           type: number
 *         isAdmin:
 *           type: boolean
 *     RegisterUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - height
 *         - weight
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         height:
 *           type: number
 *         weight:
 *           type: number
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     UpdateUser:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         height:
 *           type: number
 *         weight:
 *           type: number
 *     UpdateEmail:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *     UpdatePassword:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *           type: string
 *     UserStats:
 *       type: object
 *       properties:
 *         total_calories:
 *           type: integer
 *         avg_duration:
 *           type: number
 *         timeframe:
 *           type: string
 */

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *     responses:
 *       201:
 *         description: User registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       500:
 *         description: Database error
 */
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

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login user and generate a token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
 *     responses:
 *       200:
 *         description: User logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 userRole:
 *                   type: string
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /user/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh token is required
 *       403:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /user/me:
 *   get:
 *     summary: Get user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query('SELECT id, name, surname, email, phone, address, city, country, height, weight, "isAdmin" FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /user/stats:
 *   get:
 *     summary: Get user stats
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Timeframe for stats
 *     responses:
 *       200:
 *         description: User stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStats'
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /user/email:
 *   patch:
 *     summary: Update user email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEmail'
 *     responses:
 *       200:
 *         description: Email updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /user/password:
 *   patch:
 *     summary: Update user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePassword'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /user/attendance:
 *   post:
 *     summary: Add new attendance record
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - status
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date for attendance in YYYY-MM-DD format
 *               status:
 *                 type: string
 *                 enum: [present, absent]
 *                 description: Attendance status for the day
 *     responses:
 *       201:
 *         description: Attendance added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid input or duplicate attendance
 *       500:
 *         description: Server error
 */
router.post('/attendance', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { date, status } = req.body;
  
  if (!date || !status) {
    return res.status(400).json({ message: 'Date and status are required.' });
  }
  const formattedDate = new Date(date).toISOString().split('T')[0];

  if (status !== 'present' && status !== 'absent') {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required.' });
    }
    const formattedDate = new Date(date).toISOString().split('T')[0];

    if (status !== 'present' && status !== 'absent') {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    // Query to get attendance records for the user
    const checkResult = await pool.query(`
      SELECT jsonb_array_elements(attendance)->>'date' as logged_date
      FROM users 
      WHERE id = $1 AND attendance IS NOT NULL
    `, [userId]);

    // Check if the date already exists in the attendance records
    const dateExists = checkResult.rows.some(row => row.logged_date === formattedDate);
    if (dateExists) {
      return res.status(400).json({ message: 'Attendance for this day is already logged' });
    }

    // Initialize attendance array if null
    await pool.query(`
      UPDATE users 
      SET attendance = COALESCE(attendance, '[]'::jsonb) 
      WHERE id = $1 AND attendance IS NULL
    `, [userId]);

    // Add new attendance record
    await pool.query(`
      UPDATE users 
      SET attendance = attendance || $1::jsonb
      WHERE id = $2
    `, [JSON.stringify({ date: formattedDate, status }), userId]);

    res.status(201).json({ message: 'Attendance added successfully' });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /user/attendance:
 *   get:
 *     summary: Get user's attendance records
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                     enum: [present, absent]
 *       500:
 *         description: Server error
 */
router.get('/attendance', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query('SELECT attendance FROM users WHERE id = $1', [userId]);
    res.json(result.rows[0].attendance || []);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /user/attendance:
 *   put:
 *     summary: Update attendance record
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - status
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [present, absent]
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: No attendance record found for this date
 *       500:
 *         description: Server error
 */
router.put('/attendance', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { date, status } = req.body;

  if (!date || !status) {
    return res.status(400).json({ message: 'Date and status are required.' });
  }
  const formattedDate = new Date(date).toISOString().split('T')[0];

  if (status !== 'present' && status !== 'absent') {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    // First check if the attendance record exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM users,
        jsonb_array_elements(COALESCE(attendance, '[]'::jsonb)) att
        WHERE id = $1 AND att->>'date' = $2
      ) as exists
    `, [userId, formattedDate]);

    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ message: 'No attendance record found for this date' });
    }

    // If exists, proceed with update
    await pool.query(`
      UPDATE users 
      SET attendance = (
        SELECT jsonb_agg(
          CASE
            WHEN att->>'date' = $1 THEN 
              jsonb_build_object('date', $1::text, 'status', $2::text)
            ELSE att
          END
        )
        FROM jsonb_array_elements(COALESCE(attendance, '[]'::jsonb)) att
      )
      WHERE id = $3
      RETURNING attendance
    `, [formattedDate, status, userId]);

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /user/attendance:
 *   delete:
 *     summary: Delete attendance record
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       204:
 *         description: Attendance record deleted successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: No attendance record found for this date
 *       500:
 *         description: Server error
 */
router.delete('/attendance', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }
  const formattedDate = new Date(date).toISOString().split('T')[0];

  try {
    // First check if the attendance record exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM users,
        jsonb_array_elements(COALESCE(attendance, '[]'::jsonb)) att
        WHERE id = $1 AND att->>'date' = $2
      ) as exists
    `, [userId, formattedDate]);

    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ message: 'No attendance record found for this date' });
    }

    // If exists, proceed with deletion
    await pool.query(`
      UPDATE users SET attendance = (
        SELECT jsonb_agg(a)
        FROM jsonb_array_elements(attendance) a
        WHERE a->>'date' <> $1 -- Delete entry with matching date
      )
      WHERE id = $2
    `, [formattedDate, userId]);

    res.status(204).end();
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user.id;
  const { name, surname, phone, address, city, country, height, weight } = req.body;
  try {
    if (id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const result = await pool.query('UPDATE users SET name = $1, height = $2, weight = $3, surname = $4, phone = $5, address = $6, city = $7, country = $8 WHERE id = $9 RETURNING id, name, surname, phone, address, city, country, email, height, weight', 
      [name, height, weight, surname, phone, address, city, country, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
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
