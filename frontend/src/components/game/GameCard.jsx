import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaClock, FaCoins } from 'react-icons/fa';
import AnimatedButton from '../common/AnimatedButton';
import GameStatusBadge from './GameStatusBadge';
import { useAuth } from '../../context/AuthContext';

const GameCard = ({ game, onJoin, onCancel, isActionLoading = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCreator = game.players[0]?.userId === user.id;
  const opponent = game.players.find(p => p.userId !== user.id);

  const renderActionButton = () => {
    switch (game.status) {
      case 'waiting':
        if (isCreator) {
          return (
            <AnimatedButton onClick={() => onCancel(game._id)} variant="danger" loading={isActionLoading}>
              Cancel
            </AnimatedButton>
          );
        }
        return (
          <AnimatedButton onClick={() => onJoin(game._id)} variant="secondary" loading={isActionLoading}>
            Join Game
          </AnimatedButton>
        );
      case 'in-progress':
        return (
          <AnimatedButton onClick={() => navigate(`/game/${game._id}`)} variant="primary">
            Continue
          </AnimatedButton>
        );
      case 'completed':
        return (
          <AnimatedButton onClick={() => navigate(`/game/${game._id}`)} variant="outline">
            View Details
          </AnimatedButton>
        );
      default:
        return null;
    }
  };

  const getOpponentDisplay = () => {
    if (game.status === 'waiting') {
      return `Created by ${game.players[0].username}`;
    }
    if (opponent) {
      return `vs ${opponent.username}`;
    }
    return `vs ${game.players.find(p => p.userId !== user.id)?.username || 'Opponent'}`;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="bg-dark-accent p-5 rounded-lg shadow-lg flex flex-col justify-between gap-4"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 text-xl font-bold text-yellow-400">
          <FaCoins />
          <span>${game.stakeAmount}</span>
        </div>
        <GameStatusBadge status={game.status} winnerId={game.winner} currentUserId={user.id} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-300">
          <FaUser />
          <span className="font-medium">{getOpponentDisplay()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <FaClock />
          <span>{new Date(game.createdAt).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="mt-2">
        {renderActionButton()}
      </div>
    </motion.div>
  );
};

export default GameCard;
