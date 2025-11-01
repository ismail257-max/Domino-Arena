import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

const WalletCard = ({ title, amount, icon, isLoading = false, currency = 'USD', className = '' }) => {
  const controls = useAnimation();
  
  useEffect(() => {
    if (typeof amount === 'number') {
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.5, ease: 'easeInOut' }
      });
    }
  }, [amount, controls]);

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between text-gray-400 mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-2xl">{icon}</div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-12">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <motion.h2 animate={controls} className="text-4xl font-bold text-white tracking-tight">
          {formatCurrency(amount)}
        </motion.h2>
      )}
    </motion.div>
  );
};

export default WalletCard;
