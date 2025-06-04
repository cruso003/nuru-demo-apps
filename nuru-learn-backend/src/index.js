const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config');
const logger = require('./utils/logger');
const { connectRedis } = require('./services/redis');
const { initializeSupabase } = require('./services/supabase');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const learningRoutes = require('./routes/learning');
const progressRoutes = require('./routes/progress');
const aiRoutes = require('./routes/ai');
const streaksRoutes = require('./routes/streaks');
const achievementsRoutes = require('./routes/achievements');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000 / 60) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/learning', authMiddleware, learningRoutes);
app.use('/api/progress', authMiddleware, progressRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/streaks', authMiddleware, streaksRoutes);
app.use('/api/achievements', authMiddleware, achievementsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Redis connection
    await connectRedis();
    logger.info('✅ Redis connected successfully');

    // Initialize Supabase
    await initializeSupabase();
    logger.info('✅ Supabase initialized successfully');

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Nuru Learn Backend Server running on port ${config.PORT}`);
      logger.info(`📱 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
