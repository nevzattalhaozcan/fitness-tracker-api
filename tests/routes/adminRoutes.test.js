const request = require('supertest');
const express = require('express');
const router = require('../../routes/adminRoutes');
const { pool } = require('../../config/database');

jest.mock('../../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../middlewares/authMiddleware', () =>
  jest.fn((req, res, next) => {
    req.user = { isAdmin: true };
    next();
  })
);

const app = express();
app.use(express.json());
app.use('/admin', router);

const mockUsers = [{ id: 1, name: 'Jest Test', email: 'jest@test.com', height: 199, weight: 200, isAdmin: true }];

describe('admin routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should get all users', async () => {
    pool.query.mockResolvedValueOnce({ rows: mockUsers });

    const response = await request(app)
      .get('/admin')
      .set('authorization', 'Bearer validToken');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT id, name, email, height, weight FROM users'
    );
  });
});
