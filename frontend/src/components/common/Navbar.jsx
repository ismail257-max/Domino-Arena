import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GiDominoTiles } from 'react-icons/gi';
import { HiMenu, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './AnimatedButton';
import { FaWallet, FaGamepad } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  const activeLinkStyle = {
    color: '#3B82F6',
    fontWeight: '600'
  };

  return (
    <nav className="bg-dark-accent shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-white font-bold text-xl">
              <GiDominoTiles className="text-primary text-3xl" />
              <span>Domino Arena</span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              {user ? (
                <>
                  <NavLink to="/lobby" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-primary transition-colors duration-200 flex items-center gap-2">
                    <FaGamepad /> Play
                  </NavLink>
                  <NavLink to="/wallet" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-primary transition-colors duration-200 flex items-center gap-2">
                    <FaWallet /> Wallet
                  </NavLink>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-300">Welcome, {user.username}!</span>
                  <AnimatedButton onClick={handleLogout} variant="danger" className="py-2 px-4 w-auto">
                    Logout
                  </AnimatedButton>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <AnimatedButton onClick={() => navigate('/login')} variant="outline" className="py-2 px-4 w-auto">
                    Login
                  </AnimatedButton>
                  <AnimatedButton onClick={() => navigate('/register')} variant="primary" className="py-2 px-4 w-auto">
                    Register
                  </AnimatedButton>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
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
            className="md:hidden border-t border-gray-700"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                  <div className="px-3 py-2 text-gray-300">Welcome, {user.username}!</div>
                   <NavLink to="/lobby" onClick={() => setIsOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                    Play
                  </NavLink>
                  <NavLink to="/wallet" onClick={() => setIsOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                    Wallet
                  </NavLink>
                  <div className="pt-2">
                    <AnimatedButton onClick={handleLogout} variant="danger" className="w-full">
                        Logout
                    </AnimatedButton>
                  </div>
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
