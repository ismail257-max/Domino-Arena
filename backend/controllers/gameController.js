const mongoose = require('mongoose');
const Game = require('../models/Game');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const dominoLogic = require('../utils/dominoLogic');
const { validationResult } = require('express-validator');

const HOUSE_FEE_PERCENTAGE = 0.10; // 10% house fee (as per your design)

/**
 * Sanitize game data for a specific player (hide opponent's hand)
 */
const sanitizeGameForPlayer = (game, userId) => {
  const gameObj = game.toObject ? game.toObject() : game;
  
  return {
    _id: gameObj._id,
    gameMode: gameObj.gameMode,
    stakeLevel: gameObj.stakeLevel,
    totalPot: gameObj.totalPot,
    status: gameObj.status,
    currentTurn: gameObj.currentTurn,
    turnNumber: gameObj.turnNumber,
    board: gameObj.board,
    boneyardCount: gameObj.boneyardCount,
    players: gameObj.players.map(player => ({
      userId: player.userId,
      username: player.username,
      avatar: player.avatar,
      handCount: player.hand.length,
      // Only show hand if it's the requesting player
      hand: player.userId.toString() === userId.toString() ? player.hand : undefined,
      score: player.score,
      isWinner: player.isWinner,
      isConnected: player.isConnected
    })),
    startedAt: gameObj.startedAt,
    completedAt: gameObj.completedAt,
    winner: gameObj.winner,
    winnerPayout: gameObj.winnerPayout
  };
};

/**
 * @desc    Create a new game or join a waiting game
 * @route   POST /api/games/create
 * @access  Private
 */
const createGame = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }

  const { stakeLevel } = req.body;
  const userId = req.user.id;
  const io = req.io; // Socket.io instance

  if (![5, 10, 15].includes(stakeLevel)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid stake level. Must be 5, 10, or 15 USD.' 
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get user info
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // 2. Check if user has sufficient funds
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet || (wallet.balance - wallet.lockedBalance) < stakeLevel) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Required: $${stakeLevel}, Available: $${wallet ? (wallet.balance - wallet.lockedBalance).toFixed(2) : 0}` 
      });
    }

    // 3. Check if user is already in an active game
    const existingGame = await Game.findOne({
      'players.userId': userId,
      status: { $in: ['waiting', 'active'] }
    }).session(session);

    if (existingGame) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'You are already in an active game.' 
      });
    }

    // 4. Lock funds for the game
    await Wallet.updateOne(
      { userId }, 
      { $inc: { lockedBalance: stakeLevel } }
    ).session(session);

    // 5. Find a waiting game with same stake level (MUST be different user)
    const waitingGame = await Game.findOne({
      status: 'waiting',
      stakeLevel: stakeLevel,
      'players.0.userId': { $ne: userId } // Explicitly check first player is not this user
    }).session(session);

    if (waitingGame) {
      // --- Player 2 joins, start the game ---
      
      // Double-check: Ensure it's not the same user (safety check)
      if (waitingGame.players[0].userId.toString() === userId.toString()) {
        console.error('⚠️  CRITICAL: Attempted self-match prevented!');
        await session.abortTransaction();
        session.endSession();
        
        // Create new game instead
        const newGame = new Game({
          gameMode: 'draw',
          stakeLevel,
          entryFee: stakeLevel,
          totalPot: 0,
          players: [{
            userId: user._id,
            username: user.username,
            avatar: user.avatar || 'default_avatar.png',
            hand: [],
            isConnected: true,
            lastSeen: new Date()
          }],
          status: 'waiting'
        });

        await newGame.save();
        console.log(`⏳ Game created: ${newGame._id} | Waiting for opponent...`);
        
        return res.status(201).json({ 
          success: true, 
          message: 'Game created. Waiting for an opponent.', 
          data: sanitizeGameForPlayer(newGame, userId) 
        });
      }
      
      // Add player 2 to game
      waitingGame.players.push({
        userId: user._id,
        username: user.username,
        avatar: user.avatar || 'default_avatar.png',
        hand: [],
        isConnected: true,
        lastSeen: new Date()
      });

      // Initialize game
      const tiles = dominoLogic.shuffleTiles();
      const { player1Hand, player2Hand, boneyard } = dominoLogic.distributeTiles(tiles);

      waitingGame.players[0].hand = player1Hand;
      waitingGame.players[1].hand = player2Hand;
      waitingGame.boneyard = boneyard;
      waitingGame.boneyardCount = boneyard.length;
      waitingGame.status = 'active';
      waitingGame.startedAt = new Date();
      waitingGame.turnNumber = 1;
      waitingGame.totalPot = stakeLevel * 2;
      waitingGame.entryFee = stakeLevel;
      
      // Player 1 (creator) always starts
      waitingGame.currentTurn = waitingGame.players[0].userId;
      waitingGame.turnStartedAt = new Date();

      await waitingGame.save({ session });
      await session.commitTransaction();
      session.endSession();

      console.log(`✅ Game started: ${waitingGame._id} | Players: ${waitingGame.players[0].username} vs ${waitingGame.players[1].username}`);

      // SOCKET: Emit game-started event to both players (if io available)
      if (io) {
        io.to(waitingGame._id.toString()).emit('game-started', {
          gameId: waitingGame._id.toString(),
          message: `Game started! ${waitingGame.players[0].username} goes first.`,
          currentTurn: waitingGame.currentTurn.toString()
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Joined game. Game starting!', 
        data: sanitizeGameForPlayer(waitingGame, userId) 
      });

    } else {
      // --- No waiting game, create a new one ---
      const newGame = new Game({
        gameMode: 'draw',
        stakeLevel,
        entryFee: stakeLevel,
        totalPot: 0,
        players: [{
          userId: user._id,
          username: user.username,
          avatar: user.avatar || 'default_avatar.png',
          hand: [],
          isConnected: true,
          lastSeen: new Date()
        }],
        status: 'waiting'
      });

      await newGame.save({ session });
      await session.commitTransaction();
      session.endSession();

      console.log(`⏳ Game created: ${newGame._id} | Waiting for opponent...`);

      return res.status(201).json({ 
        success: true, 
        message: 'Game created. Waiting for an opponent.', 
        data: sanitizeGameForPlayer(newGame, userId) 
      });
    }

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Attempt to unlock funds if game creation failed
    try {
      await Wallet.updateOne(
        { userId }, 
        { $inc: { lockedBalance: -stakeLevel } }
      );
    } catch (unlockError) {
      console.error('Error unlocking funds:', unlockError);
    }
    
    console.error('❌ Create Game Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during game creation.' 
    });
  }
};

/**
 * @desc    Get available waiting games
 * @route   GET /api/games/available
 * @access  Private
 */
const getAvailableGames = async (req, res) => {
  try {
    const { stakeLevel } = req.query;
    const userId = req.user.id;

    const query = {
      status: 'waiting',
      'players.userId': { $ne: userId } // Don't show user's own games
    };

    if (stakeLevel) {
      query.stakeLevel = parseInt(stakeLevel);
    }

    const games = await Game.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: games.length,
      data: games.map(game => ({
        _id: game._id,
        stakeLevel: game.stakeLevel,
        totalPot: game.totalPot,
        creator: game.players[0].username,
        createdAt: game.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Get Available Games Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available games.'
    });
  }
};

/**
 * @desc    Join a specific waiting game
 * @route   POST /api/games/:id/join
 * @access  Private
 */
const joinGame = async (req, res) => {
  const { id: gameId } = req.params;
  const userId = req.user.id;
  const io = req.io;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const game = await Game.findById(gameId).session(session);
    
    if (!game) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
    }

    if (game.status !== 'waiting') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Game is not available to join.'
      });
    }

    // Check if user is trying to join their own game
    if (game.players[0].userId.toString() === userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot join your own game.'
      });
    }

    const user = await User.findById(userId).session(session);
    const wallet = await Wallet.findOne({ userId }).session(session);

    if (!wallet || (wallet.balance - wallet.lockedBalance) < game.stakeLevel) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds.'
      });
    }

    // Lock funds
    await Wallet.updateOne(
      { userId },
      { $inc: { lockedBalance: game.stakeLevel } }
    ).session(session);

    // Add player 2 and start game
    game.players.push({
      userId: user._id,
      username: user.username,
      avatar: user.avatar || 'default_avatar.png',
      hand: [],
      isConnected: true,
      lastSeen: new Date()
    });

    // Initialize game
    const tiles = dominoLogic.shuffleTiles();
    const { player1Hand, player2Hand, boneyard } = dominoLogic.distributeTiles(tiles);

    game.players[0].hand = player1Hand;
    game.players[1].hand = player2Hand;
    game.boneyard = boneyard;
    game.boneyardCount = boneyard.length;
    game.status = 'active';
    game.startedAt = new Date();
    game.turnNumber = 1;
    game.totalPot = game.stakeLevel * 2;
    game.currentTurn = game.players[0].userId;
    game.turnStartedAt = new Date();

    await game.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Game started: ${game._id} | Players: ${game.players[0].username} vs ${game.players[1].username}`);

    if (io) {
      io.to(game._id.toString()).emit('game-started', {
        gameId: game._id.toString(),
        message: `Game started! ${game.players[0].username} goes first.`,
        currentTurn: game.currentTurn.toString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Joined game successfully!',
      data: sanitizeGameForPlayer(game, userId)
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Join Game Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error joining game.'
    });
  }
};

/**
 * @desc    Make a move in a game (play a tile)
 * @route   POST /api/games/:id/move
 * @access  Private
 */
const makeMove = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }

  const { id: gameId } = req.params;
  const { tile, position } = req.body;
  const userId = req.user.id;
  const io = req.io;

  try {
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ 
        success: false, 
        message: 'Game not found.' 
      });
    }
    
    if (game.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Game is not active.' 
      });
    }
    
    if (game.currentTurn.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "It's not your turn." 
      });
    }

    const player = game.getPlayer(userId);
    const opponent = game.getOpponent(userId);
    
    if (!player) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a player in this game.' 
      });
    }

    // ANTI-CHEAT: Does player have this tile?
    const tileInHandIndex = player.hand.findIndex(
      t => t.left === tile.left && t.right === tile.right
    );
    
    if (tileInHandIndex === -1) {
      console.warn(`🚨 CHEAT ATTEMPT: User ${userId} tried to play tile they don't have`);
      return res.status(403).json({ 
        success: false, 
        message: "You don't have this tile." 
      });
    }

    // ANTI-CHEAT: Is the move legal?
    if (!dominoLogic.isMoveValid(tile, game.board)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid move. This tile doesn't match the board endpoints." 
      });
    }

    // Remove tile from hand
    player.hand.splice(tileInHandIndex, 1);

    // Add tile to board
    if (position === 'start') {
      game.board.unshift(tile);
    } else {
      game.board.push(tile);
    }

    // Log move
    game.moves.push({
      moveNumber: game.turnNumber,
      userId: player.userId,
      action: 'place',
      tile: tile,
      position: position,
      isValid: true,
      timestamp: new Date()
    });

    player.movesCount += 1;
    game.turnNumber += 1;
    game.consecutivePasses = 0;

    // Check if player won (hand is empty)
    if (player.hand.length === 0) {
      return await endGame(game, player, 'empty_hand', res, io);
    }

    // Switch turn
    game.currentTurn = opponent.userId;
    game.turnStartedAt = new Date();

    await game.save();

    console.log(`🎮 Move made: ${player.username} played [${tile.left}|${tile.right}] at ${position}`);

    if (io) {
      io.to(game._id.toString()).emit('move-made', {
        gameId: game._id.toString(),
        playerId: player.userId.toString(),
        tile: tile,
        position: position,
        currentTurn: game.currentTurn.toString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Move made successfully!',
      data: sanitizeGameForPlayer(game, userId)
    });

  } catch (error) {
    console.error('❌ Make Move Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error making move.'
    });
  }
};

/**
 * @desc    Draw a tile from the boneyard
 * @route   POST /api/games/:id/draw
 * @access  Private
 */
const drawTile = async (req, res) => {
  const { id: gameId } = req.params;
  const userId = req.user.id;
  const io = req.io;

  try {
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
    }

    if (game.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Game is not active.'
      });
    }

    if (game.currentTurn.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "It's not your turn."
      });
    }

    if (game.boneyard.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Boneyard is empty. You must pass.'
      });
    }

    const player = game.getPlayer(userId);
    const opponent = game.getOpponent(userId);

    // Draw tile
    const drawnTile = game.boneyard.pop();
    player.hand.push(drawnTile);
    game.boneyardCount = game.boneyard.length;
    player.drawsCount += 1;

    // Log draw
    game.moves.push({
      moveNumber: game.turnNumber,
      userId: player.userId,
      action: 'draw',
      timestamp: new Date()
    });

    // Check if drawn tile can be played
    if (dominoLogic.isMoveValid(drawnTile, game.board)) {
      // Player can play - keep their turn
      await game.save();

      console.log(`🎲 ${player.username} drew a playable tile`);

      if (io) {
        io.to(game._id.toString()).emit('tile-drawn', {
          gameId: game._id.toString(),
          playerId: player.userId.toString(),
          canPlay: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tile drawn. You can play it!',
        data: sanitizeGameForPlayer(game, userId)
      });
    } else {
      // Cannot play - switch turn
      game.currentTurn = opponent.userId;
      game.turnStartedAt = new Date();
      game.turnNumber += 1;

      await game.save();

      console.log(`🎲 ${player.username} drew but cannot play - turn switched`);

      if (io) {
        io.to(game._id.toString()).emit('tile-drawn', {
          gameId: game._id.toString(),
          playerId: player.userId.toString(),
          canPlay: false,
          currentTurn: game.currentTurn.toString()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Tile drawn but cannot be played. Turn switched.',
        data: sanitizeGameForPlayer(game, userId)
      });
    }

  } catch (error) {
    console.error('❌ Draw Tile Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error drawing tile.'
    });
  }
};

/**
 * @desc    Pass turn (when cannot play and boneyard is empty)
 * @route   POST /api/games/:id/pass
 * @access  Private
 */
const passTurn = async (req, res) => {
  const { id: gameId } = req.params;
  const userId = req.user.id;
  const io = req.io;

  try {
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
    }

    if (game.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Game is not active.'
      });
    }

    if (game.currentTurn.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "It's not your turn."
      });
    }

    const player = game.getPlayer(userId);
    const opponent = game.getOpponent(userId);

    // Verify player cannot play
    if (dominoLogic.canPlayerPlay(player.hand, game.board)) {
      return res.status(400).json({
        success: false,
        message: 'You have a playable tile. You cannot pass.'
      });
    }

    // Log pass
    game.moves.push({
      moveNumber: game.turnNumber,
      userId: player.userId,
      action: 'pass',
      timestamp: new Date()
    });

    player.passCount += 1;
    game.consecutivePasses += 1;
    game.turnNumber += 1;

    // Check if game is blocked (both players passed)
    if (game.consecutivePasses >= 2) {
      return await handleBlockedGame(game, player, opponent, res, io);
    }

    // Switch turn
    game.currentTurn = opponent.userId;
    game.turnStartedAt = new Date();

    await game.save();

    console.log(`⏭️ ${player.username} passed turn`);

    if (io) {
      io.to(game._id.toString()).emit('turn-passed', {
        gameId: game._id.toString(),
        playerId: player.userId.toString(),
        currentTurn: game.currentTurn.toString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Turn passed.',
      data: sanitizeGameForPlayer(game, userId)
    });

  } catch (error) {
    console.error('❌ Pass Turn Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error passing turn.'
    });
  }
};

/**
 * @desc    Get current game state
 * @route   GET /api/games/:id
 * @access  Private
 */
const getGameState = async (req, res) => {
  try {
    const { id: gameId } = req.params;
    const userId = req.user.id;

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
    }

    // Check if user is a player in this game
    const isPlayer = game.players.some(p => p.userId.toString() === userId);

    if (!isPlayer) {
      return res.status(403).json({
        success: false,
        message: 'You are not a player in this game.'
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeGameForPlayer(game, userId)
    });

  } catch (error) {
    console.error('❌ Get Game State Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game state.'
    });
  }
};

/**
 * @desc    Get user's game history
 * @route   GET /api/games/history
 * @access  Private
 */
const getGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const games = await Game.find({
      'players.userId': userId,
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Game.countDocuments({
      'players.userId': userId,
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      count: games.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: games.map(game => sanitizeGameForPlayer(game, userId))
    });

  } catch (error) {
    console.error('❌ Get Game History Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game history.'
    });
  }
};

/**
 * @desc    Cancel a waiting game
 * @route   DELETE /api/games/:id
 * @access  Private
 */
const cancelGame = async (req, res) => {
  const { id: gameId } = req.params;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const game = await Game.findById(gameId).session(session);

    if (!game) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
    }

    if (game.status !== 'waiting') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Can only cancel waiting games.'
      });
    }

    // Check if user is the creator
    if (game.players[0].userId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Only the game creator can cancel.'
      });
    }

    // Unlock funds
    await Wallet.updateOne(
      { userId },
      { $inc: { lockedBalance: -game.stakeLevel } }
    ).session(session);

    // Mark game as cancelled
    game.status = 'cancelled';
    await game.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log(`❌ Game cancelled: ${game._id}`);

    res.status(200).json({
      success: true,
      message: 'Game cancelled successfully.'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Cancel Game Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling game.'
    });
  }
};

/**
 * Handle game end - award winner, update stats
 */
const endGame = async (game, winner, reason, res, io) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const loser = game.players.find(p => p.userId.toString() !== winner.userId.toString());

    // Calculate payouts
    const pot = game.totalPot;
    const houseCut = pot * HOUSE_FEE_PERCENTAGE;
    const winnerPayout = pot - houseCut;

    winner.isWinner = true;
    winner.payout = winnerPayout;
    loser.payout = 0;

    // Get wallet balances
    const winnerWallet = await Wallet.findOne({ userId: winner.userId }).session(session);
    const loserWallet = await Wallet.findOne({ userId: loser.userId }).session(session);
    
    const winnerBalanceBefore = winnerWallet.balance;
    const loserBalanceBefore = loserWallet.balance;

    // Update wallets
    await Wallet.findOneAndUpdate(
      { userId: winner.userId },
      {
        $inc: {
          balance: winnerPayout,
          lockedBalance: -game.stakeLevel
        },
        $push: {
          transactions: {
            type: 'win',
            amount: winnerPayout,
            balanceBefore: winnerBalanceBefore,
            balanceAfter: winnerBalanceBefore + winnerPayout,
            description: `Won game ${game._id}`,
            status: 'completed',
            gameId: game._id,
            completedAt: new Date()
          }
        }
      },
      { session }
    );

    await Wallet.findOneAndUpdate(
      { userId: loser.userId },
      {
        $inc: {
          lockedBalance: -game.stakeLevel
        },
        $push: {
          transactions: {
            type: 'loss',
            amount: game.stakeLevel,
            balanceBefore: loserBalanceBefore,
            balanceAfter: loserBalanceBefore,
            description: `Lost game ${game._id}`,
            status: 'completed',
            gameId: game._id,
            completedAt: new Date()
          }
        }
      },
      { session }
    );

    // Update user stats
    await User.findByIdAndUpdate(
      winner.userId,
      {
        $inc: { totalGames: 1, wins: 1, totalEarnings: winnerPayout, currentStreak: 1 }
      },
      { session }
    );

    await User.findByIdAndUpdate(
      loser.userId,
      {
        $inc: { totalGames: 1, losses: 1, totalLosses: game.stakeLevel },
        $set: { currentStreak: 0 }
      },
      { session }
    );

    // Update game
    game.status = 'completed';
    game.winner = winner.userId;
    game.completedAt = new Date();
    game.winnerPayout = winnerPayout;
    game.loserLoss = game.stakeLevel;
    game.platformFee = houseCut;
    game.feeProcessed = true;
    game.calculateDuration();
    
    await game.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    console.log(`🏆 Game completed: ${game._id} | Winner: ${winner.username} | Payout: $${winnerPayout}`);

    if (io) {
      io.to(game._id.toString()).emit('game-ended', {
        gameId: game._id.toString(),
        winnerId: winner.userId.toString(),
        winnerUsername: winner.username,
        winnerPayout: winnerPayout,
        message: `Game over! ${winner.username} wins!`,
        reason
      });
    }

    res.status(200).json({
      success: true,
      message: `Game over! ${winner.username} wins!`,
      data: sanitizeGameForPlayer(game, winner.userId.toString())
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ End Game Error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error ending game.'
      });
    }
  }
};

/**
 * Handle blocked game - both players passed
 */
const handleBlockedGame = async (game, player1, player2, res, io) => {
  const winner = dominoLogic.determineBlockedGameWinner(player1, player2);

  if (winner === null) {
    // It's a draw
    return await handleDraw(game, res, io);
  }

  return await endGame(game, winner, 'blocked', res, io);
};

/**
 * Handle draw - refund both players
 */
const handleDraw = async (game, res, io) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Refund both players
    for (const player of game.players) {
      const wallet = await Wallet.findOne({ userId: player.userId }).session(session);
      const balanceBefore = wallet.balance;
      
      await Wallet.findOneAndUpdate(
        { userId: player.userId },
        {
          $inc: {
            lockedBalance: -game.stakeLevel
          },
          $push: {
            transactions: {
              type: 'refund',
              amount: game.stakeLevel,
              balanceBefore: balanceBefore,
              balanceAfter: balanceBefore,
              description: 'Game draw - stake refunded',
              status: 'completed',
              gameId: game._id,
              completedAt: new Date()
            }
          }
        },
        { session }
      );

      await User.findByIdAndUpdate(
        player.userId,
        {
          $inc: { totalGames: 1, draws: 1 }
        },
        { session }
      );
    }

    game.status = 'completed';
    game.winner = null;
    game.completedAt = new Date();
    game.calculateDuration();
    await game.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log(`🤝 Game draw: ${game._id} | Both players refunded`);

    if (io) {
      io.to(game._id.toString()).emit('game-ended', {
        gameId: game._id.toString(),
        winnerId: null,
        message: "It's a draw! Stakes refunded.",
        reason: 'draw'
      });
    }

    res.status(200).json({
      success: true,
      message: "It's a draw! Stakes refunded.",
      data: sanitizeGameForPlayer(game, game.players[0].userId.toString())
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Handle Draw Error:', error);
    throw error;
  }
};

module.exports = {
  createGame,
  getAvailableGames,
  joinGame,
  makeMove,
  drawTile,
  passTurn,
  getGameState,
  getGameHistory,
  cancelGame
};