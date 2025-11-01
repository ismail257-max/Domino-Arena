import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import DominoTile from './DominoTile';

const Endpoint = ({ number, position, isPlayable, onClick }) => {
  const baseClasses = "w-12 h-20 flex items-center justify-center font-bold text-2xl border-4 rounded-md transition-all duration-200 flex-shrink-0";
  const playableClasses = "border-primary bg-primary/20 text-primary cursor-pointer hover:bg-primary/40 hover:scale-105";
  const nonPlayableClasses = "border-dashed border-gray-600 text-gray-600";
  
  return (
    <motion.div
      whileHover={isPlayable ? { scale: 1.05 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      onClick={isPlayable ? () => onClick(position) : undefined}
      className={`${baseClasses} ${isPlayable ? playableClasses : nonPlayableClasses}`}
    >
      {number}
    </motion.div>
  );
};

const GameBoard = ({ board, endpoints, onEndpointSelect, endpointChoiceRequired }) => {
  const scrollRef = useRef(null);

  // Auto-scroll to the right (newest tile) when board updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [board]);

  // Empty board state
  if (!board || board.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🎲</div>
          <p className="text-gray-400 text-lg">Waiting for first move...</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="flex-grow flex items-center justify-center p-4 overflow-hidden">
      <div 
        ref={scrollRef} 
        className="flex items-center gap-1 overflow-x-auto py-4 px-2 max-w-full scrollbar-thin scrollbar-thumb-primary scrollbar-track-dark-accent rounded"
      >
        {/* Left endpoint */}
        <Endpoint 
          number={endpoints?.left} 
          position="start" 
          isPlayable={endpointChoiceRequired} 
          onClick={onEndpointSelect} 
        />
        
        {/* Board tiles */}
        {board.map((tile, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <DominoTile 
              value={[tile.left, tile.right]} 
              orientation="vertical" 
            />
          </motion.div>
        ))}
        
        {/* Right endpoint */}
        <Endpoint 
          number={endpoints?.right} 
          position="end" 
          isPlayable={endpointChoiceRequired} 
          onClick={onEndpointSelect} 
        />
      </div>
    </div>
  );
};

export default GameBoard;
