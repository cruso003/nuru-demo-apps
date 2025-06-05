const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const redisService = require('./redis');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware for WebSocket
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // WebSocket-specific authentication (without Express res object)
        const user = await this.authenticateWebSocketToken(token);
        
        // Attach user info to socket
        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * WebSocket-specific token authentication
   */
  async authenticateWebSocketToken(token) {
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    const { getUserProfile } = require('../services/supabase');

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Get user profile
      const userProfile = await getUserProfile(decoded.userId);
      
      if (!userProfile) {
        throw new Error('User not found');
      }

      return {
        id: decoded.userId,
        email: decoded.email,
        username: userProfile.username || userProfile.email?.split('@')[0] || 'Unknown',
        profile: userProfile
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    logger.info(`User connected: ${userId} (${socket.id})`);

    // Store user connection
    this.connectedUsers.set(userId, socket.id);

    // Join user-specific room for targeted messages
    socket.join(`user:${userId}`);

    // Handle real-time events
    this.setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId} (${socket.id})`);
      this.connectedUsers.delete(userId);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Nuru Learn real-time service',
      timestamp: new Date().toISOString(),
      features: ['progress-sync', 'notifications', 'live-updates']
    });
  }

  /**
   * Set up event handlers for real-time features
   */
  setupEventHandlers(socket) {
    const userId = socket.userId;

    // Progress synchronization
    socket.on('progress:update', async (data) => {
      try {
        await this.handleProgressUpdate(userId, data);
        
        // Broadcast to user's other devices
        socket.to(`user:${userId}`).emit('progress:updated', {
          ...data,
          timestamp: new Date().toISOString(),
          source: 'sync'
        });

        logger.info('Progress updated via WebSocket', { userId, data });
      } catch (error) {
        logger.error('Progress update failed:', error);
        socket.emit('error', { message: 'Failed to update progress' });
      }
    });

    // Learning session events
    socket.on('session:start', async (data) => {
      try {
        await this.handleSessionStart(userId, data);
        
        socket.emit('session:started', {
          sessionId: data.sessionId || Date.now().toString(),
          timestamp: new Date().toISOString()
        });

        logger.info('Learning session started', { userId, sessionId: data.sessionId });
      } catch (error) {
        logger.error('Session start failed:', error);
        socket.emit('error', { message: 'Failed to start session' });
      }
    });

    socket.on('session:end', async (data) => {
      try {
        await this.handleSessionEnd(userId, data);
        
        socket.emit('session:ended', {
          sessionId: data.sessionId,
          duration: data.duration,
          timestamp: new Date().toISOString()
        });

        logger.info('Learning session ended', { userId, sessionId: data.sessionId });
      } catch (error) {
        logger.error('Session end failed:', error);
        socket.emit('error', { message: 'Failed to end session' });
      }
    });

    // Achievement notifications
    socket.on('achievement:check', async () => {
      try {
        const achievements = await this.checkNewAchievements(userId);
        if (achievements.length > 0) {
          socket.emit('achievements:unlocked', achievements);
        }
      } catch (error) {
        logger.error('Achievement check failed:', error);
      }
    });

    // Collaborative features
    socket.on('collaboration:join', async (data) => {
      const roomId = `collab:${data.roomId}`;
      socket.join(roomId);
      socket.to(roomId).emit('user:joined', {
        userId,
        username: socket.user.username,
        timestamp: new Date().toISOString()
      });
      
      logger.info('User joined collaboration room', { userId, roomId });
    });

    socket.on('collaboration:leave', async (data) => {
      const roomId = `collab:${data.roomId}`;
      socket.leave(roomId);
      socket.to(roomId).emit('user:left', {
        userId,
        timestamp: new Date().toISOString()
      });
    });

    // Media processing status updates
    socket.on('media:subscribe', (data) => {
      socket.join(`media:${data.jobId}`);
      logger.info('Subscribed to media processing updates', { userId, jobId: data.jobId });
    });
  }

  /**
   * Handle progress update
   */
  async handleProgressUpdate(userId, data) {
    // Store in Redis for real-time sync
    const progressKey = `progress:${userId}`;
    await redisService.setCache(progressKey, data, 3600); // 1 hour TTL

    // Update database (implement based on your progress service)
    // await progressService.updateProgress(userId, data);
  }

  /**
   * Handle session start
   */
  async handleSessionStart(userId, data) {
    const sessionKey = `session:${userId}:${data.sessionId}`;
    const sessionData = {
      ...data,
      startTime: new Date().toISOString(),
      status: 'active'
    };

    await redisService.setCache(sessionKey, sessionData, 7200); // 2 hours TTL
  }

  /**
   * Handle session end
   */
  async handleSessionEnd(userId, data) {
    const sessionKey = `session:${userId}:${data.sessionId}`;
    const sessionData = await redisService.getCache(sessionKey);
    
    if (sessionData) {
      sessionData.endTime = new Date().toISOString();
      sessionData.duration = data.duration;
      sessionData.status = 'completed';
      
      // Update final session data
      await redisService.setCache(sessionKey, sessionData, 86400); // 24 hours TTL
    }
  }

  /**
   * Check for new achievements
   */
  async checkNewAchievements(userId) {
    // Implementation would check achievement conditions
    // This is a placeholder that returns mock achievements
    const mockAchievements = [];
    
    // In real implementation, this would:
    // 1. Check user's recent progress
    // 2. Evaluate achievement conditions
    // 3. Return newly unlocked achievements
    
    return mockAchievements;
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  /**
   * Send real-time update to user
   */
  async sendRealtimeUpdate(userId, type, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('realtime:update', {
        type,
        data,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  /**
   * Broadcast media processing updates
   */
  async broadcastMediaUpdate(jobId, status, result = null) {
    this.io.to(`media:${jobId}`).emit('media:update', {
      jobId,
      status,
      result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get WebSocket server instance
   */
  getIO() {
    return this.io;
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;
