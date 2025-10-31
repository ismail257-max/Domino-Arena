const Wallet = require('../models/Wallet');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * @desc    Get user's wallet balance
 * @route   GET /api/wallet/balance
 * @access  Private
 */
const getBalance = async (req, res) => {
  try {
    // Find wallet by the user ID from the authenticated request
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }
    
    // Check if wallet is frozen
    if (wallet.isFrozen) {
      return res.status(403).json({ 
        success: false, 
        message: 'Wallet is frozen. Please contact support.' 
      });
    }

    // Calculate available balance (balance minus locked funds)
    const availableBalance = wallet.balance - wallet.lockedBalance;

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        lockedBalance: wallet.lockedBalance,
        availableBalance: availableBalance >= 0 ? availableBalance : 0,
        currency: wallet.currency,
        isActive: wallet.isActive,
        isFrozen: wallet.isFrozen
      }
    });
    
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching balance' 
    });
  }
};


/**
 * @desc    Add a transaction (for testing deposits)
 * @route   POST /api/wallet/transaction
 * @access  Private
 * @note    In production, this would be triggered by payment gateway webhook
 */
const addTransaction = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }

  const { amount, description } = req.body;

  // Additional validation
  if (amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Amount must be greater than 0' 
    });
  }

  // Start MongoDB session for atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ userId: req.user.id }).session(session);
    
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }
    
    // Check wallet status
    if (wallet.isFrozen || !wallet.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ 
        success: false, 
        message: 'Wallet is not active or is frozen.' 
      });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Create transaction record
    const newTransaction = {
      type: 'deposit',
      amount,
      balanceBefore,
      balanceAfter,
      description: description || 'Test deposit',
      status: 'completed',
      completedAt: new Date()
    };

    // Atomic update: increment balance and add transaction
    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $inc: { balance: amount },
        $push: { 
          transactions: {
            $each: [newTransaction],
            $position: 0 // Add to beginning of array
          }
        }
      },
      { 
        new: true, 
        session,
        runValidators: true 
      }
    );

    if (!updatedWallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update wallet' 
      });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Deposit: $${amount} added to ${req.user.username}'s wallet`);

    res.status(200).json({ 
      success: true,
      message: 'Deposit successful',
      data: {
        balance: updatedWallet.balance,
        transaction: newTransaction
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error adding transaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while adding transaction' 
    });
  }
};


/**
 * @desc    Get user's transaction history with pagination
 * @route   GET /api/wallet/transactions
 * @access  Private
 */
const getTransactions = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Validate pagination limits
    const validLimit = Math.min(Math.max(limit, 1), 50); // Max 50 per page
    const skip = (page - 1) * validLimit;

    // Find wallet and get transactions
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }

    // Get total count
    const totalTransactions = wallet.transactions.length;
    
    // Get paginated transactions (already sorted by createdAt in model)
    const transactions = wallet.transactions
      .slice(skip, skip + validLimit)
      .map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        description: t.description,
        status: t.status,
        gameId: t.gameId,
        createdAt: t.createdAt,
        completedAt: t.completedAt
      }));

    res.status(200).json({
      success: true,
      count: transactions.length,
      total: totalTransactions,
      page,
      pages: Math.ceil(totalTransactions / validLimit),
      data: transactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching transactions' 
    });
  }
};


/**
 * @desc    Create a withdrawal request
 * @route   POST /api/wallet/withdraw
 * @access  Private
 */
const withdrawFunds = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg 
    });
  }

  const { amount, description } = req.body;

  // Additional validation
  if (amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Withdrawal amount must be greater than 0' 
    });
  }

  // Start MongoDB session for atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ userId: req.user.id }).session(session);

    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }
    
    // Check wallet status
    if (wallet.isFrozen || !wallet.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ 
        success: false, 
        message: 'Wallet is not active or is frozen.' 
      });
    }

    // Calculate available balance
    const availableBalance = wallet.balance - wallet.lockedBalance;
    
    if (amount > availableBalance) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient available funds. Available: $${availableBalance.toFixed(2)}` 
      });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;
    
    // Create withdrawal transaction
    const newTransaction = {
      type: 'withdrawal',
      amount,
      balanceBefore,
      balanceAfter,
      description: description || 'Withdrawal request',
      status: 'pending' // Requires admin approval
    };

    // Atomic update with double-check for sufficient funds
    const updatedWallet = await Wallet.findOneAndUpdate(
      { 
        userId: req.user.id, 
        balance: { $gte: amount } // Final safety check
      },
      {
        $inc: { balance: -amount },
        $push: { 
          transactions: {
            $each: [newTransaction],
            $position: 0
          }
        }
      },
      { 
        new: true, 
        session,
        runValidators: true 
      }
    );
    
    if (!updatedWallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: 'Withdrawal failed. Please try again.' 
      });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`⏳ Withdrawal request: $${amount} from ${req.user.username}'s wallet (pending approval)`);

    // In production, trigger admin notification here
    res.status(200).json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully. Pending admin approval.',
      data: {
        balance: updatedWallet.balance,
        transaction: newTransaction
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing withdrawal' 
    });
  }
};

module.exports = {
  getBalance,
  addTransaction,
  getTransactions,
  withdrawFunds
};
