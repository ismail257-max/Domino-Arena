import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // Or a loading state, though ProtectedRoute should handle this
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold mb-4 text-white"
      >
        Welcome, <span className="text-primary">{user.username}</span>!
      </motion.h1>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-dark-accent rounded-lg shadow-md"
      >
        <p className="text-lg text-gray-300">Your personalized dashboard will be here.</p>
        <p className="text-gray-400 mt-4">Balance: Coming in Phase 2</p>
        <p className="text-gray-400">Game Lobbies: Coming Soon</p>
        <p className="text-gray-400">Player Stats: Coming Soon</p>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
