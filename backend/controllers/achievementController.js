
const mongoose = require('mongoose');
const User = require('../models/User');
const { ACHIEVEMENTS } = require('../services/achievementService');

const getUserAchievements = async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    try {
        const user = await User.findById(userId).select('achievements');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const unlockedKeys = new Set(user.achievements.map(a => a.key));
        
        const allAchievementsStatus = Object.entries(ACHIEVEMENTS).map(([key, value]) => {
            const unlockedAchievement = user.achievements.find(a => a.key === key);
            return {
                key,
                name: value.name,
                description: value.description,
                achieved: unlockedKeys.has(key),
                unlockedAt: unlockedAchievement ? unlockedAchievement.unlockedAt : null,
            };
        });

        res.json({
            success: true,
            data: allAchievementsStatus,
        });

    } catch (error) {
        console.error('Error fetching user achievements:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUserAchievements,
};
