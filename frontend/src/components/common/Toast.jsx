import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { playSound } from '../../utils/soundManager';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    if (message) {
      if (type === 'success') playSound('success');
      if (type === 'error') playSound('error');
      if (type === 'info') playSound('notification');

      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, type, duration, onClose]);

  const types = {
    success: {
      bg: 'bg-green-500',
      icon: <FaCheckCircle className="text-white text-xl" />,
    },
    error: {
      bg: 'bg-red-500',
      icon: <FaExclamationCircle className="text-white text-xl" />,
    },
    info: {
      bg: 'bg-blue-500',
      icon: <FaInfoCircle className="text-white text-xl" />,
    },
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8, transition: { duration: 0.2 } }}
          className={`
            fixed top-20 right-4 z-50
            ${types[type].bg}
            text-white px-6 py-4 rounded-lg shadow-lg
            flex items-center gap-3
            max-w-md
          `}
        >
          {types[type].icon}
          <p className="font-medium">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
