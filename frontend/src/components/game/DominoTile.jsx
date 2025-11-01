import React from 'react';
import { motion } from 'framer-motion';

const Pip = () => <div className="w-2 h-2 bg-gray-800 rounded-full" />;

const PipLayout = ({ count }) => {
  const pips = Array(count).fill(0);
  
  // Layouts for each number of pips (0-6)
  const layouts = {
    0: () => null,
    1: () => (
      <div className="grid grid-cols-1 grid-rows-1 place-items-center w-full h-full">
        <Pip />
      </div>
    ),
    2: () => (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-1">
        <Pip />
        <div />
        <div />
        <Pip />
      </div>
    ),
    3: () => (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-1">
        <Pip />
        <div />
        <div className="col-span-2 flex justify-center items-center">
          <Pip />
        </div>
        <div />
        <Pip />
      </div>
    ),
    4: () => (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-1">
        {pips.map((_, i) => <Pip key={i} />)}
      </div>
    ),
    5: () => (
      <div className="grid grid-cols-2 grid-rows-3 w-full h-full p-1">
        <Pip />
        <Pip />
        <div className="col-span-2 flex justify-center items-center">
          <Pip />
        </div>
        <Pip />
        <Pip />
      </div>
    ),
    6: () => (
      <div className="grid grid-cols-2 grid-rows-3 w-full h-full p-1">
        {pips.map((_, i) => <Pip key={i} />)}
      </div>
    ),
  };

  return layouts[count]?.() || null;
};

const DominoTile = ({ 
  value, 
  orientation = 'horizontal', 
  isPlayable = false, 
  isSelected = false, 
  onClick 
}) => {
  // Validate tile value
  if (!value || !Array.isArray(value) || value.length !== 2) {
    console.error('Invalid domino tile value:', value);
    return null;
  }

  const [left, right] = value;

  // Base styling
  const baseClasses = "bg-gray-200 rounded-md shadow-md flex border-2 transition-all duration-200";
  
  // Orientation classes
  const orientationClasses = orientation === 'horizontal' 
    ? 'w-20 h-10 flex-row' 
    : 'w-10 h-20 flex-col';
  
  // Interactive classes
  const interactiveClasses = isPlayable 
    ? "cursor-pointer hover:scale-105 hover:shadow-lg hover:border-primary border-gray-400"
    : "opacity-60 cursor-not-allowed border-gray-300";
  
  // Selected classes
  const selectedClasses = isSelected 
    ? "border-primary ring-2 ring-primary scale-105 shadow-primary/50" 
    : "";
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: isSelected ? 1.05 : 1 
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2 }}
      onClick={onClick && isPlayable ? () => onClick(value) : undefined}
      className={`${baseClasses} ${orientationClasses} ${interactiveClasses} ${selectedClasses}`}
      whileHover={isPlayable ? { scale: 1.08 } : {}}
      whileTap={isPlayable ? { scale: 0.98 } : {}}
    >
      {/* Left/Top half */}
      <div className="w-full h-full flex items-center justify-center">
        <PipLayout count={left} />
      </div>
      
      {/* Divider */}
      <div 
        className="bg-gray-400" 
        style={orientation === 'horizontal' ? { width: '2px' } : { height: '2px' }} 
      />
      
      {/* Right/Bottom half */}
      <div className="w-full h-full flex items-center justify-center">
        <PipLayout count={right} />
      </div>
    </motion.div>
  );
};

export default DominoTile;
