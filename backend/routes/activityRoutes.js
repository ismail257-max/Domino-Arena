
const express = require('express');
const router = express.Router();
const { getRecentActivity } = require('../controllers/activityController');

// GET /api/activity/recent - Public feed of recent games
router.get('/recent', getRecentActivity);

module.exports = router;
