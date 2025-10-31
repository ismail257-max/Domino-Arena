const { check } = require('express-validator');

// --- Create Game Validation ---
exports.createGameValidator = [
  check('stakeLevel')
    .isInt({ min: 5, max: 15 })
    .withMessage('Stake level must be 5, 10, or 15')
    .custom((value) => {
      if (![5, 10, 15].includes(value)) {
        throw new Error('Stake level must be exactly 5, 10, or 15 USD');
      }
      return true;
    })
];

// --- Make Move Validation ---
exports.makeMoveValidator = [
  check('tile')
    .exists()
    .withMessage('Tile is required'),
  
  check('tile.left')
    .isInt({ min: 0, max: 6 })
    .withMessage('Tile left value must be between 0 and 6'),
  
  check('tile.right')
    .isInt({ min: 0, max: 6 })
    .withMessage('Tile right value must be between 0 and 6'),
  
  check('position')
    .isIn(['start', 'end'])
    .withMessage('Position must be either "start" or "end"')
];
