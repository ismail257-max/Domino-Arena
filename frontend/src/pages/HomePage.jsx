import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from '../components/common/AnimatedButton';
import { GiDominoTiles } from 'react-icons/gi';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-center bg-dark"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-8"
      >
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <GiDominoTiles className="text-8xl text-primary animate-bounce-in" />
        </motion.div>
        
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold text-white mb-4 animate-fade-in"
        >
          Welcome to <span className="text-primary">Domino Arena</span>
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 animate-slide-in"
        >
          The ultimate online destination for competitive Draw Domino. Challenge players, climb the ranks, and become a domino champion!
        </motion.p>
        
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <AnimatedButton onClick={() => navigate('/register')} variant="primary" className="py-4 text-lg">
            Get Started
          </AnimatedButton>
          <AnimatedButton onClick={() => navigate('/login')} variant="outline" className="py-4 text-lg">
            Login
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HomePage;
