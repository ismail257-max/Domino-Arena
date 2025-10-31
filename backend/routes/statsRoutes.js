
const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    getMyStats,
    compareUsers,
} = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/stats/profile/:userId - Public user stats profile
router.get('/profile/:userId', getUserProfile);

// GET /api/stats/compare/:userId1/:userId2 - Public head-to-head comparison
router.get('/compare/:userId1/:userId2', compareUsers);

// GET /api/stats/me - Private, detailed stats for the logged-in user
router.get('/me', authMiddleware, getMyStats);


module.exports = router;
