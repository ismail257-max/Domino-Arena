import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DominoTile from './DominoTile';

const PlayerHand = ({ hand, onTileSelect, isMyTurn, playableTiles, selectedTile }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-dark-accent p-4 rounded-t-lg shadow-inner border-t-2 border-gray-700"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-400">Your Hand</h3>
        {hand && hand.length > 0 && (
          <span className="text-xs text-gray-500">
            {hand.length} {hand.length === 1 ? 'tile' : 'tiles'}
          </span>
        )}
      </div>
      
      <div className="flex justify-center items-center flex-wrap gap-2 min-h-[6.5rem]">
        <AnimatePresence>
          {hand && hand.length > 0 ? (
            hand.map((tile, index) => {
              const tileString = `${Math.min(tile[0], tile[1])}-${Math.max(tile[0], tile[1])}`;
              const isPlayable = isMyTurn && playableTiles.has(tileString);
              const isSelected = selectedTile && 
                                selectedTile[0] === tile[0] && 
                                selectedTile[1] === tile[1];
              
              return (
                <motion.div
                  key={`${index}-${tileString}`}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <DominoTile
                    value={tile}
                    isPlayable={isPlayable}
                    isSelected={isSelected}
                    onClick={isPlayable ? onTileSelect : null}
                  />
                </motion.div>
              );
            })
          ) : (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 text-center py-4"
            >
              No tiles in hand.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      
      {/* Hint text */}
      {isMyTurn && hand && hand.length > 0 && playableTiles.size === 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500 text-center mt-2"
        >
          No playable tiles - draw or pass
        </motion.p>
      )}
      
      {isMyTurn && playableTiles.size > 0 && !selectedTile && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-primary text-center mt-2"
        >
          Select a tile to play
        </motion.p>
      )}
    </motion.div>
  );
};

export default PlayerHand;
