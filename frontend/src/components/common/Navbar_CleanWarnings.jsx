import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiMenu, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './AnimatedButton';
import NeonDominoLogo from './NeonDominoLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <nav className="bg-dark-accent shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl">
              <NeonDominoLogo size="sm" animated={true} />
              <span className="bg-gradient-to-r from-orange-500 via-purple-500 to-amber-500 bg-clip-text text-transparent">
                Domino Arena
              </span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-300">Welcome, {user.username}!</span>
                  <AnimatedButton onClick={handleLogout} variant="danger" className="py-2 px-4 w-auto">
                    Logout
                  </AnimatedButton>
                </>
              ) : (
                <>
                  <AnimatedButton onClick={() => navigate('/login')} variant="outline" className="py-2 px-4 w-auto">
                    Login
                  </AnimatedButton>
                  <AnimatedButton onClick={() => navigate('/register')} variant="primary" className="py-2 px-4 w-auto">
                    Register
                  </AnimatedButton>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                  <div className="px-3 py-2 text-gray-300">Welcome, {user.username}!</div>
                  <AnimatedButton onClick={handleLogout} variant="danger" className="w-full">
                    Logout
                  </AnimatedButton>
                </>
              ) : (
                <>
                  <AnimatedButton onClick={() => { navigate('/login'); setIsOpen(false); }} variant="outline" className="w-full mb-2">
                    Login
                  </AnimatedButton>
                  <AnimatedButton onClick={() => { navigate('/register'); setIsOpen(false); }} variant="primary" className="w-full">
                    Register
                  </AnimatedButton>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
