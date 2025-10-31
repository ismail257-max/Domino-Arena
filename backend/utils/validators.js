const { check } = require('express-validator');

// --- Registration Validation Rules ---
exports.registerValidator = [
  check('username', 'Username is required.')
    .not()
    .isEmpty()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters.')
    .isAlphanumeric()
    .withMessage('Username must only contain letters and numbers.'),
  
  check('email', 'Please include a valid email.')
    .isEmail()
    .normalizeEmail(),

  check('password', 'Password must be at least 6 characters long.')
    .isLength({ min: 6 })
];


// --- Login Validation Rules ---
exports.loginValidator = [
  check('email', 'Please provide a valid email.')
    .isEmail()
    .normalizeEmail(),
  
  check('password', 'Password is required.')
    .exists()
    .notEmpty()
    .withMessage('Password cannot be empty.')
];


// --- Wallet Transaction Validation Rules ---
exports.transactionValidator = [
  check('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  
  check('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be 200 characters or less')
];


// --- Withdrawal Validation Rules ---
exports.withdrawalValidator = [
  check('amount')
    .isFloat({ min: 1 })
    .withMessage('Withdrawal amount must be at least $1'),
  
  check('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be 200 characters or less')
];
