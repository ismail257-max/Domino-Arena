
const Game = require('../models/Game');

/**
 * @desc    Get the last 20 completed games across the platform
 * @route   GET /api/activity/recent
 * @access  Public
 */
const getRecentActivity = async (req, res) => {
    try {
        const recentGames = await Game.find({ status: 'completed' })
            .sort({ updatedAt: -1 })
            .limit(20)
            .populate('players.userId', 'username avatar')
            .populate('winner', 'username')
            .select('players winner stakeLevel updatedAt');

        res.json({
            success: true,
            data: recentGames,
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getRecentActivity,
};
