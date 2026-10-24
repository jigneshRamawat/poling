
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

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

// Allowed frontend origins
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://poling-cr5s.vercel.app',
  'https://poling-uzzj.vercel.app',
].filter(Boolean);

// Check CORS origin consistently for Express and Socket.IO
const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header, such as curl
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  credentials: true,
};

// Express middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

// Make Socket.IO available to controllers
app.set('io', io);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ward 5 Voting Backend is running',
    health: '/api/health',
    endpoints: {
      poll: '/api/poll',
      votes: '/api/votes',
      results: '/api/results',
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: true,
    status: connected ? 'OK' : 'DEGRADED',
    database: {
      connected,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
    pollId: POLL_CONFIG.pollId,
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// API routes
app.use('/api/poll', pollRoutes);
app.use('/api/votes', voteRoutes);
app.get('/api/results', getResults);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'अनुरोधित एंडपॉइंट उपलब्ध नहीं है।',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);

  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'इस origin से अनुरोध की अनुमति नहीं है।',
    });
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: 'सर्वर पर कोई अप्रत्याशित समस्या आई।',
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('requestResults', async (pollId) => {
    try {
      const activePollId = pollId || POLL_CONFIG.pollId;
      const results = await getAggregateResults(activePollId);

      socket.emit('poll:resultsUpdated', results);
    } catch (err) {
      console.error('[Socket.IO] Results error:', err.message);

      socket.emit('poll:error', {
        message: 'परिणाम लोड नहीं हो सके।',
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(
      `[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`
    );
  });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectDB();
    await ensureAppCollections();

    const { ensureTalliesExist } = require('./services/resultsService');

    await ensureTalliesExist(POLL_CONFIG.pollId);

    server.on('error', (err) => {
      console.error(
        `[Server] Could not listen on port ${PORT}: ${err.message}`
      );

      if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${PORT} is already in use.`);
      }

      process.exit(1);
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`Voting Backend running on port ${PORT}`);
      console.log(`Client URL: ${CLIENT_URL}`);
      console.log('Allowed frontend origins:', allowedOrigins);
      console.log(`Active Poll ID: ${POLL_CONFIG.pollId}`);
      console.log(`MongoDB database: ${mongoose.connection.name}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error(
      '[Server] Could not initialize database connection:',
      err
    );

    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
