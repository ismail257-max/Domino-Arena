import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../services/authService';

/**
 * Custom hook for Socket.io connection with authentication
 * 
 * @param {string} gameId - The game ID to join
 * @param {object} eventHandlers - Object mapping event names to handler functions
 * @returns {object} - Socket instance and cleanup function
 */
const useSocket = (gameId, eventHandlers = {}) => {
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      console.log(`[Socket] Cleaning up connection for game ${gameId}`);
      
      // Leave the game room before disconnecting
      socketRef.current.emit('leave-game', gameId);
      
      // Disconnect the socket
      socketRef.current.disconnect();
      socketRef.current = null;
      
      // Reset reconnect attempts
      reconnectAttempts.current = 0;
    }
  }, [gameId]);

  useEffect(() => {
    // Get authentication token
    const token = getToken();
    
    if (!token) {
      console.error('[Socket] No auth token found, cannot establish socket connection');
      return;
    }

    if (!gameId) {
      console.error('[Socket] No gameId provided, cannot join game room');
      return;
    }
    
    // Initialize socket connection with authentication
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    console.log(`[Socket] Connecting to ${socketUrl}...`);
    
    socketRef.current = io(socketUrl, {
      auth: { token }, // JWT token for authentication
      transports: ['websocket', 'polling'], // Prefer websocket, fallback to polling
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    const socket = socketRef.current;
    
    // Connection successful
    socket.on('connect', () => {
      console.log(`[Socket] Connected with ID: ${socket.id}`);
      reconnectAttempts.current = 0; // Reset attempts on successful connection
      
      // Join the game room
      if (gameId) {
        console.log(`[Socket] Joining game room: ${gameId}`);
        socket.emit('join-game', gameId);
      }
    });

    // Register all custom event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (handler && typeof handler === 'function') {
        socket.on(event, (data) => {
          console.log(`[Socket] Event received: ${event}`, data);
          handler(data);
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.warn(`[Socket] Disconnected: ${reason}`);
      
      if (reason === 'io server disconnect') {
        // Server forced disconnect, try to reconnect manually
        socket.connect();
      }
    });

    // Handle reconnection attempt
    socket.on('reconnect_attempt', (attempt) => {
      reconnectAttempts.current = attempt;
      console.log(`[Socket] Reconnection attempt ${attempt}/${maxReconnectAttempts}`);
    });

    // Handle successful reconnection
    socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      
      // Rejoin the game room after reconnection
      if (gameId) {
        console.log(`[Socket] Rejoining game room: ${gameId}`);
        socket.emit('join-game', gameId);
      }
    });

    // Handle reconnection failure
    socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after maximum attempts');
    });
    
    // Handle connection errors
    socket.on('connect_error', (err) => {
      console.error(`[Socket] Connection error: ${err.message}`);
      
      // Check if it's an authentication error
      if (err.message.includes('authentication') || err.message.includes('token')) {
        console.error('[Socket] Authentication failed - invalid or expired token');
        // Optionally trigger logout or token refresh here
      }
    });

    // Handle generic errors
    socket.on('error', (err) => {
      console.error(`[Socket] Error:`, err);
    });

    // Cleanup on component unmount or dependency change
    return cleanup;

  }, [gameId, cleanup]); // Note: eventHandlers excluded to prevent reconnection on handler change

  return { 
    socket: socketRef.current, 
    cleanup,
    isConnected: socketRef.current?.connected || false 
  };
};

export default useSocket;
