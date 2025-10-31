const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

// Schema for tracking unlocked achievements by a user
const UserAchievementSchema = new Schema({
    key: { // e.g., 'first_win', 'streak_5'
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    unlockedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });


const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false, // Don't include password in queries by default
    },
    avatar: {
        type: String,
        default: 'default_avatar.png'
    },
    level: {
        type: Number,
        default: 1
    },
    
    // --- Player Statistics ---
    totalGames: { type: Number, default: 0, index: true },
    wins: { type: Number, default: 0, index: true },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0, index: true },
    totalLosses: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0, index: true },
    bestStreak: { type: Number, default: 0 },

    // --- Achievements ---
    achievements: [UserAchievementSchema],

    // --- Additional Fields ---
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- VIRTUALS for calculated properties ---

// Calculate Win Rate (excluding draws)
UserSchema.virtual('winRate').get(function() {
    const gamesPlayed = this.wins + this.losses;
    if (gamesPlayed === 0) {
        return 0;
    }
    return parseFloat(((this.wins / gamesPlayed) * 100).toFixed(2));
});

// Calculate Net Profit
UserSchema.virtual('netProfit').get(function() {
    return this.totalEarnings - this.totalLosses;
});

// --- METHODS ---

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- INDEXES for leaderboards ---
// Indexes on single fields are defined in the schema above.
// For compound indexes if needed:
// UserSchema.index({ wins: -1, totalGames: -1 });

module.exports = mongoose.model('User', UserSchema);