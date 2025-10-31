const User = require('../models/User');

// Master list of all achievements
const ACHIEVEMENTS = {
  first_win: {
    name: "First Victory!",
    description: "Win your first game.",
    check: (user) => user.wins >= 1,
  },
  streak_5: {
    name: "On Fire",
    description: "Achieve a 5-game winning streak.",
    check: (user) => user.currentStreak >= 5,
  },
  streak_10: {
    name: "Unstoppable",
    description: "Achieve a 10-game winning streak.",
    check: (user) => user.currentStreak >= 10,
  },
  streak_25: {
    name: "Legendary",
    description: "Achieve a 25-game winning streak.",
    check: (user) => user.currentStreak >= 25,
  },
  high_roller_100: {
    name: "High Roller",
    description: "Play 100 total games.",
    check: (user) => user.totalGames >= 100,
  },
  high_roller_500: {
    name: "Veteran Player",
    description: "Play 500 total games.",
    check: (user) => user.totalGames >= 500,
  },
  high_roller_1000: {
    name: "Master Player",
    description: "Play 1000 total games.",
    check: (user) => user.totalGames >= 1000,
  },
  money_maker_100: {
    name: "Money Maker",
    description: "Earn $100 in total.",
    check: (user) => user.totalEarnings >= 100,
  },
  money_maker_500: {
    name: "Big Money",
    description: "Earn $500 in total.",
    check: (user) => user.totalEarnings >= 500,
  },
  money_maker_1000: {
    name: "Millionaire",
    description: "Earn $1000 in total.",
    check: (user) => user.totalEarnings >= 1000,
  },
  domination: {
    name: "Domination",
    description: "Maintain a 90%+ win rate over at least 20 games.",
    check: (user) => user.totalGames >= 20 && user.winRate >= 90,
  },
  comeback_kid: {
    name: "Comeback Kid",
    description: "Win a game after being down 0-5.",
    check: (user, previousLosses) => previousLosses >= 5 && user.wins > 0,
  },
};

/**
 * Check and award achievements to a user
 * @param {string} userId - User ID to check
 * @param {Object} io - Socket.io instance (optional, for notifications)
 */
const checkAndAwardAchievements = async (userId, io = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User ${userId} not found for achievement check`);
      return;
    }
    
    const userAchievementKeys = new Set(user.achievements.map(a => a.key));
    const newAchievements = [];

    // Check each achievement
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (!userAchievementKeys.has(key)) {
        if (achievement.check(user)) {
          const newAchievement = {
            key,
            name: achievement.name,
            description: achievement.description,
            unlockedAt: new Date(),
          };
          newAchievements.push(newAchievement);
          console.log(`🎖️ ${user.username} unlocked: ${achievement.name}`);
        }
      }
    }

    // Save new achievements
    if (newAchievements.length > 0) {
      user.achievements.push(...newAchievements);
      await user.save();
      console.log(`✅ User ${user.username} unlocked ${newAchievements.length} new achievements`);

      // Emit socket event if io is available
      if (io) {
        // Emit to all connected sockets for this user
        io.emit('achievement-unlocked', {
          userId: userId.toString(),
          achievements: newAchievements
        });
      }
    }

    return newAchievements;
  } catch (error) {
    console.error(`❌ Error checking achievements for user ${userId}:`, error);
    return [];
  }
};

module.exports = {
  checkAndAwardAchievements,
  ACHIEVEMENTS,
};
