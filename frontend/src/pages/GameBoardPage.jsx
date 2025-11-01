import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as gameService from '../services/gameService';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';

import PlayerInfo from '../components/game/PlayerInfo';
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import GameLog from '../components/game/GameLog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AnimatedButton from '../components/common/AnimatedButton';
import Toast from '../components/common/Toast';

const GameBoardPage = () => {
  const { id: gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);

  const fetchGameState = useCallback(async () => {
    try {
      const state = await gameService.getGameState(gameId);
      setGameState(state);
      // Reset selections on refresh
      setSelectedTile(null);
    } catch (error) {
      console.error('Error fetching game state:', error);
      setToast({ message: 'Error fetching game state.', type: 'error' });
      // Redirect to lobby after a short delay
      setTimeout(() => navigate('/lobby'), 2000);
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  }, [gameId, navigate]);

  const handleGameUpdate = useCallback(() => {
    setToast({ message: "Game updated!", type: 'info' });
    fetchGameState();
  }, [fetchGameState]);
  
  const handleGameEnd = useCallback((data) => {
    // Navigate to results page with game data
    navigate(`/game/${gameId}/results`, { 
      state: { 
        ...data, 
        stake: gameState?.stakeAmount 
      } 
    });
  }, [navigate, gameId, gameState?.stakeAmount]);

  const socketEventHandlers = useMemo(() => ({
    'game-updated': handleGameUpdate,
    'game-ended': handleGameEnd,
    'opponent-connected': () => {
      setOpponentConnected(true);
      setToast({ message: 'Opponent connected', type: 'success' });
    },
    'opponent-disconnected': () => {
      setOpponentConnected(false);
      setToast({ message: 'Opponent disconnected', type: 'warning' });
    },
    'opponent-reconnected': () => {
      setOpponentConnected(true);
      setToast({ message: 'Opponent reconnected', type: 'success' });
    },
    'error': (err) => {
      console.error('Socket error:', err);
      setToast({ message: err.message || 'An error occurred', type: 'error' });
    }
  }), [handleGameUpdate, handleGameEnd]);

  useSocket(gameId, socketEventHandlers);
  
  useEffect(() => {
    if (gameId && user) {
      fetchGameState();
    }
  }, [fetchGameState, gameId, user]);

  // Derived state - only computed when dependencies change
  const me = useMemo(() => 
    gameState?.players.find(p => p.userId._id === user.id), 
    [gameState?.players, user.id]
  );
  
  const opponent = useMemo(() => 
    gameState?.players.find(p => p.userId._id !== user.id), 
    [gameState?.players, user.id]
  );
  
  const isMyTurn = useMemo(() => 
    gameState?.currentTurn === user.id, 
    [gameState?.currentTurn, user.id]
  );

  // Calculate playable tiles based on current board endpoints
  const playableTiles = useMemo(() => {
    if (!me?.hand || !gameState?.endpoints) return new Set();
    const { left, right } = gameState.endpoints;
    const playable = new Set();
    
    me.hand.forEach(tile => {
      if (tile[0] === left || tile[1] === left || tile[0] === right || tile[1] === right) {
        playable.add(`${Math.min(tile[0], tile[1])}-${Math.max(tile[0], tile[1])}`);
      }
    });
    
    return playable;
  }, [me?.hand, gameState?.endpoints]);

  // Determine if player can draw a tile
  const canDraw = useMemo(() => {
    return isMyTurn && playableTiles.size === 0 && gameState?.boneyard?.count > 0;
  }, [isMyTurn, playableTiles, gameState?.boneyard?.count]);

  // Determine if player can pass their turn
  const canPass = useMemo(() => {
    return isMyTurn && playableTiles.size === 0 && gameState?.boneyard?.count === 0;
  }, [isMyTurn, playableTiles, gameState?.boneyard?.count]);

  // Check if player needs to choose which endpoint to play on
  const endpointChoiceRequired = useMemo(() => {
    if (!selectedTile || !gameState?.endpoints) return false;
    const { left, right } = gameState.endpoints;
    const [t1, t2] = selectedTile;
    
    // Check if tile is not a double AND fits on both endpoints
    return t1 !== t2 && (t1 === left || t2 === left) && (t1 === right || t2 === right);
  }, [selectedTile, gameState?.endpoints]);

  const handleTileSelect = useCallback((tile) => {
    // Toggle selection: if same tile clicked again, deselect it
    if (selectedTile && selectedTile[0] === tile[0] && selectedTile[1] === tile[1]) {
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
    }
  }, [selectedTile]);

  const handlePlayMove = useCallback(async (position) => {
    if (!selectedTile) return;
    
    setActionLoading(true);
    try {
      await gameService.makeMove(gameId, { tile: selectedTile, position });
      setSelectedTile(null); // Clear selection after successful move
      // Socket event will trigger state refresh
    } catch (error) {
      console.error('Error making move:', error);
      setToast({ 
        message: error.response?.data?.message || 'Invalid move.', 
        type: 'error' 
      });
      setActionLoading(false);
    }
  }, [gameId, selectedTile]);
  
  // Auto-play tile if no endpoint choice is required
  useEffect(() => {
    if (selectedTile && !endpointChoiceRequired && gameState?.endpoints) {
      const { left } = gameState.endpoints;
      const position = selectedTile[0] === left || selectedTile[1] === left ? 'start' : 'end';
      handlePlayMove(position);
    }
  }, [selectedTile, endpointChoiceRequired, gameState?.endpoints, handlePlayMove]);

  const handleDraw = useCallback(async () => {
    setActionLoading(true);
    try {
      await gameService.drawTile(gameId);
      // Socket event will trigger state refresh
    } catch (error) {
      console.error('Error drawing tile:', error);
      setToast({ 
        message: error.response?.data?.message || 'Cannot draw tile.', 
        type: 'error' 
      });
      setActionLoading(false);
    }
  }, [gameId]);

  const handlePass = useCallback(async () => {
    setActionLoading(true);
    try {
      await gameService.passTurn(gameId);
      // Socket event will trigger state refresh
    } catch (error) {
      console.error('Error passing turn:', error);
      setToast({ 
        message: error.response?.data?.message || 'Cannot pass turn.', 
        type: 'error' 
      });
      setActionLoading(false);
    }
  }, [gameId]);

  // Loading state
  if (loading || !gameState) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Main game board render
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col p-4 bg-dark">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />
      
      {/* Top Section: Opponent Info & Game Log */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
        <PlayerInfo 
          player={opponent?.userId} 
          handCount={opponent?.hand?.length || 0}
          isMyTurn={!isMyTurn} 
          isConnected={opponentConnected} 
          isMe={false} 
        />
        <GameLog moves={gameState.moves} />
      </div>
      
      {/* Middle Section: Game Board */}
      <GameBoard 
        board={gameState.board} 
        endpoints={gameState.endpoints} 
        onEndpointSelect={handlePlayMove}
        endpointChoiceRequired={endpointChoiceRequired}
      />

      {/* Bottom Section: My Info, Hand, Actions */}
      <div className="mt-4">
        <PlayerInfo 
          player={me?.userId} 
          handCount={me?.hand?.length || 0}
          isMyTurn={isMyTurn} 
          isConnected={true} 
          isMe={true} 
        />
        
        {/* Endpoint selection prompt */}
        {endpointChoiceRequired && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-3 bg-primary/20 text-primary font-semibold rounded-md my-2 border border-primary"
          >
            ⚡ Select which end to place your tile
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-3">
          <AnimatedButton 
            onClick={handleDraw} 
            disabled={!canDraw || actionLoading} 
            loading={actionLoading && canDraw} 
            variant="outline" 
            className="w-full sm:w-auto"
          >
            Draw Tile ({gameState.boneyard?.count || 0})
          </AnimatedButton>
          <AnimatedButton 
            onClick={handlePass} 
            disabled={!canPass || actionLoading} 
            loading={actionLoading && canPass} 
            variant="danger" 
            className="w-full sm:w-auto"
          >
            Pass Turn
          </AnimatedButton>
        </div>

        {/* Player's hand */}
        <PlayerHand 
          hand={me?.hand} 
          onTileSelect={handleTileSelect}
          isMyTurn={isMyTurn}
          playableTiles={playableTiles}
          selectedTile={selectedTile}
        />
      </div>
    </div>
  );
};

export default GameBoardPage;
