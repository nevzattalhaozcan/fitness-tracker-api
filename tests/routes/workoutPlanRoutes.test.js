const request = require('supertest');
const express = require('express');
const workoutPlanRoutes = require('../../routes/workoutPlanRoutes');
const { pool } = require('../../config/database');
const verifyToken = require('../../middlewares/authMiddleware');

jest.mock('../../config/database', () => {
  return {
    pool: {
      query: jest.fn().mockResolvedValue({ rows: [{ name: 'Workout 1' }] }),
      connect: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [{ name: 'Workout 1' }] }),
        release: jest.fn()
      })
    }
  };
});
jest.mock('../../middlewares/authMiddleware');

const app = express();
app.use(express.json());
app.use('/workout-plans', workoutPlanRoutes);

describe('Workout Plan Routes', () => {
  let workoutPlans;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 1 };
      next();
    });

    workoutPlans = [
      { planname: 'Plan A', id: 1, name: 'Workout 1', muscle: 'Chest', sets: 3, repeats: 10, calories_burned: 100, created_by: 'User1' },
      { planname: 'Plan A', id: 2, name: 'Workout 2', muscle: 'Back', sets: 3, repeats: 10, calories_burned: 100, created_by: 'User1' }
    ];
  });

  test('POST /workout-plans/add should add a workout to a plan', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const response = await request(app)
      .post('/workout-plans/add')
      .send({ planname: 'Plan A', workout_ids: [1] });

    if (response.status !== 201) {
      console.error('Response body:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Workouts added to plan successfully.');
  });

  test('POST /workout-plans/add should return 400 if planname or workout_id is missing', async () => {
    const response = await request(app)
      .post('/workout-plans/add')
      .send({ planname: 'Plan A' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Plan name and an array of workout IDs are required.');
  });

  test('GET /workout-plans should fetch all plans for a user with workouts', async () => {
    pool.query.mockResolvedValue({
      rows: workoutPlans
    });

    const response = await request(app).get('/workout-plans');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
      planname: 'Plan A',
      workouts: workoutPlans.map(({ planname, ...workout }) => workout)
      }
    ]);
  });

  test('GET /workout-plans/:planname should fetch workouts in a specific plan', async () => {
    pool.query.mockResolvedValue({
      rows: workoutPlans
    });

    const response = await request(app).get('/workout-plans/PlanA');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(workoutPlans);
  });

  test('DELETE /workout-plans/remove should delete an entire plan by planname', async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const response = await request(app)
      .delete('/workout-plans/remove')
      .send({ planname: 'Plan A' });

    expect(response.status).toBe(204);
  });

  test('DELETE /workout-plans/remove should return 404 if plan is not found', async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    const response = await request(app)
      .delete('/workout-plans/remove')
      .send({ planname: 'Plan A' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Plan not found.');
  });
});
