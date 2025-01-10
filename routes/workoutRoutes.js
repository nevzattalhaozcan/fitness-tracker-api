const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const verifyToken = require('../middlewares/authMiddleware');
const logger = require('../config/logger');

// Route: Get all workouts
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, muscle, sets, repeats, calories_burned, met_value FROM workouts');
    res.json(result.rows);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).send({ message: 'Server error' });
  }
});

// Route: Get a specific workout by ID
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

// Route: Add a new workout (restricted to admin users)
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

// Route: Update an existing workout by ID (restricted to admin users)
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

// Route: Delete a workout by ID (restricted to admin users)
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
