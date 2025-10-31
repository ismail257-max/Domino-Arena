const Season = require('../models/Season');
const User = require('../models/User');

/**
 * Get or create the active season
 * @returns {Promise<Object>} Active season document
 */
const getActiveSeason = async () => {
  let activeSeason = await Season.findOne({ status: 'active' });

  if (!activeSeason) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // End any old active seasons
    await Season.updateMany(
      { status: 'active', endDate: { $lt: startOfMonth } },
      { $set: { status: 'completed' } }
    );
    
    const lastSeason = await Season.findOne().sort({ seasonNumber: -1 });
    const newSeasonNumber = lastSeason ? lastSeason.seasonNumber + 1 : 1;

    activeSeason = new Season({
      seasonNumber: newSeasonNumber,
      startDate: startOfMonth,
      endDate: endOfMonth,
      status: 'active',
    });
    await activeSeason.save();
    console.log(`🏆 New season #${newSeasonNumber} created`);
  }

  return activeSeason;
};

/**
 * Update player stats in the current season
 * @param {string} userId - User ID
 * @param {boolean|null} won - true if won, false if lost, null if draw
 * @param {number} earnings - Amount earned (0 if lost or draw)
 * @param {Object} session - Mongoose session for transaction
 */
const updateSeasonStats = async (userId, won, earnings, session) => {
  try {
    const activeSeason = await getActiveSeason();
    const user = await User.findById(userId).session(session);
    
    if (!user) {
      console.error(`User ${userId} not found for season stats update`);
      return;
    }

    // Find or create player stats in season
    let playerStat = activeSeason.playerStats.find(
      p => p.userId.toString() === userId.toString()
    );

    if (!playerStat) {
      // First game in season for this player
      playerStat = {
        userId: user._id,
        username: user.username,
        wins: 0,
        earnings: 0,
        gamesPlayed: 0
      };
      activeSeason.playerStats.push(playerStat);
    }

    // Update stats
    playerStat.gamesPlayed += 1;
    
    if (won === true) {
      playerStat.wins += 1;
      playerStat.earnings += earnings;
    } else if (won === false) {
      // Loss - just increment games played (already done)
    } else {
      // Draw - just increment games played (already done)
    }

    await activeSeason.save({ session });
    console.log(`📊 Season stats updated for ${user.username}: ${playerStat.wins}W / ${playerStat.gamesPlayed}G`);

  } catch (error) {
    console.error(`❌ Error updating season stats for user ${userId}:`, error);
  }
};

/**
 * End the current season and start a new one (called monthly)
 */
const endCurrentSeason = async () => {
  try {
    const activeSeason = await Season.findOne({ status: 'active' });
    
    if (activeSeason) {
      activeSeason.status = 'completed';
      await activeSeason.save();
      console.log(`🏁 Season #${activeSeason.seasonNumber} ended`);
    }

    // Create new season
    await getActiveSeason();
    
  } catch (error) {
    console.error('❌ Error ending season:', error);
  }
};

module.exports = {
  getActiveSeason,
  updateSeasonStats,
  endCurrentSeason
};
