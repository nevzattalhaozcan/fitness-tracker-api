const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const verifyToken = require('../middlewares/authMiddleware');
const logger = require('../config/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Workout:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         muscle:
 *           type: string
 *         sets:
 *           type: integer
 *         repeats:
 *           type: integer
 *         calories_burned:
 *           type: integer
 *         met_value:
 *           type: number
 *     CreateWorkout:
 *       type: object
 *       required:
 *         - name
 *         - muscle
 *         - sets
 *         - repeats
 *       properties:
 *         name:
 *           type: string
 *         muscle:
 *           type: string
 *         sets:
 *           type: integer
 *         repeats:
 *           type: integer
 *         calories_burned:
 *           type: integer
 *     UpdateWorkout:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         muscle:
 *           type: string
 *         sets:
 *           type: integer
 *         repeats:
 *           type: integer
 *         calories_burned:
 *           type: integer
 */

/**
 * @swagger
 * /workout:
 *   get:
 *     summary: Get all workouts
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all workouts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workout'
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, muscle, sets, repeats, calories_burned, met_value FROM workouts');
    res.json(result.rows);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).send({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /workout/{id}:
 *   get:
 *     summary: Get a specific workout by ID
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The workout ID
 *     responses:
 *       200:
 *         description: A specific workout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
 *       404:
 *         description: Workout not found
 *       500:
 *         description: Server error
 */
router.get('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('SELECT id, name, muscle, sets, repeats, calories_burned, met_value FROM workouts WHERE id = $1', [id]);
    const workout = result.rows[0];
    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json(workout);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).send({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /workout:
 *   post:
 *     summary: Add a new workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkout'
 *     responses:
 *       201:
 *         description: Workout added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workoutId:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const { name, muscle, sets, repeats, calories_burned } = req.body;
  const userId = req.user.id;
  if (!name || !muscle || !sets || !repeats) {
    return res.status(400).json({ message: 'Name, muscle, sets, and repeats are required.' });
  }
  try {
    const result = await pool.query('INSERT INTO workouts (name, muscle, sets, repeats, calories_burned, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [name, muscle, sets, repeats, calories_burned, userId]);
    res.status(201).json({ message: 'Workout added!', workoutId: result.rows[0].id });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Database error' });
  }
});

/**
 * @swagger
 * /workout/{id}:
 *   put:
 *     summary: Update an existing workout by ID
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The workout ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkout'
 *     responses:
 *       200:
 *         description: Workout updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Workout not found
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const id = parseInt(req.params.id, 10);
  const { name, muscle, sets, repeats, calories_burned } = req.body;
  try {
    const result = await pool.query('UPDATE workouts SET name = $1, muscle = $2, sets = $3, repeats = $4, calories_burned = $5 WHERE id = $6 RETURNING id', [name, muscle, sets, repeats, calories_burned, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.json({ message: 'Workout updated successfully' });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /workout/{id}:
 *   delete:
 *     summary: Delete a workout by ID
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The workout ID
 *     responses:
 *       204:
 *         description: Workout deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Workout not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const id = parseInt(req.params.id, 10);
  try {
    const result = await pool.query('DELETE FROM workouts WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Workout not found' });
    }
    res.status(204).json();
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
