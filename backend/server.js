const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const mongoose = require('mongoose');
const { connectDB, ensureAppCollections } = require('./config/db');
const POLL_CONFIG = require('./config/pollConfig');
const pollRoutes = require('./routes/pollRoutes');
const voteRoutes = require('./routes/voteRoutes');
const { getResults } = require('./controllers/pollController');
const { apiLimiter } = require('./middleware/rateLimiter');
const { getAggregateResults } = require('./services/resultsService');

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 5001);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

// Make io accessible throughout Express controllers
app.set('io', io);

// Basic middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:5173', 'https://poling-uzzj.vercel.app'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));

// Apply rate limiting
app.use('/api/', apiLimiter);

// API Endpoints
app.use('/api/poll', pollRoutes);
app.use('/api/votes', voteRoutes);
app.get('/api/results', getResults);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'OK' : 'DEGRADED',
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
    pollId: POLL_CONFIG.pollId,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'अनुरोधित एंडपॉइंट उपलब्ध नहीं है।',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'सर्वर पर कोई अप्रत्याशित समस्या आई।',
  });
});

// Socket.IO event handling
io.on('connection', (socket) => {
  // When a client connects, send immediate latest results
  socket.on('requestResults', async (pollId) => {
    try {
      const activePollId = pollId || POLL_CONFIG.pollId;
      const results = await getAggregateResults(activePollId);
      socket.emit('poll:resultsUpdated', results);
    } catch (err) {
      console.error('Socket results error:', err.message);
    }
  });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectDB();
    await ensureAppCollections();

    const { ensureTalliesExist } = require('./services/resultsService');
    await ensureTalliesExist(POLL_CONFIG.pollId);

    // Keep the backend port aligned with the Vite proxy target. Do not silently
    // switch ports, otherwise the frontend continues proxying to the wrong port.
    server.on('error', (err) => {
      console.error(`[Server] Could not listen on port ${PORT}: ${err.message}`);
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${PORT} is already in use. Stop the other process or update both PORT and frontend/vite.config.js.`);
      }
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 EVM Polling Backend Server running on port ${PORT}`);
      console.log(`📍 Client URL: ${CLIENT_URL}`);
      console.log(`🗳️ Active Poll ID: ${POLL_CONFIG.pollId}`);
      console.log(`🗄️ MongoDB database: ${mongoose.connection.name}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Fatal: Could not initialize database connection.', err);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
