const request = require('supertest');
const express = require('express');
const workoutRoutes = require('../../routes/workoutRoutes');
const { pool } = require('../../config/database');
const verifyToken = require('../../middlewares/authMiddleware');

jest.mock('../../config/database', () => ({ 
  pool: {
    query: jest.fn(),
  }
}));

jest.mock('../../middlewares/authMiddleware');

const app = express();
app.use(express.json());
app.use('/workout', workoutRoutes);

describe('Workout Routes', () => {
  let mockWorkouts;
  
  beforeEach(() => {
    jest.clearAllMocks();
    verifyToken.mockImplementation((req, _, next) => {
      req.user = { isAdmin: true };
      next();
    });

    mockWorkouts = [
      { id: 1, name: 'Bench Press', muscle: 'Chest', sets: 3, repeats: 10, calories_burned: 100, met_value: 8 },
      { id: 2, name: 'Squat', muscle: 'Legs', sets: 3, repeats: 10, calories_burned: 150, met_value: 10 },
    ];
  });

  test('GET /workout should get all workouts', async () => {
    pool.query.mockResolvedValue({ rows: mockWorkouts });

    const response = await request(app)
      .get('/workout')
      .set('authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockWorkouts);
    expect(pool.query).toHaveBeenCalledTimes(1);  
  });

  test('GET /workout/:id should get a specific workout', async () => {
    const workout = mockWorkouts[0];
    pool.query.mockResolvedValueOnce({ rows: [workout] });

    const response = await request(app)
      .get('/workout/1')
      .set('authorization', 'Bearer validToken');

    console.log('Response:', response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(workout);
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name, muscle, sets, repeats, calories_burned, met_value FROM workouts WHERE id = $1',
      [1]
    );
  });

});