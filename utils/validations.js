/**
 * Validation for user input in registration before inserting the data into database
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @param {number} height 
 * @param {number} weight 
 * @returns 
 */
function validateUserRegistrationInput(name, email, password, height, weight) {
  const errors = [];
  if (!name || name.length < 3) errors.push('Name must be at least 3 characters long.');
  if (!email || !/\S+@\S+\.\S+/.test(email)) errors.push('A valid email is required.');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters long.');

  if (height && (isNaN(height) || height < 50 || height > 300)) {
    errors.push('Height must be between 50 and 300 cm.');
  }

  if (weight && (isNaN(weight) || weight < 10 || weight > 300)) {
    errors.push('Weight must be between 10 and 300 kg.');
  }

  return errors;
}

module.exports = validateUserRegistrationInput;