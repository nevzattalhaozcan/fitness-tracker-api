const validateUserRegistrationInput = require('../../utils/validations');

describe('User registration validation', () => {

  test('should return no errors for valid input', () => {
    const errors = validateUserRegistrationInput('John Doe', 'john@example.com', "pass123", 180, 80);
    expect(errors).toEqual([]);
  });

  test('should return no errors for empty height', () => {
    const errors = validateUserRegistrationInput('John Doe', 'john@example.com', "pass123", null, 80);
    expect(errors).toEqual([]);
  });

  test('should return no errors for empty weight', () => {
    const errors = validateUserRegistrationInput('John Doe', 'john@example.com', "pass123", 180, null);
    expect(errors).toEqual([]);
  });

  test('should return error for short name', () => {
    const errors = validateUserRegistrationInput('Jo', 'john@example.com', "pass123", 180, 80);
    expect(errors).toContain('Name must be at least 3 characters long.');
  });

  test('should return error for invalid email', () => {
    const errors = validateUserRegistrationInput('John Doe', 'johnexample.com', "pass123", 180, 80);
    expect(errors).toContain('A valid email is required.');
  });

  test('should return error for invalid password', () => {
    const errors = validateUserRegistrationInput('John Doe', 'john@example.com', "p123", 180, 80);
    expect(errors).toContain('Password must be at least 6 characters long.');
  });

  test('should return error for invalid height', () => {
    const errors = validateUserRegistrationInput('John Doe', 'john@example.com', "pass123", 1, 80);
    expect(errors).toContain('Height must be between 50 and 300 cm.');
  });

  test('should return error for invalid weight', () => {
    const errors = validateUserRegistrationInput('John Doe', 'john@example.com', "pass123", 180, 1);
    expect(errors).toContain('Weight must be between 10 and 300 kg.');
  });

});
