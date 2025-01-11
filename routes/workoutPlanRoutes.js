const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const verifyToken = require('../middlewares/authMiddleware');
const logger = require('../config/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkoutPlan:
 *       type: object
 *       properties:
 *         planname:
 *           type: string
 *         workout_ids:
 *           type: array
 *           items:
 *             type: integer
 *     CreateWorkoutPlan:
 *       type: object
 *       required:
 *         - planname
 *         - workout_ids
 *       properties:
 *         planname:
 *           type: string
 *         workout_ids:
 *           type: array
 *           items:
 *             type: integer
 *     UpdateWorkoutPlan:
 *       type: object
 *       required:
 *         - planname
 *         - workout_ids
 *       properties:
 *         planname:
 *           type: string
 *         workout_ids:
 *           type: array
 *           items:
 *             type: integer
 */

/**
 * @swagger
 * /workout-plan/add:
 *   post:
 *     summary: Add a Workout to a Plan
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkoutPlan'
 *     responses:
 *       201:
 *         description: Workouts added to plan successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to add workouts to plan
 */
router.post('/add', verifyToken, async (req, res) => {
  const { planname, workout_ids } = req.body;
  const user_id = req.user.id;
  if (!planname || !Array.isArray(workout_ids) || workout_ids.length === 0) {
    return res.status(400).json({ message: 'Plan name and an array of workout IDs are required.' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userResult = await client.query('SELECT name FROM users WHERE id = $1', [user_id]);
      const created_by = userResult.rows[0].name;
      const insertQuery = 'INSERT INTO workout_plans (planname, user_id, workout_id, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING';
      for (const workout_id of workout_ids) {
        await client.query(insertQuery, [planname, user_id, workout_id, created_by]);
      }
      await client.query('COMMIT');
      res.status(201).json({ message: 'Workouts added to plan successfully.' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Failed to add workouts to plan.' });
  }
});

/**
 * @swagger
 * /workout-plan:
 *   get:
 *     summary: Fetch All Plans for a User with Workouts
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all workout plans with workouts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkoutPlan'
 *       500:
 *         description: Failed to fetch workout plans
 */
router.get('/', verifyToken, async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query('SELECT wp.planname, w.id, w.name, w.muscle, w.sets, w.repeats, w.calories_burned, wp.created_by FROM workout_plans wp INNER JOIN workouts w ON wp.workout_id = w.id INNER JOIN users u ON wp.user_id = u.id WHERE wp.user_id = $1 OR u."isAdmin" = true ORDER BY wp.planname', [user_id]);
    const groupedPlans = result.rows.reduce((acc, row) => {
      const { planname, ...workout } = row;
      if (!acc[planname]) {
        acc[planname] = [];
      }
      acc[planname].push(workout);
      return acc;
    }, {});
    const response = Object.entries(groupedPlans).map(([planname, workouts]) => ({ planname, workouts }));
    res.json(response);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Failed to fetch workout plans.' });
  }
});

/**
 * @swagger
 * /workout-plan/{planname}:
 *   get:
 *     summary: Fetch Workouts in a Specific Plan
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planname
 *         required: true
 *         schema:
 *           type: string
 *         description: The plan name
 *     responses:
 *       200:
 *         description: List of workouts in the plan
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workout'
 *       500:
 *         description: Failed to fetch workouts for the plan
 */
router.get('/:planname', verifyToken, async (req, res) => {
  const user_id = req.user.id;
  const { planname } = req.params;
  try {
    const result = await pool.query('SELECT w.* FROM workouts w INNER JOIN workout_plans wp ON w.id = wp.workout_id WHERE wp.user_id = $1 AND wp.planname = $2', [user_id, planname]);
    res.json(result.rows);
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Failed to fetch workouts for the plan.' });
  }
});

/**
 * @swagger
 * /workout-plan/{planname}:
 *   delete:
 *     summary: Delete an entire plan by planname
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planname
 *         required: true
 *         schema:
 *           type: string
 *         description: The plan name
 *     responses:
 *       204:
 *         description: Plan deleted successfully
 *       400:
 *         description: Plan name is required
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Failed to delete plan
 */
router.delete('/:planname', verifyToken, async (req, res) => {
  const { planname } = req.params;
  const user_id = req.user.id;
  if (!planname) {
    return res.status(400).json({ message: 'Plan name is required.' });
  }
  try {
    const result = await pool.query('DELETE FROM workout_plans WHERE user_id = $1 AND planname = $2', [user_id, planname]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Plan not found.' });
    }
    res.status(204).end();
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Failed to delete plan.' });
  }
});

/**
 * @swagger
 * /workout-plan/{planname}:
 *   put:
 *     summary: Update a plan by planname
 *     tags: [Workout Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planname
 *         required: true
 *         schema:
 *           type: string
 *         description: The current plan name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkoutPlan'
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Failed to update plan
 */
router.put('/:planname', verifyToken, async (req, res) => {
  const { planname } = req.params;
  const user_id = req.user.id;
  const { planname: new_planname, workout_ids } = req.body;
  if (!planname || !new_planname || !Array.isArray(workout_ids) || workout_ids.length === 0) {
    return res.status(400).json({ message: 'Plan name, new plan name, and an array of workout IDs are required.' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM workout_plans WHERE user_id = $1 AND planname = $2', [user_id, planname]);
      const userResult = await client.query('SELECT name FROM users WHERE id = $1', [user_id]);
      const created_by = userResult.rows[0].name;
      const insertQuery = 'INSERT INTO workout_plans (planname, user_id, workout_id, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING';
      for (const workout_id of workout_ids) {
        await client.query(insertQuery, [new_planname, user_id, workout_id, created_by]);
      }
      await client.query('COMMIT');
      res.status(200).json({ message: 'Plan updated successfully.' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(error.stack || error.message || error);
    res.status(500).json({ message: 'Failed to update plan.' });
  }
});

module.exports = router;
