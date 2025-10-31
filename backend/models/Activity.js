const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Activity Log Model
 * Tracks important platform events for the activity feed
 */
const ActivitySchema = new Schema({
  // Type of activity
  type: {
    type: String,
    required: true,
    enum: [
      'game_completed',
      'achievement_unlocked',
      'big_win',
      'win_streak',
      'level_up',
      'tournament_win'
    ],
    index: true
  },
  
  // User who triggered the activity
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  username: {
    type: String,
    required: true
  },
  
  // Related entities
  gameId: {
    type: Schema.Types.ObjectId,
    ref: 'Game',
    default: null
  },
  
  opponentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  opponentUsername: {
    type: String,
    default: null
  },
  
  // Activity details
  description: {
    type: String,
    required: true
  },
  
  // Metadata (flexible for different activity types)
  metadata: {
    amount: Number,          // For big wins
    stakeLevel: Number,      // For games
    streakCount: Number,     // For win streaks
    achievementKey: String,  // For achievements
    achievementName: String, // For achievements
    level: Number,           // For level ups
    tournamentName: String   // For tournaments (future)
  },
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Featured activities
  isFeatured: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
ActivitySchema.index({ createdAt: -1 }); // For recent activity queries
ActivitySchema.index({ userId: 1, createdAt: -1 }); // For user activity history
ActivitySchema.index({ type: 1, createdAt: -1 }); // For filtering by type
ActivitySchema.index({ isFeatured: 1, createdAt: -1 }); // For featured feed

// Static method to create a game completion activity
ActivitySchema.statics.logGameCompletion = async function(game, winner, loser) {
  try {
    const activity = new this({
      type: 'game_completed',
      userId: winner.userId,
      username: winner.username,
      gameId: game._id,
      opponentId: loser.userId,
      opponentUsername: loser.username,
      description: `${winner.username} defeated ${loser.username}`,
      metadata: {
        amount: winner.payout,
        stakeLevel: game.stakeLevel
      },
      isPublic: true,
      // Feature big wins ($50+)
      isFeatured: winner.payout >= 50
    });
    
    await activity.save();
    console.log(`📝 Activity logged: ${winner.username} won $${winner.payout}`);
    return activity;
  } catch (error) {
    console.error('Error logging game completion activity:', error);
    return null;
  }
};

// Static method to create an achievement unlock activity
ActivitySchema.statics.logAchievement = async function(userId, username, achievementKey, achievementName) {
  try {
    const activity = new this({
      type: 'achievement_unlocked',
      userId,
      username,
      description: `${username} unlocked: ${achievementName}`,
      metadata: {
        achievementKey,
        achievementName
      },
      isPublic: true,
      // Feature legendary achievements
      isFeatured: achievementKey.includes('legendary') || achievementKey.includes('1000')
    });
    
    await activity.save();
    console.log(`📝 Activity logged: ${username} unlocked ${achievementName}`);
    return activity;
  } catch (error) {
    console.error('Error logging achievement activity:', error);
    return null;
  }
};

// Static method to create a win streak activity
ActivitySchema.statics.logWinStreak = async function(userId, username, streakCount) {
  try {
    // Only log significant streaks (5+)
    if (streakCount < 5) return null;
    
    const activity = new this({
      type: 'win_streak',
      userId,
      username,
      description: `${username} is on a ${streakCount}-game winning streak!`,
      metadata: {
        streakCount
      },
      isPublic: true,
      // Feature impressive streaks (10+)
      isFeatured: streakCount >= 10
    });
    
    await activity.save();
    console.log(`📝 Activity logged: ${username} ${streakCount}-game streak`);
    return activity;
  } catch (error) {
    console.error('Error logging win streak activity:', error);
    return null;
  }
};

// Static method to create a big win activity
ActivitySchema.statics.logBigWin = async function(userId, username, amount, gameId = null) {
  try {
    // Only log wins of $50+
    if (amount < 50) return null;
    
    const activity = new this({
      type: 'big_win',
      userId,
      username,
      gameId,
      description: `${username} won $${amount.toFixed(2)}!`,
      metadata: {
        amount
      },
      isPublic: true,
      // Feature huge wins ($100+)
      isFeatured: amount >= 100
    });
    
    await activity.save();
    console.log(`📝 Activity logged: ${username} won $${amount}`);
    return activity;
  } catch (error) {
    console.error('Error logging big win activity:', error);
    return null;
  }
};

module.exports = mongoose.model('Activity', ActivitySchema);