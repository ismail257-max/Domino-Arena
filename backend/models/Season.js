
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Tracks an individual player's stats for a specific season.
 * This is a sub-document within the SeasonSchema.
 */
const SeasonPlayerStatSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: { // Denormalized for easier leaderboard display
        type: String,
        required: true,
    },
    wins: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
}, { _id: false });


/**
 * Represents a competitive season, typically lasting a month.
 */
const SeasonSchema = new Schema({
    seasonNumber: {
        type: Number,
        required: true,
        unique: true,
        index: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active',
        index: true,
    },
    playerStats: [SeasonPlayerStatSchema],
}, {
    timestamps: true,
});

// Indexes for efficient querying of seasonal leaderboards
SeasonSchema.index({ "playerStats.userId": 1 });
SeasonSchema.index({ "playerStats.wins": -1 });
SeasonSchema.index({ "playerStats.earnings": -1 });


module.exports = mongoose.model('Season', SeasonSchema);
