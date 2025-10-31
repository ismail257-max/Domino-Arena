const User = require('../models/User');

// --- In-memory cache with size limit ---
const cache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum 100 cached entries

/**
 * Clean up expired cache entries
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expires < now) {
      cache.delete(key);
    }
  }
};

/**
 * Add to cache with size management
 */
const addToCache = (key, data) => {
  // Clean expired entries first
  cleanExpiredCache();
  
  // If cache is too large, remove oldest entries
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_DURATION_MS
  });
};

/**
 * Generic leaderboard fetcher with caching
 */
const getLeaderboard = async (req, res, sortField, limitDefault) => {
  const { page = 1, limit = limitDefault, sortBy = sortField } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  // Validate parameters
  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid pagination parameters.' 
    });
  }

  const cacheKey = `leaderboard-${sortBy}-p${pageNum}-l${limitNum}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return res.json({ 
      success: true, 
      fromCache: true, 
      ...cached.data 
    });
  }

  try {
    const skip = (pageNum - 1) * limitNum;
    
    const allowedSorts = ['wins', 'winRate', 'totalEarnings', 'currentStreak', 'totalGames'];
    if (!allowedSorts.includes(sortBy)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid sortBy parameter.' 
      });
    }

    const totalPlayers = await User.countDocuments();
    const players = await User.find()
      .sort({ [sortBy]: -1, totalGames: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('username avatar wins losses winRate totalEarnings currentStreak totalGames bestStreak');
    
    const leaderboard = players.map((player, index) => ({
      rank: skip + index + 1,
      ...player.toObject()
    }));

    const responseData = {
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalPlayers / limitNum),
      totalPlayers,
      leaderboard,
    };

    // Add to cache
    addToCache(cacheKey, responseData);

    res.json({ 
      success: true, 
      fromCache: false, 
      ...responseData 
    });

  } catch (error) {
    console.error(`Error fetching ${sortField} leaderboard:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * @desc    Get global leaderboard (sorted by wins)
 * @route   GET /api/leaderboard/global
 * @access  Public
 */
const getGlobalLeaderboard = (req, res) => {
  return getLeaderboard(req, res, 'wins', 20);
};

/**
 * @desc    Get top earners leaderboard
 * @route   GET /api/leaderboard/top-earners
 * @access  Public
 */
const getTopEarners = (req, res) => {
  req.query.sortBy = 'totalEarnings';
  return getLeaderboard(req, res, 'totalEarnings', 50);
};

/**
 * @desc    Get win streaks leaderboard
 * @route   GET /api/leaderboard/win-streaks
 * @access  Public
 */
const getWinStreaks = (req, res) => {
  req.query.sortBy = 'currentStreak';
  return getLeaderboard(req, res, 'currentStreak', 50);
};

/**
 * @desc    Get season leaderboard (placeholder - returns global for now)
 * @route   GET /api/leaderboard/season/:seasonNumber?
 * @access  Public
 * @note    Seasons feature is not implemented yet. Returns global leaderboard.
 */
const getSeasonLeaderboard = async (req, res) => {
  // TODO: Implement seasons feature in future
  // For now, return global leaderboard
  console.log('ℹ️ Seasons not implemented yet, returning global leaderboard');
  return getGlobalLeaderboard(req, res);
};

module.exports = {
  getGlobalLeaderboard,
  getTopEarners,
  getWinStreaks,
  getSeasonLeaderboard,
};