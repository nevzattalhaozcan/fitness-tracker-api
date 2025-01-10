const logger = require('../../config/logger');
const requestLogger = require('../../middlewares/loggerMiddleware');

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
}));

describe('requestLogger', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/test' };
    res = {
      statusCode: 200,
      statusMessage: 'OK',
      on: jest.fn((event, callback) => {
        if (event = 'finish') {
          res._finishCallback = callback;
        }
      }),
    };
    next = jest.fn();
  });

  test('should log the request details', () => {
    requestLogger(req, res, next);

    res._finishCallback();
    
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`Response: ${res.statusCode} ${res.statusMessage} \\d+ms`)
      )
    );
    expect(next).toHaveBeenCalled();
  });

});