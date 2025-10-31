// Load environment variables
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./backend/config/db');
const initializeSocket = require('./backend/sockets/gameSocket');

// --- Connect to MongoDB ---
connectDB();

const app = express();
const httpServer = http.createServer(app);

// --- Socket.io Setup ---
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize socket handlers
initializeSocket(io);

// --- Security Middleware ---
app.use(helmet());

// Enable CORS for REST API
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Attach io to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'Too many requests, please try again later.' 
  }
});

app.use('/api', limiter);

// --- Routes ---
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Domino Arena API is live!',
    version: '1.0.0',
    features: ['Auth', 'Wallet', 'Games', 'Socket.io', 'Leaderboard', 'Stats', 'Achievements'],
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', require('./backend/routes/authRoutes')); // ✅ ENABLED!
app.use('/api/wallet', require('./backend/routes/walletRoutes'));
app.use('/api/games', require('./backend/routes/gameRoutes'));
app.use('/api/leaderboard', require('./backend/routes/leaderboardRoutes'));
app.use('/api/stats', require('./backend/routes/statsRoutes'));
app.use('/api/achievements', require('./backend/routes/achievementRoutes'));
app.use('/api/activity', require('./backend/routes/activityRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`⚡ Socket.io: Enabled`);
  console.log(`🏆 Leaderboard: Active`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('🛑 HTTP server closed');
  });
});

module.exports = app;
