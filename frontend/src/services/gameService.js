import api from '../utils/api';

/**
 * Game Service - API calls for game operations
 * All game logic is validated server-side only
 */

// Create a new game
export const createGame = async (stakeAmount) => {
  const response = await api.post('/games/create', { stakeAmount });
  return response.data.data;
};

// Get all available games (waiting for players)
export const getAvailableGames = async (filters = {}) => {
  const response = await api.get('/games/available', { params: filters });
  return response.data.data;
};

// Get user's games (active and completed)
export const getMyGames = async () => {
  const response = await api.get('/games/my-games');
  return response.data.data;
};

// Get specific game details
export const getGame = async (gameId) => {
  const response = await api.get(`/games/${gameId}`);
  return response.data.data;
};

// Join an available game
export const joinGame = async (gameId) => {
  const response = await api.post(`/games/${gameId}/join`);
  return response.data.data;
};

// Cancel a game (only creator can cancel before it starts)
export const cancelGame = async (gameId) => {
  const response = await api.delete(`/games/${gameId}`);
  return response.data;
};

// ==================== PHASE 4: GAMEPLAY FUNCTIONS ====================

/**
 * Get current game state
 * Returns: game object with board, players, current turn, etc.
 * IMPORTANT: Server NEVER sends opponent's hand to client
 */
export const getGameState = async (gameId) => {
  const response = await api.get(`/games/${gameId}`);
  return response.data.data;
};

/**
 * Make a move (play a domino tile)
 * @param {string} gameId - The game ID
 * @param {object} moveData - { tile: [left, right], position: 'start' | 'end' }
 * 
 * SECURITY: Server validates:
 * - Is it the player's turn?
 * - Does the player have this tile?
 * - Is the move valid (tile matches endpoint)?
 * - Game is in 'active' status
 */
export const makeMove = async (gameId, moveData) => {
  const response = await api.post(`/games/${gameId}/move`, moveData);
  return response.data.data;
};

/**
 * Draw a tile from the boneyard
 * @param {string} gameId - The game ID
 * 
 * SECURITY: Server validates:
 * - Is it the player's turn?
 * - Are there tiles in the boneyard?
 * - Does the player have no valid moves?
 */
export const drawTile = async (gameId) => {
  const response = await api.post(`/games/${gameId}/draw`);
  return response.data.data;
};

/**
 * Pass turn (when no tiles in boneyard and no valid moves)
 * @param {string} gameId - The game ID
 * 
 * SECURITY: Server validates:
 * - Is it the player's turn?
 * - Is the boneyard empty?
 * - Does the player have no valid moves?
 */
export const passTurn = async (gameId) => {
  const response = await api.post(`/games/${gameId}/pass`);
  return response.data.data;
};

/**
 * Leave/forfeit a game
 * @param {string} gameId - The game ID
 * 
 * This will forfeit the game and the player will lose their stake
 */
export const leaveGame = async (gameId) => {
  const response = await api.post(`/games/${gameId}/leave`);
  return response.data;
};

export default {
  createGame,
  getAvailableGames,
  getMyGames,
  getGame,
  joinGame,
  cancelGame,
  getGameState,
  makeMove,
  drawTile,
  passTurn,
  leaveGame,
};
