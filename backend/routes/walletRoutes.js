const express = require('express');
const router = express.Router();
const {
  getBalance,
  addTransaction,
  getTransactions,
  withdrawFunds
} = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');
const { transactionValidator, withdrawalValidator } = require('../utils/validators');

// Apply authentication middleware to ALL wallet routes
router.use(authMiddleware);

/**
 * @route   GET /api/wallet/balance
 * @desc    Get user's current wallet balance
 * @access  Private
 */
router.get('/balance', getBalance);

/**
 * @route   POST /api/wallet/transaction
 * @desc    Add a deposit transaction (for testing)
 * @access  Private
 * @note    In production, this would be called by payment gateway webhook
 */
router.post('/transaction', transactionValidator, addTransaction);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get user's transaction history (paginated)
 * @access  Private
 * @query   ?page=1&limit=10
 */
router.get('/transactions', getTransactions);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Request a withdrawal (requires admin approval)
 * @access  Private
 */
router.post('/withdraw', withdrawalValidator, withdrawFunds);

module.exports = router;
