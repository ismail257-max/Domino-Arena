import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from '../common/AnimatedButton';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import * as walletService from '../../services/walletService';

const AddFundsModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predefinedAmounts = [10, 25, 50, 100];

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError('');
      onClose();
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    setError('');

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    // Maximum amount validation (prevent huge deposits)
    if (numericAmount > 10000) {
      setError('Maximum deposit amount is $10,000 at a time.');
      return;
    }

    // Minimum amount validation
    if (numericAmount < 1) {
      setError('Minimum deposit amount is $1.');
      return;
    }
    
    setLoading(true);
    try {
      await walletService.addFunds(numericAmount, 'Testnet deposit');
      onSuccess(`$${numericAmount.toFixed(2)} added successfully!`);
      setAmount('');
      handleClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add funds. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-accent rounded-lg shadow-2xl w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleClose} 
            disabled={loading}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Add Funds</h2>
            
            {/* Testnet Warning */}
            <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 p-3 rounded-md text-sm flex items-start gap-2 mb-6">
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Testnet Mode</p>
                <p className="text-xs mt-1">This is for testing only. Not real money.</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddFunds}>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  max="10000"
                  placeholder="Enter amount (e.g., 25.00)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {predefinedAmounts.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      disabled={loading}
                      className="bg-gray-700 hover:bg-primary text-white font-semibold py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatedButton 
                type="submit" 
                loading={loading} 
                disabled={loading || !amount} 
                variant="primary"
              >
                Add Funds Now
              </AnimatedButton>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddFundsModal;
