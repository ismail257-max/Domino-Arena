import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from '../common/AnimatedButton';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';
import * as gameService from '../../services/gameService';

const STAKE_OPTIONS = [5, 10, 15];
const ENTRY_FEE_PERCENTAGE = 0.20; // 20% entry fee
const PLATFORM_COMMISSION = 0.12; // 12% platform commission

const CreateGameModal = ({ isOpen, onClose, onSuccess, userBalance }) => {
  const [selectedStake, setSelectedStake] = useState(STAKE_OPTIONS[1]); // Default $10
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculations = useMemo(() => {
    const stake = selectedStake;
    const entryFee = stake * ENTRY_FEE_PERCENTAGE;
    const totalDeducted = stake + entryFee;
    const totalPot = stake * 2; // Both players' stakes
    const platformCut = totalPot * PLATFORM_COMMISSION;
    const winnerPayout = totalPot - platformCut;
    
    return { 
      stake, 
      entryFee, 
      totalDeducted, 
      totalPot,
      platformCut, 
      winnerPayout 
    };
  }, [selectedStake]);

  const hasSufficientFunds = userBalance >= calculations.totalDeducted;

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  const handleCreateGame = async () => {
    setError('');

    if (!hasSufficientFunds) {
      setError("You don't have enough funds to create this game.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await gameService.createGame(selectedStake);
      onSuccess(response.message || 'Game created successfully!');
      handleClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create game. Please try again.';
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
          className="bg-dark-accent rounded-lg shadow-2xl w-full max-w-lg relative"
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
            <h2 className="text-3xl font-bold text-white mb-6">Create New Game</h2>
            
            {/* Stake Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Stake Amount
              </label>
              <div className="grid grid-cols-3 gap-3">
                {STAKE_OPTIONS.map(stake => (
                  <button
                    key={stake}
                    onClick={() => setSelectedStake(stake)}
                    disabled={loading}
                    className={`
                      py-3 px-4 rounded-lg font-semibold text-lg transition-all
                      ${selectedStake === stake 
                        ? 'bg-secondary text-white ring-2 ring-offset-2 ring-offset-dark-accent ring-secondary shadow-lg' 
                        : 'bg-dark hover:bg-gray-700 text-gray-300'}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    ${stake}
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-dark p-5 rounded-lg space-y-3 text-gray-300 border border-gray-700">
              <h3 className="font-semibold text-white mb-3">Game Details:</h3>
              
              <div className="flex justify-between items-center">
                <span>Your Stake:</span> 
                <span className="font-semibold text-white">${calculations.stake.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Entry Fee ({(ENTRY_FEE_PERCENTAGE * 100)}%):</span> 
                <span className="font-semibold text-white">${calculations.entryFee.toFixed(2)}</span>
              </div>
              
              <hr className="border-gray-600" />
              
              <div className="flex justify-between items-center text-lg">
                <strong>Total Deducted:</strong> 
                <strong className="text-red-400">${calculations.totalDeducted.toFixed(2)}</strong>
              </div>
              
              <hr className="border-gray-600" />
              
              <div className="flex justify-between items-center">
                <span>Total Pot (Both Stakes):</span> 
                <span className="font-semibold text-white">${calculations.totalPot.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Platform Fee ({(PLATFORM_COMMISSION * 100)}%):</span> 
                <span className="font-semibold text-orange-400">-${calculations.platformCut.toFixed(2)}</span>
              </div>
              
              <hr className="border-gray-600" />
              
              <div className="flex justify-between items-center text-lg">
                <strong>Winner Gets:</strong> 
                <strong className="text-green-400">${calculations.winnerPayout.toFixed(2)}</strong>
              </div>
              
              <div className="flex items-start gap-2 text-xs text-gray-400 mt-2">
                <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                <span>Loser loses their ${calculations.stake.toFixed(2)} stake. Platform keeps ${calculations.platformCut.toFixed(2)} commission.</span>
              </div>
            </div>

            {/* Balance Warning */}
            {!hasSufficientFunds && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                Insufficient balance. You need ${calculations.totalDeducted.toFixed(2)} but only have ${userBalance.toFixed(2)}. Please add funds to your wallet.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {/* Action Button */}
            <div className="mt-6">
              <AnimatedButton 
                onClick={handleCreateGame} 
                loading={loading} 
                disabled={loading || !hasSufficientFunds} 
                variant="secondary"
              >
                Create Game & Wait for Opponent
              </AnimatedButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateGameModal;
