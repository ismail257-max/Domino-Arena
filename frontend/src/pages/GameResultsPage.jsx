import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrophy, FaCoins, FaDollarSign, FaGamepad } from 'react-icons/fa';
import AnimatedButton from '../components/common/AnimatedButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const GameResultsPage = () => {
  const { id: gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Get data passed from GameBoardPage
  const gameData = location.state;

  useEffect(() => {
    // If no data was passed, redirect back to lobby
    if (!gameData) {
      navigate('/lobby');
    } else {
      setLoading(false);
    }
  }, [gameData, navigate]);

  if (loading || !gameData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { winner, loser, stake, commission, reason } = gameData;
  const isWinner = winner._id === user.id;
  
  // Calculate amounts
  const stakeAmount = stake || 0;
  const commissionAmount = commission || (stakeAmount * 0.12);
  const winnerPayout = (stakeAmount * 2) - commissionAmount;
  const netProfit = isWinner ? winnerPayout - stakeAmount : -stakeAmount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-dark"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-dark-accent rounded-xl shadow-2xl p-8 max-w-md w-full border-2 border-gray-700"
      >
        {/* Result Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-4"
          >
            {isWinner ? (
              <FaTrophy className="text-8xl text-yellow-500 mx-auto" />
            ) : (
              <div className="text-8xl">😔</div>
            )}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl font-bold mb-2 ${isWinner ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            {isWinner ? 'Victory!' : 'Defeat'}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            {reason || (isWinner ? 'You won the game!' : 'Better luck next time!')}
          </motion.p>
        </div>

        {/* Game Stats */}
        <div className="space-y-4 mb-8">
          {/* Winner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between p-3 bg-dark rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FaTrophy className="text-2xl text-yellow-500" />
              <div>
                <p className="text-xs text-gray-400">Winner</p>
                <p className="font-bold text-white">{winner.username}</p>
              </div>
            </div>
          </motion.div>

          {/* Loser */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between p-3 bg-dark rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FaGamepad className="text-2xl text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Loser</p>
                <p className="font-bold text-white">{loser.username}</p>
              </div>
            </div>
          </motion.div>

          {/* Stake Amount */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-between p-3 bg-dark rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FaCoins className="text-2xl text-primary" />
              <div>
                <p className="text-xs text-gray-400">Stake Amount</p>
                <p className="font-bold text-white">${stakeAmount.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          {/* Commission */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-between p-3 bg-dark rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FaDollarSign className="text-2xl text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Commission (12%)</p>
                <p className="font-bold text-white">${commissionAmount.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          {/* Net Result */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: 'spring' }}
            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              isWinner 
                ? 'bg-secondary/20 border-secondary' 
                : 'bg-danger/20 border-danger'
            }`}
          >
            <div>
              <p className="text-xs text-gray-400">Your Net Result</p>
              <p className={`text-2xl font-bold ${
                isWinner ? 'text-secondary' : 'text-danger'
              }`}>
                {isWinner ? '+' : ''}{netProfit >= 0 ? '$' : '-$'}{Math.abs(netProfit).toFixed(2)}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <AnimatedButton
            onClick={() => navigate('/lobby')}
            variant="primary"
            className="w-full"
          >
            Back to Lobby
          </AnimatedButton>
          <AnimatedButton
            onClick={() => navigate('/wallet')}
            variant="outline"
            className="w-full"
          >
            View Wallet
          </AnimatedButton>
        </div>

        {/* Game ID Reference */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Game ID: {gameId}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default GameResultsPage;
