import React from 'react';
import { motion } from 'framer-motion';

const NeonDominoLogo = ({ size = 'md', animated = true }) => {
  const sizes = {
    sm: 'w-12 h-20',
    md: 'w-16 h-28',
    lg: 'w-24 h-40',
    xl: 'w-32 h-56'
  };

  const glowAnimation = animated ? {
    animate: {
      boxShadow: [
        '0 0 20px rgba(234, 88, 12, 0.5), 0 0 40px rgba(234, 88, 12, 0.3)',
        '0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)',
        '0 0 20px rgba(234, 88, 12, 0.5), 0 0 40px rgba(234, 88, 12, 0.3)',
      ]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.div 
      className={`relative ${sizes[size]} perspective-1000`}
      {...glowAnimation}
    >
      {/* 3D Isometric Domino Tile */}
      <div className="absolute inset-0 transform rotate-y-12 rotate-x-12 preserve-3d">
        {/* Main domino face */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg border-2 border-transparent"
             style={{
               borderImage: 'linear-gradient(135deg, #ea580c, #a855f7, #fbbf24) 1',
               boxShadow: `
                 inset 0 0 20px rgba(234, 88, 12, 0.3),
                 inset 0 0 40px rgba(168, 85, 247, 0.2),
                 0 0 30px rgba(234, 88, 12, 0.4),
                 0 0 60px rgba(168, 85, 247, 0.3)
               `
             }}>
          
          {/* Divider line in the middle */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-purple-500 to-amber-500 transform -translate-y-1/2 shadow-lg shadow-purple-500/50"></div>
          
          {/* Top half - Letter D */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <span className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-purple-500 to-amber-500 drop-shadow-[0_0_10px_rgba(234,88,12,0.8)]">
              D
            </span>
          </div>
          
          {/* Bottom half - Letter A */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <span className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-500 via-amber-500 to-orange-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
              A
            </span>
          </div>

          {/* Lightning bolt - Top Left */}
          <svg className="absolute top-1 left-1 w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                  fill="url(#lightning-gradient)" 
                  stroke="none"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(234, 88, 12, 0.8))' }}/>
            <defs>
              <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>

          {/* Lightning bolt - Top Right */}
          <svg className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                  fill="url(#lightning-gradient-2)" 
                  stroke="none"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.8))' }}/>
            <defs>
              <linearGradient id="lightning-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </svg>

          {/* Lightning bolt - Bottom Left */}
          <svg className="absolute bottom-1 left-1 w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                  fill="url(#lightning-gradient-3)" 
                  stroke="none"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))' }}/>
            <defs>
              <linearGradient id="lightning-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Lightning bolt - Bottom Right */}
          <svg className="absolute bottom-1 right-1 w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                  fill="url(#lightning-gradient-4)" 
                  stroke="none"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(234, 88, 12, 0.8))' }}/>
            <defs>
              <linearGradient id="lightning-gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default NeonDominoLogo;
