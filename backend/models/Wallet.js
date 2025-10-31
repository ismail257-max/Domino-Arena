
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Represents a single financial transaction within a user's wallet.
 * This schema is embedded within the WalletSchema.
 */
const TransactionSchema = new Schema({
    type: {
        type: String,
        enum: ["deposit", "withdrawal", "win", "loss", "fee", "refund"],
        required: [true, 'Transaction type is required'],
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
    },
    balanceBefore: {
        type: Number,
        required: [true, 'Balance before transaction is required'],
    },
    balanceAfter: {
        type: Number,
        required: [true, 'Balance after transaction is required'],
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "cancelled"],
        default: "pending",
    },
    gameId: {
        type: Schema.Types.ObjectId,
        ref: 'Game', // Reference to a Game model
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
});

/**
 * Represents a user's wallet, holding their balance and transaction history.
 */
const WalletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: [0, 'Balance cannot be negative'],
    },
    currency: {
        type: String,
        default: "USD",
    },
    lockedBalance: {
        type: Number,
        default: 0,
        min: [0, 'Locked balance cannot be negative'],
    },
    transactions: [TransactionSchema],
    isActive: {
        type: Boolean,
        default: true,
    },
    isFrozen: {
        type: Boolean,
        default: false,
    },
}, { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Add indexes for frequently queried fields within the transactions array
WalletSchema.index({ 'transactions.type': 1 });
WalletSchema.index({ 'transactions.status': 1 });
WalletSchema.index({ 'transactions.createdAt': -1 });

module.exports = mongoose.model('Wallet', WalletSchema);
