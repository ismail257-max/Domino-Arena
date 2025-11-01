import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { initSounds } from './utils/soundManager';

import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WalletPage from './pages/WalletPage';
import GameLobbyPage from './pages/GameLobbyPage';
import GameBoardPage from './pages/GameBoardPage';
import GameResultsPage from './pages/GameResultsPage';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lobby" 
          element={
            <ProtectedRoute>
              <GameLobbyPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/game/:id" 
          element={
            <ProtectedRoute>
              <GameBoardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/game/:id/results" 
          element={
            <ProtectedRoute>
              <GameResultsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    // Initialize sound effects when the app loads
    if (process.env.REACT_APP_ENABLE_SOUNDS === 'true') {
      initSounds();
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark text-light">
          <Navbar />
          <main>
            <AnimatedRoutes />
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
