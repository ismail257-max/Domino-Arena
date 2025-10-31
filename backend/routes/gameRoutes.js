const express = require('express');
const router = express.Router();
const {
  createGame,
  getAvailableGames,
  joinGame,
  makeMove,
  drawTile,
  passTurn,
  getGameState,
  getGameHistory,
  cancelGame
} = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');
const { createGameValidator, makeMoveValidator } = require('../utils/gameValidators');

// Protect all game routes with authentication
router.use(authMiddleware);

/**
 * @route   POST /api/games/create
 * @desc    Create a new game or join a waiting game
 * @access  Private
 */
router.post('/create', createGameValidator, createGame);

/**
 * @route   GET /api/games/available
 * @desc    Get list of available waiting games
 * @access  Private
 * @query   ?stakeLevel=10
 */
router.get('/available', getAvailableGames);

/**
 * @route   GET /api/games/history
 * @desc    Get the logged-in user's game history
 * @access  Private
 * @query   ?page=1&limit=10
 */
router.get('/history', getGameHistory);

/**
 * @route   GET /api/games/:id
 * @desc    Get the current state of a specific game
 * @access  Private
 */
router.get('/:id', getGameState);

/**
 * @route   POST /api/games/:id/join
 * @desc    Join a specific waiting game
 * @access  Private
 */
router.post('/:id/join', joinGame);

/**
 * @route   POST /api/games/:id/move
 * @desc    Make a move by playing a tile
 * @access  Private
 */
router.post('/:id/move', makeMoveValidator, makeMove);

/**
 * @route   POST /api/games/:id/draw
 * @desc    Draw a tile from the boneyard
 * @access  Private
 */
router.post('/:id/draw', drawTile);

/**
 * @route   POST /api/games/:id/pass
 * @desc    Pass turn (when cannot play and boneyard is empty)
 * @access  Private
 */
router.post('/:id/pass', passTurn);

/**
 * @route   DELETE /api/games/:id
 * @desc    Cancel a waiting game
 * @access  Private
 */
router.delete('/:id', cancelGame);

module.exports = router;