
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Defines the master list of all possible achievements in the game.
 * This is used to check against user stats to award achievements.
 */
const AchievementSchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true,
        description: 'A unique key for the achievement, e.g., "first_win"',
    },
    name: {
        type: String,
        required: true,
        description: 'The display name of the achievement, e.g., "First Victory!"',
    },
    description: {
        type: String,
        required: true,
        description: 'A description of how to earn the achievement.',
    },
    // You can add more fields like icon URLs, reward points, etc.
});

module.exports = mongoose.model('Achievement', AchievementSchema);
