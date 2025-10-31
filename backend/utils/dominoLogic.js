
const TILE_SET = [
    { left: 0, right: 0 }, { left: 0, right: 1 }, { left: 0, right: 2 }, { left: 0, right: 3 }, { left: 0, right: 4 }, { left: 0, right: 5 }, { left: 0, right: 6 },
    { left: 1, right: 1 }, { left: 1, right: 2 }, { left: 1, right: 3 }, { left: 1, right: 4 }, { left: 1, right: 5 }, { left: 1, right: 6 },
    { left: 2, right: 2 }, { left: 2, right: 3 }, { left: 2, right: 4 }, { left: 2, right: 5 }, { left: 2, right: 6 },
    { left: 3, right: 3 }, { left: 3, right: 4 }, { left: 3, right: 5 }, { left: 3, right: 6 },
    { left: 4, right: 4 }, { left: 4, right: 5 }, { left: 4, right: 6 },
    { left: 5, right: 5 }, { left: 5, right: 6 },
    { left: 6, right: 6 }
];

/**
 * Creates and shuffles a standard 28-piece domino set.
 * @returns {Array<Object>} A shuffled array of domino tiles.
 */
const shuffleTiles = () => {
    const tiles = [...TILE_SET];
    // Fisher-Yates shuffle algorithm
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
};

/**
 * Distributes 7 tiles to each of the two players.
 * @param {Array<Object>} shuffledTiles - The shuffled deck of 28 tiles.
 * @returns {Object} An object containing hands for two players and the remaining boneyard.
 */
const distributeTiles = (shuffledTiles) => {
    const player1Hand = shuffledTiles.slice(0, 7);
    const player2Hand = shuffledTiles.slice(7, 14);
    const boneyard = shuffledTiles.slice(14);
    return { player1Hand, player2Hand, boneyard };
};

/**
 * Determines the endpoints of the domino chain on the board.
 * @param {Array<Object>} board - The current dominoes on the board.
 * @returns {Array<number>} An array with the two open numbers, or null if board is empty.
 */
const getBoardEndpoints = (board) => {
    if (board.length === 0) {
        return null;
    }
    const firstTile = board[0];
    const lastTile = board[board.length - 1];
    return [firstTile.left, lastTile.right];
};


/**
 * Validates if a tile can be legally played on the board.
 * @param {Object} tile - The tile to be played {left, right}.
 * @param {Array<Object>} board - The current dominoes on the board.
 * @returns {boolean} True if the move is valid, false otherwise.
 */
const isMoveValid = (tile, board) => {
    if (board.length === 0) {
        return true; // Any tile can be played on an empty board
    }
    const endpoints = getBoardEndpoints(board);
    return tile.left === endpoints[0] || tile.right === endpoints[0] ||
           tile.left === endpoints[1] || tile.right === endpoints[1];
};

/**
 * Checks if a player has any playable tile in their hand.
 * @param {Array<Object>} hand - The player's hand.
 * @param {Array<Object>} board - The current dominoes on the board.
 * @returns {boolean} True if the player can make a move, false otherwise.
 */
const canPlayerPlay = (hand, board) => {
    if (board.length === 0) {
        return true;
    }
    const endpoints = getBoardEndpoints(board);
    return hand.some(tile => tile.left === endpoints[0] || tile.right === endpoints[0] ||
                              tile.left === endpoints[1] || tile.right === endpoints[1]);
};

/**
 * Calculates the total pip value of a player's hand.
 * @param {Array<Object>} hand - The player's hand.
 * @returns {number} The sum of all pips in the hand.
 */
const calculateScore = (hand) => {
    return hand.reduce((total, tile) => total + tile.left + tile.right, 0);
};

/**
 * Determines the winner in a blocked game scenario (both players passed).
 * The player with the lowest score wins.
 * @param {Object} player1 - Player 1 object with hand.
 * @param {Object} player2 - Player 2 object with hand.
 * @returns {Object|null} The winning player's object, or null for a draw.
 */
const determineBlockedGameWinner = (player1, player2) => {
    const score1 = calculateScore(player1.hand);
    const score2 = calculateScore(player2.hand);
    
    player1.score = score1;
    player2.score = score2;

    if (score1 < score2) {
        return player1;
    }
    if (score2 < score1) {
        return player2;
    }
    return null; // It's a draw
};


module.exports = {
    shuffleTiles,
    distributeTiles,
    isMoveValid,
    canPlayerPlay,
    calculateScore,
    determineBlockedGameWinner,
    getBoardEndpoints
};
