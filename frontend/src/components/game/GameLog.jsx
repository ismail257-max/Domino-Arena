import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGamepad, FaArrowDown, FaHandPaper } from 'react-icons/fa';

const GameLog = ({ moves = [] }) => {
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when new moves are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [moves]);

  const formatMove = (move) => {
    const username = move.userId?.username || 'Player';
    
    switch (move.action) {
      case 'play':
        return {
          icon: <FaGamepad className="text-primary" />,
          text: `${username} played [${move.tile?.left || '?'}|${move.tile?.right || '?'}]`,
          color: 'text-primary'
        };
      case 'draw':
        return {
          icon: <FaArrowDown className="text-secondary" />,
          text: `${username} drew a tile`,
          color: 'text-secondary'
        };
      case 'pass':
        return {
          icon: <FaHandPaper className="text-danger" />,
          text: `${username} passed their turn`,
          color: 'text-danger'
        };
      default:
        return {
          icon: <FaGamepad className="text-gray-400" />,
          text: 'An action occurred',
          color: 'text-gray-400'
        };
    }
  };

  return (
    <div className="bg-dark-accent p-3 rounded-lg shadow-lg h-32 w-full max-w-sm border border-gray-700">
      <h4 className="font-semibold text-gray-400 text-sm mb-2 border-b border-gray-600 pb-1 flex items-center gap-2">
        <FaGamepad />
        Game Log
      </h4>
      <div 
        ref={logContainerRef} 
        className="h-20 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        <ul className="text-xs text-gray-300 space-y-1">
          <AnimatePresence initial={false}>
            {moves.map((move, index) => {
              const formatted = formatMove(move);
              return (
                <motion.li
                  key={`${index}-${move.action}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="flex-shrink-0">{formatted.icon}</span>
                  <span className={formatted.color}>{formatted.text}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {moves.length === 0 && (
            <li className="text-gray-500 text-center italic">No moves made yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default GameLog;
