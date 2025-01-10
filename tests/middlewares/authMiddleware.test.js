const jwt = require('jsonwebtoken');
const verifyToken = require('../../middlewares/authMiddleware');

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}))

describe('Token verification - Auth Middleware', () => {

  test('should call next for valid token - headers', () => {

    const req = { headers: { authorization: 'Bearer validToken' } };
    const res = {};
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: 1, email: 'test@example.com' });

    verifyToken(req, res, next);
    expect(req.user).toEqual({ id: 1, email: 'test@example.com' });
    expect(next).toHaveBeenCalled();
  });

  test('should call next for valid token - cookies', () => {

    const req = { headers: {}, cookies: { authToken: 'validToken' } };
    const res = {};
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: 1, email: 'test@example.com' });

    verifyToken(req, res, next);
    expect(req.user).toEqual({ id: 1, email: 'test@example.com' });
    expect(next).toHaveBeenCalled();
  });

  test('should return 401 for invalid token', () => {

    const req = { headers: { authorization: 'Bearer invalidToken' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  test('should return 401 for missing token - headers', () => {

    const req = { headers: { authorization: '' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Missing token');
    });

    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access token is missing' });
  });

  

});