const socketAuth = require('../middleware/socketAuth');
const Game = require('../models/Game');
const { finalizeGame } = require('../controllers/gameController');

// In-memory store for user-socket mapping and disconnect timers
const onlineUsers = new Map(); // K: userId (string), V: socketId (string)
const disconnectTimers = new Map(); // K: userId (string), V: NodeJS.Timeout
const socketEventCounts = new Map(); // K: socketId, V: { count, resetTime }

const FORFEIT_TIMEOUT = 60 * 1000; // 60 seconds
const RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds
const RATE_LIMIT_MAX_EVENTS = 20; // Max 20 events per 10 seconds

/**
 * Simple rate limiter for socket events
 */
const checkRateLimit = (socketId) => {
  const now = Date.now();
  const record = socketEventCounts.get(socketId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > record.resetTime) {
    // Reset the counter
    socketEventCounts.set(socketId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_EVENTS) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  socketEventCounts.set(socketId, record);
  return true;
};

const initializeSocket = (io) => {
  // Use the authentication middleware for all incoming connections
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`✅ Socket connected: User ${userId} | Socket ${socket.id}`);

    // Store the mapping
    onlineUsers.set(userId, socket.id);
    
    // If there was a disconnect timer for this user, clear it upon reconnection
    if (disconnectTimers.has(userId)) {
      clearTimeout(disconnectTimers.get(userId));
      disconnectTimers.delete(userId);
      console.log(`🔄 User ${userId} reconnected, forfeit timer cleared.`);
      // Notify opponent of reconnection
      findActiveGameAndNotify(userId, 'opponent-reconnected', io);
    }

    /**
     * JOIN GAME ROOM
     */
    socket.on('join-game', (gameId) => {
      // Rate limit check
      if (!checkRateLimit(socket.id)) {
        socket.emit('error', { message: 'Too many requests. Please slow down.' });
        return;
      }

      if (!gameId || typeof gameId !== 'string') {
        socket.emit('error', { message: 'Invalid game ID' });
        return;
      }

      socket.join(gameId);
      console.log(`🎮 User ${userId} joined game room: ${gameId}`);
      
      // Notify others in the room that this user has connected
      socket.to(gameId).emit('opponent-connected', { userId });
    });

    /**
     * LEAVE GAME ROOM
     */
    socket.on('leave-game', (gameId) => {
      // Rate limit check
      if (!checkRateLimit(socket.id)) {
        return;
      }

      if (!gameId || typeof gameId !== 'string') {
        return;
      }

      socket.leave(gameId);
      console.log(`👋 User ${userId} left game room: ${gameId}`);
    });

    /**
     * DISCONNECT HANDLER
     */
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: User ${userId}`);
      onlineUsers.delete(userId);
      socketEventCounts.delete(socket.id);

      // Find if the user was in an active game to handle disconnects/forfeits
      findActiveGameAndNotify(userId, 'opponent-disconnected', io, (game, opponent) => {
        if (game && opponent) {
          console.log(`⏱️ Starting ${FORFEIT_TIMEOUT/1000}s forfeit timer for user ${userId} in game ${game._id}`);
          
          const timer = setTimeout(async () => {
            console.log(`⏰ Forfeit timer expired for user ${userId}. Game ${game._id} forfeited.`);
            
            try {
              const gameToForfeit = await Game.findById(game._id);
              
              if (gameToForfeit && gameToForfeit.status === 'active') {
                // The opponent is the winner by forfeit
                const winner = opponent;
                const updatedGame = await finalizeGame(gameToForfeit, winner);

                io.to(game._id.toString()).emit('game-ended', { 
                  message: `Game ended. ${winner.username} wins by forfeit!`,
                  winnerId: winner.userId.toString(),
                  winnerUsername: winner.username,
                  gameId: game._id.toString(),
                  reason: 'forfeit'
                });
              }
            } catch (error) {
              console.error('❌ Error during forfeit processing:', error);
              io.to(game._id.toString()).emit('error', { 
                message: 'A server error occurred while processing a forfeit.' 
              });
            }
            
            disconnectTimers.delete(userId);
          }, FORFEIT_TIMEOUT);
          
          disconnectTimers.set(userId, timer);
        }
      });
    });
  });
};

/**
 * Helper function to find a user's active game and notify the opponent
 */
async function findActiveGameAndNotify(userId, event, io, callback) {
  try {
    const activeGame = await Game.findOne({ 
      'players.userId': userId, 
      status: 'active' 
    });
    
    if (activeGame) {
      const opponent = activeGame.players.find(p => p.userId.toString() !== userId);
      
      if (opponent) {
        io.to(activeGame._id.toString()).emit(event, { 
          userId,
          gameId: activeGame._id.toString()
        });
        
        if (callback) {
          callback(activeGame, opponent);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error in findActiveGameAndNotify for user ${userId}:`, error);
  }
}

module.exports = initializeSocket;

/**
 * ═══════════════════════════════════════════════════════════════════
 * SOCKET EVENT DOCUMENTATION
 * ═══════════════════════════════════════════════════════════════════
 * 
 * CLIENT → SERVER (Events the client can emit)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 1. connect
 *    Description: Establishes a WebSocket connection with the server
 *    Auth: Requires valid JWT in socket.handshake.auth.token
 *    Example:
 *      import { io } from "socket.io-client";
 *      const socket = io("http://localhost:5000", {
 *        auth: { token: "your_jwt_token_here" }
 *      });
 * 
 * 2. join-game
 *    Description: Join a specific game room to receive real-time updates
 *    Payload: gameId (string) - The game ID to join
 *    Example: socket.emit('join-game', '671234567890abcdef');
 * 
 * 3. leave-game
 *    Description: Leave a game room
 *    Payload: gameId (string) - The game ID to leave
 *    Example: socket.emit('leave-game', '671234567890abcdef');
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════
 * SERVER → CLIENT (Events the server emits)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 1. game-started
 *    Description: Game has officially started with 2 players
 *    Payload: { 
 *      gameId: string, 
 *      message: string,
 *      currentTurn: string (userId)
 *    }
 *    Action: Client should fetch initial game state via REST API
 *    Example handler:
 *      socket.on('game-started', (data) => {
 *        console.log(data.message);
 *        fetchGameState(data.gameId);
 *      });
 * 
 * 2. game-updated
 *    Description: Game state changed (move/draw/pass)
 *    Payload: { 
 *      gameId: string, 
 *      reason: string ('move-made' | 'tile-drawn' | 'turn-passed'),
 *      currentTurn: string (userId),
 *      turnNumber: number
 *    }
 *    Action: Client should re-fetch game state via GET /api/games/:id
 *    Example handler:
 *      socket.on('game-updated', (data) => {
 *        if (data.reason === 'move-made') {
 *          fetchGameState(data.gameId);
 *        }
 *      });
 * 
 * 3. game-ended
 *    Description: Game has concluded
 *    Payload: { 
 *      gameId: string, 
 *      winnerId: string | null,
 *      winnerUsername: string,
 *      winnerPayout: number,
 *      message: string,
 *      reason: string ('domino' | 'blocked' | 'draw' | 'forfeit')
 *    }
 *    Action: Show game over screen with winner info
 *    Example handler:
 *      socket.on('game-ended', (data) => {
 *        showGameOverScreen(data);
 *      });
 * 
 * 4. opponent-connected
 *    Description: Opponent has joined the game room
 *    Payload: { userId: string }
 *    Action: Show "Opponent online" indicator
 *    Example handler:
 *      socket.on('opponent-connected', (data) => {
 *        showOpponentOnline();
 *      });
 * 
 * 5. opponent-disconnected
 *    Description: Opponent has disconnected (60s forfeit timer started)
 *    Payload: { userId: string, gameId: string }
 *    Action: Show "Opponent disconnected - 60s to reconnect" warning
 *    Example handler:
 *      socket.on('opponent-disconnected', (data) => {
 *        showDisconnectWarning();
 *        startForfeitCountdown(60);
 *      });
 * 
 * 6. opponent-reconnected
 *    Description: Opponent has reconnected (forfeit cancelled)
 *    Payload: { userId: string, gameId: string }
 *    Action: Hide disconnect warning
 *    Example handler:
 *      socket.on('opponent-reconnected', (data) => {
 *        hideDisconnectWarning();
 *        showOpponentOnline();
 *      });
 * 
 * 7. error
 *    Description: An error occurred
 *    Payload: { message: string }
 *    Action: Display error to user
 *    Example handler:
 *      socket.on('error', (data) => {
 *        showErrorMessage(data.message);
 *      });
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════
 * INTEGRATION WITH REST API
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Socket.io provides NOTIFICATIONS only. Actual game actions use REST API:
 * 
 * - Create game: POST /api/games/create
 * - Make move: POST /api/games/:id/move
 * - Draw tile: POST /api/games/:id/draw
 * - Pass turn: POST /api/games/:id/pass
 * - Get game state: GET /api/games/:id
 * 
 * FLOW:
 * 1. Client makes REST API call (e.g., POST /api/games/:id/move)
 * 2. Server processes the action
 * 3. Server emits socket event (e.g., 'game-updated')
 * 4. BOTH clients receive notification
 * 5. Clients fetch latest game state via GET /api/games/:id
 * 
 * This approach keeps game logic secure on the server while providing
 * real-time notifications to enhance user experience.
 * 
 * 
 * ═══════════════════════════════════════════════════════════════════
 * SECURITY NOTES
 * ═══════════════════════════════════════════════════════════════════
 * 
 * - All socket connections require valid JWT authentication
 * - Rate limiting: Max 20 events per 10 seconds per socket
 * - Opponent's hand is NEVER sent through sockets
 * - Game logic is NOT executed via sockets (REST API only)
 * - Sockets are for notifications and connection status only
 * - Server validates all game IDs before emitting to rooms
 * 
 */
