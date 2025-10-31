
const express = require('express');
const router = express.Router();
const { getUserAchievements } = require('../controllers/achievementController');

// GET /api/achievements/:userId - Get a user's achievement progress (public)
router.get('/:userId', getUserAchievements);

module.exports = router;
