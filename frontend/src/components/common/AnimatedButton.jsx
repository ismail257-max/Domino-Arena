import React from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../../utils/soundManager';
import LoadingSpinner from './LoadingSpinner';

const AnimatedButton = ({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  soundEffect = 'click'
}) => {
  const variants = {
    primary: 'bg-primary hover:bg-blue-600 text-white',
    secondary: 'bg-secondary hover:bg-green-600 text-white',
    danger: 'bg-danger hover:bg-red-600 text-white',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };

  const handleClick = (e) => {
    if (!disabled && !loading) {
      playSound(soundEffect);
      onClick && onClick(e);
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        w-full px-6 py-3 rounded-lg font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex justify-center items-center
        ${variants[variant]}
        ${className}
      `}
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
    >
      {loading ? <LoadingSpinner size="sm" /> : children}
    </motion.button>
  );
};

export default AnimatedButton;
