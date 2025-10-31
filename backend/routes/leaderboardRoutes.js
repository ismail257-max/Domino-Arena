
const express = require('express');
const router = express.Router();
const {
    getGlobalLeaderboard,
    getTopEarners,
    getWinStreaks,
    getSeasonLeaderboard,
} = require('../controllers/leaderboardController');

// All leaderboard routes are public

// GET /api/leaderboard/global - Top players by wins
router.get('/global', getGlobalLeaderboard);

// GET /api/leaderboard/top-earners - Top players by total earnings
router.get('/top-earners', getTopEarners);

// GET /api/leaderboard/win-streaks - Top players by current win streak
router.get('/win-streaks', getWinStreaks);

// GET /api/leaderboard/season - Get the current season's leaderboard
router.get('/season', getSeasonLeaderboard);

// GET /api/leaderboard/season/:seasonNumber - Get a specific past season's leaderboard
router.get('/season/:seasonNumber', getSeasonLeaderboard);


module.exports = router;
