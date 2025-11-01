import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as gameService from '../services/gameService';
import * as walletService from '../services/walletService';

import GameCard from '../components/game/GameCard';
import CreateGameModal from '../components/game/CreateGameModal';
import AnimatedButton from '../components/common/AnimatedButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import { FaPlus, FaCoins, FaSync } from 'react-icons/fa';

const GameLobbyPage = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [availableGames, setAvailableGames] = useState([]);
  const [myGames, setMyGames] = useState({ active: [], completed: [] });
  const [loading, setLoading] = useState({ available: true, myGames: true });
  const [actionLoading, setActionLoading] = useState(null); // gameId or false
  const [stakeFilter, setStakeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const fetchAvailableGames = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const games = await gameService.getAvailableGames();
      setAvailableGames(games || []);
    } catch (error) {
      console.error('Error fetching available games:', error);
      setToast({ message: 'Could not fetch available games.', type: 'error' });
    } finally {
      setLoading(prevState => ({ ...prevState, available: false }));
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  const fetchMyGames = useCallback(async () => {
    setLoading(prevState => ({ ...prevState, myGames: true }));
    try {
      const games = await gameService.getMyGames();
      setMyGames(games || { active: [], completed: [] });
    } catch (error) {
      console.error('Error fetching my games:', error);
      setToast({ message: 'Could not fetch your games.', type: 'error' });
    } finally {
      setLoading(prevState => ({ ...prevState, myGames: false }));
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      const balanceData = await walletService.getBalance();
      setBalance(balanceData.availableBalance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    
    if (activeTab === 'available') {
      fetchAvailableGames();
      // Poll for new games every 5 seconds
      intervalRef.current = setInterval(() => fetchAvailableGames(false), 5000);
    } else {
      fetchMyGames();
      // Clear interval when not on available tab
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    // Cleanup interval on component unmount or tab change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTab, fetchAvailableGames, fetchMyGames, fetchBalance]);

  const handleJoinGame = async (gameId) => {
    setActionLoading(gameId);
    try {
      const response = await gameService.joinGame(gameId);
      setToast({ message: response.message || 'Joined game successfully!', type: 'success' });
      // Navigate to game board
      setTimeout(() => {
        navigate(`/game/${response.data._id}`);
      }, 1000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to join game.';
      setToast({ message: errorMessage, type: 'error' });
      setActionLoading(null);
    }
  };
  
  const handleCancelGame = async (gameId) => {
    setActionLoading(gameId);
    try {
      const response = await gameService.cancelGame(gameId);
      setToast({ message: response.message || 'Game cancelled successfully!', type: 'success' });
      // Refresh both lists
      fetchAvailableGames(false);
      fetchBalance();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel game.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSuccess = (message) => {
    setToast({ message, type: 'success' });
    setActiveTab('myGames');
    fetchMyGames();
    fetchBalance();
  };

  const handleManualRefresh = () => {
    if (activeTab === 'available') {
      fetchAvailableGames(true);
    } else {
      fetchMyGames();
    }
  };

  const filteredGames = availableGames.filter(game => 
    stakeFilter === 'all' || game.stakeAmount === stakeFilter
  );

  const renderAvailableGames = () => {
    if (loading.available) {
      return (
        <div className="flex justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
    
    if (filteredGames.length === 0) {
      return (
        <div className="text-center p-12 bg-dark-accent rounded-lg">
          <p className="text-gray-400 text-lg mb-4">No available games found.</p>
          <p className="text-gray-500 text-sm mb-6">Be the first to create one!</p>
          <AnimatedButton 
            onClick={() => setIsModalOpen(true)} 
            variant="secondary" 
            className="w-auto mx-auto"
          >
            <FaPlus className="mr-2" /> Create New Game
          </AnimatedButton>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => (
          <GameCard 
            key={game._id} 
            game={game} 
            onJoin={handleJoinGame} 
            onCancel={handleCancelGame} 
            isActionLoading={actionLoading === game._id} 
          />
        ))}
      </div>
    );
  };

  const renderMyGames = () => {
    if (loading.myGames) {
      return (
        <div className="flex justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
    
    const { active, completed } = myGames;
    
    if (active.length === 0 && completed.length === 0) {
      return (
        <div className="text-center p-12 bg-dark-accent rounded-lg">
          <p className="text-gray-400 text-lg mb-4">You have no games yet.</p>
          <p className="text-gray-500 text-sm mb-6">Start playing to see your games here!</p>
          <AnimatedButton 
            onClick={() => setActiveTab('available')} 
            variant="primary" 
            className="w-auto mx-auto"
          >
            Browse Available Games
          </AnimatedButton>
        </div>
      );
    }
    
    return (
      <>
        {active.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
              <span>Active Games</span>
              <span className="text-sm font-normal text-gray-400">({active.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map(game => (
                <GameCard key={game._id} game={game} onCancel={handleCancelGame} />
              ))}
            </div>
          </div>
        )}
        
        {completed.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              <span>Completed Games</span>
              <span className="text-sm font-normal text-gray-400">({completed.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completed.map(game => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          </div>
        )}
      </>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <CreateGameModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleCreateSuccess} 
        userBalance={balance} 
      />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Game Lobby</h1>
          <div className="flex items-center gap-2 text-secondary">
            <FaCoins />
            <span className="font-semibold">Available Balance: ${balance.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <AnimatedButton 
            onClick={handleManualRefresh} 
            variant="outline" 
            className="w-auto"
            disabled={refreshing}
            loading={refreshing}
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
          </AnimatedButton>
          <AnimatedButton 
            onClick={() => setIsModalOpen(true)} 
            variant="secondary" 
            className="flex-1 md:flex-none"
          >
            <FaPlus className="mr-2" /> Create Game
          </AnimatedButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('available')} 
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'available' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Available Games
          </button>
          <button 
            onClick={() => setActiveTab('myGames')} 
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'myGames' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            My Games
          </button>
        </div>
      </div>
      
      {/* Stake Filter (only for available games) */}
      {activeTab === 'available' && (
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-gray-300 font-medium">Filter by Stake:</span>
          {['all', 5, 10, 15].map(stake => (
            <button 
              key={stake} 
              onClick={() => setStakeFilter(stake)} 
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${stakeFilter === stake 
                  ? 'bg-secondary text-white shadow-lg' 
                  : 'bg-dark-accent text-gray-300 hover:bg-gray-700'}
              `}
            >
              {stake === 'all' ? 'All Stakes' : `$${stake}`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div>
        {activeTab === 'available' ? renderAvailableGames() : renderMyGames()}
      </div>
    </motion.div>
  );
};

export default GameLobbyPage;
