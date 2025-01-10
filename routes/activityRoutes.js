const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const verifyToken = require('../middlewares/authMiddleware');
const logger = require('../config/logger');

/**
 * @swagger
 * /activity:
 *   get:
 *     summary: Get all activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all activities
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, name, duration, date, calories_burned FROM activities WHERE user_id = ${userId}`
    );

    res.json(result.rows);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).send({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /activity/{id}:
 *   get:
 *     summary: Get a specific activity by ID
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The activity ID
 *     responses:
 *       200:
 *         description: A specific activity
 *       400:
 *         description: Bad request
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Server error
 */
router.get('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Ensure required fields are provided
  if (!id) {
    return res.status(400).json({ message: 'id is required.' })
  }

  try {
    const result = await pool.query(
      'SELECT id, name, duration, date, calories_burned FROM activities WHERE id = $1',
      [id]
    );

    // Extract the activity
    const activity = result.rows[0];

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).send({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /activity:
 *   post:
 *     summary: Log new activities (batch insert)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activities:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     duration:
 *                       type: integer
 *                     date:
 *                       type: string
 *                       format: date
 *                     calories_burned:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Activities logged successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, async (req, res) => {
  const { activities } = req.body; // Expect an array of activities
  const userId = req.user.id;

  // Validate input
  if (!Array.isArray(activities) || activities.length === 0) {
    return res.status(400).json({ message: 'Activities array is required and cannot be empty.' });
  }

  try {
    const insertPromises = activities.map(async (activity) => {
      const { name, duration, date } = activity;
      let calories_burned = activity.calories_burned;

      // Ensure required fields
      if (!name || !duration || !date) {
        throw new Error('Name, duration, and date are required for each activity.');
      }

      // Fetch workout details
      const workoutResult = await pool.query(
        'SELECT id, calories_burned FROM workouts WHERE name = $1 LIMIT 1',
        [name]
      );

      if (workoutResult.rows.length === 0) {
        throw new Error(`No matching workout found for "${name}".`);
      }

      const workoutId = workoutResult.rows[0].id;
      const defaultCaloriesBurned = workoutResult.rows[0].calories_burned;

      // Set default calories if not provided
      if (!calories_burned) {
        calories_burned = defaultCaloriesBurned || 0;
      }

      // Insert activity into the database
      await pool.query(
        'INSERT INTO activities (name, duration, date, calories_burned, user_id, workout_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [name, duration, date, calories_burned, userId, workoutId]
      );
    });

    // Wait for all inserts to complete
    await Promise.all(insertPromises);

    res.status(201).json({ message: 'Activities logged successfully!' });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /activity/{id}:
 *   put:
 *     summary: Update an existing activity by ID
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               duration:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               calories_burned:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Server error
 */
router.put('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, duration, date, calories_burned } = req.body;

  // Ensure required fields are provided
  if (!id) {
    return res.status(400).json({ message: 'id is required.' })
  }

  try {
    const result = await pool.query(
      'UPDATE activities SET name = $1, duration = $2, date = $3, calories_burned = $4 WHERE id = $5 RETURNING id',
      [name, duration, date, calories_burned, id]
    );

    const activity = result.rows[0];

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ message: 'Activity updated successfully!' });
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).send({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /activity/{id}:
 *   delete:
 *     summary: Delete an activity by ID
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The activity ID
 *     responses:
 *       204:
 *         description: Activity deleted successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Ensure required fields are provided
  if (!id) {
    return res.status(400).json({ message: 'id is required.' })
  }

  try {
    const result = await pool.query(
      'DELETE FROM activities WHERE id = $1 RETURNING id',
      [id]
    );

    const activity = result.rows[0];

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(204).json();
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).send({ message: 'Server error' });
  }
});

// Export the router for use in the application
module.exports = router;
