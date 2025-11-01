import React from 'react';
import { motion } from 'framer-motion';
import { FaUserCircle, FaLayerGroup } from 'react-icons/fa';
import ConnectionStatus from './ConnectionStatus';

const PlayerInfo = ({ player, handCount = 0, isMyTurn, isConnected, isMe }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: isMe ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        bg-dark-accent p-3 rounded-lg shadow-lg flex items-center gap-4 border-2
        ${isMyTurn ? 'border-primary shadow-primary/50' : 'border-transparent'}
        transition-all duration-300 w-full md:w-auto
      `}
    >
      {/* Player Avatar */}
      <FaUserCircle className="text-4xl text-gray-400 flex-shrink-0" />
      
      {/* Player Info */}
      <div className="flex-grow min-w-0">
        {/* Name and Turn Indicator */}
        <div className="flex justify-between items-center gap-2 mb-1">
          <h3 className="font-bold text-lg text-white truncate">
            {player?.username || 'Opponent'} {isMe && '(You)'}
          </h3>
          {isMyTurn && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs font-semibold bg-primary text-white px-2 py-1 rounded whitespace-nowrap"
            >
              YOUR TURN
            </motion.div>
          )}
        </div>
        
        {/* Tile Count and Connection Status */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <FaLayerGroup />
            <span>{handCount} {handCount === 1 ? 'tile' : 'tiles'}</span>
          </div>
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerInfo;
