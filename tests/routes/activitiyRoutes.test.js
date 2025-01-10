const request = require('supertest');
const express = require('express');
const activityRoutes = require('../../routes/activityRoutes');
const { pool } = require('../../config/database');
const verifyToken = require('../../middlewares/authMiddleware');

jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../middlewares/authMiddleware');

const app = express();
app.use(express.json());
app.use('/activity', activityRoutes);

describe('Activity Routes', () => {
  let mockActivities;
  let mockWorkouts;

  beforeEach(() => {
    jest.clearAllMocks();
    verifyToken.mockImplementation((req, _, next) => {
      req.user = { id: 123 };
      next();
    });

    mockActivities = [
      { id: 1, name: 'Running', duration: 30, date: '2021-10-01', calories_burned: 300 },
      { id: 2, name: 'Cycling', duration: 60, date: '2021-10-02', calories_burned: 500 },
    ];

    mockWorkouts = [
      { id: 1, name: 'Swimming', calories_burned: 400 },
    ];
  });

  test('GET /activity should get all activities', async () => {
    pool.query.mockResolvedValueOnce({ rows: mockActivities });

    const response = await request(app).get('/activity').set('authorization', 'Bearer validToken');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockActivities);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name, duration, date, calories_burned FROM activities WHERE user_id = 123'
    );
  });

  test('GET /activity/:id should get specific activity', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockActivities[0]] });

    const response = await request(app).get('/activity/1').set('authorization', 'Bearer validToken');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockActivities[0]);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name, duration, date, calories_burned FROM activities WHERE id = $1',
      [1]
    );
  });

  test('POST /activity should add a new activity', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: mockWorkouts }) // Mock the workout query
      .mockResolvedValueOnce({ rowCount: 1 }); // Mock the activity insertion

    const newActivity = { name: 'Swimming', duration: 45, date: '2024-12-19', calories_burned: 400 };

    const response = await request(app)
      .post('/activity')
      .set('authorization', 'Bearer validToken')
      .send({ activities: [newActivity] });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Activities logged successfully!');
  });

  test('DELETE /activity/:id should delete an activity', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app)
      .delete('/activity/1')
      .set('authorization', 'Bearer validToken');

    expect(response.status).toBe(204);
  });

  test('PUT /activity/:id should update an activity', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const updatedActivity = { name: 'Weight lifting', duration: 30, date: '2024-12-18', calories_burned: 300 };
    const response = await request(app)
      .put('/activity/1')
      .set('authorization', 'Bearer validToken')
      .send(updatedActivity);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Activity updated successfully!');
  });
});