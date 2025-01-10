const request = require('supertest');
const express = require('express');
const { pool } = require('../../config/database');
const bcrypt = require('bcryptjs');

jest.mock('../../config/database', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../middlewares/authMiddleware', () =>
  jest.fn((req, res, next) => {
    req.user = { id: 123, isAdmin: true };
    next();
  })
);

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn((password) => password === 'password'),
}));

const app = express();
app.use(express.json());
app.use('/user', require('../../routes/userRoutes'));

const mockUsers = [{ id: 1, name: 'John Doe', email: 'john@example.com', password: 'hashedPassword', height: 180, weight: 80 }];
const mockUserResponse = { message: 'User registered', userId: 1 };

describe('userRoutes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should register user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app)
      .post('/user/register')
      .send(mockUsers[0]);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockUserResponse);
  });

  test('should login user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockUsers[0]] });

    const response = await request(app)
      .post('/user/login')
      .send({ email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });

  test('should get user details', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockUsers[0]] });

    const response = await request(app)
      .get('/user/me')
      .set('authorization', 'Bearer validToken');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers[0]);
  });

  test('should update user details', async () => {
    const updatedUser = { ...mockUsers[0], name: 'Jane Doe' };
    pool.query.mockResolvedValueOnce({ rows: [updatedUser] });

    const response = await request(app)
      .put('/user/1')
      .set('authorization', 'Bearer validToken')
      .send({ name: 'Jane Doe', height: 170, weight: 70 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedUser);
  });

  test('should delete user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockUsers[0]] });

    const response = await request(app)
      .delete('/user/1')
      .set('authorization', 'Bearer validToken');

    expect(response.status).toBe(204);
  });
});
