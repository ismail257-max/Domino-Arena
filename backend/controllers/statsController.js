
const mongoose = require('mongoose');
const User = require('../models/User');
const Game = require('../models/Game');

const getGlobalRank = async (userId, sortBy = 'wins') => {
    const users = await User.find().sort({ [sortBy]: -1 }).select('_id').lean();
    const rank = users.findIndex(u => u._id.equals(userId)) + 1;
    return rank > 0 ? rank : null;
};

const getUserProfile = async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    try {
        const user = await User.findById(userId).select('-password -email');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const [recentGames, rank] = await Promise.all([
            Game.find({ 'players.userId': userId, status: 'completed' })
                .sort({ updatedAt: -1 })
                .limit(10)
                .populate('players.userId', 'username')
                .populate('winner', 'username'),
            getGlobalRank(userId)
        ]);

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                rank,
                recentGames,
            }
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getMyStats = async (req, res) => {
    const userId = req.user.id;
    // Piggyback on the public profile endpoint and add more details
    req.params.userId = userId;
    
    // In a real app, you would add more private details here,
    // e.g., detailed financial history, opponent breakdowns, etc.
    // For now, it returns the same as the public profile but is authenticated.
    return getUserProfile(req, res);
};

const compareUsers = async (req, res) => {
    const { userId1, userId2 } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId1) || !mongoose.Types.ObjectId.isValid(userId2)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID provided.' });
    }
     if (userId1 === userId2) {
        return res.status(400).json({ success: false, message: 'Cannot compare a user to themselves.' });
    }

    try {
        const [user1, user2] = await Promise.all([
            User.findById(userId1).select('username avatar'),
            User.findById(userId2).select('username avatar')
        ]);
        if (!user1 || !user2) {
            return res.status(404).json({ success: false, message: 'One or both users not found.' });
        }

        const headToHeadGames = await Game.find({
            status: 'completed',
            'players.userId': { $all: [userId1, userId2] }
        }).populate('winner', 'username');

        let user1Wins = 0;
        let user2Wins = 0;
        
        headToHeadGames.forEach(game => {
            if (game.winner && game.winner._id.equals(user1._id)) {
                user1Wins++;
            } else if (game.winner && game.winner._id.equals(user2._id)) {
                user2Wins++;
            }
        });
        
        const totalGames = headToHeadGames.length;

        res.json({
            success: true,
            data: {
                players: [user1.toObject(), user2.toObject()],
                totalGames,
                stats: {
                    [user1.username]: { wins: user1Wins },
                    [user2.username]: { wins: user2Wins },
                },
                history: headToHeadGames,
            }
        });

    } catch (error) {
        console.error('Error comparing users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getUserProfile,
    getMyStats,
    compareUsers,
};
