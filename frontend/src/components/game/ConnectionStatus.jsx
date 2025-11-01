import React from 'react';
import { motion } from 'framer-motion';

const ConnectionStatus = ({ isConnected }) => {
  const statusConfig = isConnected
    ? { text: 'Online', color: 'bg-green-500', pulse: true }
    : { text: 'Offline', color: 'bg-red-500', pulse: false };

  return (
    <div className="flex items-center gap-2 text-xs">
      <motion.div 
        className={`w-2 h-2 rounded-full ${statusConfig.color}`}
        animate={statusConfig.pulse ? {
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: statusConfig.pulse ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      <span className="text-gray-400 font-medium">{statusConfig.text}</span>
    </div>
  );
};

export default ConnectionStatus;
