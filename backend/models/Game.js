const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Sub-Schema: Domino Tile ---
const TileSchema = new Schema({
  left: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 6 
  },
  right: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 6 
  }
}, { _id: false });

// --- Sub-Schema: Player in Game ---
const PlayerSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  avatar: {
    type: String,
    default: 'default_avatar.png'
  },
  
  // Player's current hand
  hand: [TileSchema],
  
  // Game statistics
  score: { 
    type: Number, 
    default: 0 
  },
  movesCount: { 
    type: Number, 
    default: 0 
  },
  drawsCount: { 
    type: Number, 
    default: 0 
  },
  passCount: { 
    type: Number, 
    default: 0 
  },
  avgMoveTime: { 
    type: Number, 
    default: 0 
  },
  
  // Result
  isWinner: { 
    type: Boolean, 
    default: false 
  },
  payout: { 
    type: Number, 
    default: 0 
  },
  
  // Connection status
  isConnected: { 
    type: Boolean, 
    default: true 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

// --- Sub-Schema: Move in Game (Audit Trail) ---
const MoveSchema = new Schema({
  moveNumber: { 
    type: Number, 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: {
    type: String,
    enum: ['place', 'draw', 'pass'],
    required: true
  },
  tile: TileSchema, // The tile played (null if draw/pass)
  position: {
    type: String,
    enum: ['start', 'end', null],
    default: null
  },
  isValid: {
    type: Boolean,
    default: true
  },
  validatedBy: {
    type: String,
    default: 'server'
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

// --- Main Game Schema ---
const GameSchema = new Schema({
  // Game Configuration
  gameMode: {
    type: String,
    default: 'draw',
    required: true,
    enum: ['draw', 'block', 'allfives']
  },
  stakeLevel: {
    type: Number,
    enum: [5, 10, 15], // USD
    required: true,
    index: true
  },
  entryFee: {
    type: Number,
    required: true
  },
  totalPot: {
    type: Number,
    default: 0
  },
  
  // Players (max 2)
  players: {
    type: [PlayerSchema],
    validate: {
      validator: function(v) {
        return v.length <= 2;
      },
      message: 'A game can have maximum 2 players'
    }
  },
  
  // Game Board State
  board: [TileSchema],
  
  // Boneyard (Draw pile)
  boneyard: [TileSchema],
  boneyardCount: {
    type: Number,
    default: 0
  },
  
  // Game Flow
  currentTurn: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  turnNumber: {
    type: Number,
    default: 0
  },
  maxTurnTime: {
    type: Number,
    default: 30 // seconds
  },
  turnStartedAt: {
    type: Date
  },
  
  // Game Status
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled', 'abandoned'],
    default: 'waiting',
    index: true
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Financial
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  winnerPayout: {
    type: Number,
    default: 0
  },
  loserLoss: {
    type: Number,
    default: 0
  },
  platformFee: {
    type: Number,
    default: 0
  },
  feeProcessed: {
    type: Boolean,
    default: false
  },
  
  // Room Info (for future private games)
  roomCode: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxPlayers: {
    type: Number,
    default: 2
  },
  
  // Move History (Complete audit trail)
  moves: [MoveSchema],
  
  // Tracking for blocked game detection
  consecutivePasses: {
    type: Number,
    default: 0
  },
  lastMoveWasPass: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// --- Indexes for Performance ---
GameSchema.index({ status: 1, stakeLevel: 1 });
GameSchema.index({ 'players.userId': 1 });
GameSchema.index({ winner: 1 });
GameSchema.index({ createdAt: -1 });
GameSchema.index({ status: 1, createdAt: -1 });

// --- Methods ---

// Calculate game duration
GameSchema.methods.calculateDuration = function() {
  if (this.startedAt && this.completedAt) {
    this.duration = Math.floor((this.completedAt - this.startedAt) / 1000);
  }
  return this.duration;
};

// Check if game is full
GameSchema.methods.isFull = function() {
  return this.players.length >= this.maxPlayers;
};

// Get opponent for a given user
GameSchema.methods.getOpponent = function(userId) {
  return this.players.find(p => p.userId.toString() !== userId.toString());
};

// Get player by userId
GameSchema.methods.getPlayer = function(userId) {
  return this.players.find(p => p.userId.toString() === userId.toString());
};

module.exports = mongoose.model('Game', GameSchema);
