const express = require('express');
const Joi = require('joi');
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { mediaProcessingService } = require('../services/media-processing');
const webSocketService = require('../services/websocket');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const mediaProcessingSchema = Joi.object({
  type: Joi.string().valid('image', 'audio', 'multimodal').required(),
  data: Joi.object({
    url: Joi.string().uri().optional(),
    base64: Joi.string().optional(),
    cloudinaryUrl: Joi.string().uri().optional(),
    text: Joi.string().optional()
  }).required(),
  options: Joi.object({
    analysisType: Joi.string().optional(),
    prompt: Joi.string().optional(),
    language: Joi.string().default('en'),
    responseLanguage: Joi.string().default('en'),
    priority: Joi.number().min(0).max(10).default(0),
    context: Joi.object().default({})
  }).default({})
});

const notificationSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  message: Joi.string().min(1).max(500).required(),
  type: Joi.string().valid('info', 'success', 'warning', 'error', 'achievement').default('info'),
  data: Joi.object().default({}),
  delay: Joi.number().min(0).default(0),
  priority: Joi.number().min(0).max(10).default(0)
});

/**
 * Queue media processing job
 */
router.post('/process',
  authMiddleware,
  rateLimitMiddleware('realtime_media', 20, 60000), // 20 requests per minute
  asyncHandler(async (req, res) => {
    const { error, value } = mediaProcessingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    const { type, data, options } = value;

    try {
      let result;

      switch (type) {
        case 'image':
          result = await mediaProcessingService.queueImageProcessing(userId, data, options);
          break;
        case 'audio':
          result = await mediaProcessingService.queueAudioProcessing(userId, data, options);
          break;
        case 'multimodal':
          result = await mediaProcessingService.queueMultimodalProcessing(userId, data, options);
          break;
        default:
          return res.status(400).json({
            error: 'Invalid media type',
            message: 'Supported types: image, audio, multimodal'
          });
      }

      // Send immediate response with job ID
      res.json({
        success: true,
        jobId: result.jobId,
        status: result.status,
        estimatedDuration: result.estimatedDuration,
        message: `${type} processing queued successfully`,
        timestamp: new Date().toISOString()
      });

      logger.info('Media processing job queued', { userId, type, jobId: result.jobId });

    } catch (error) {
      logger.error('Media processing queue failed', { error: error.message, userId, type });
      res.status(500).json({
        error: 'Processing failed',
        message: 'Failed to queue media processing job'
      });
    }
  })
);

/**
 * Get job status
 */
router.get('/job/:jobId/status',
  authMiddleware,
  rateLimitMiddleware('realtime_status', 60, 60000), // 60 requests per minute
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user.id;

    try {
      const status = await mediaProcessingService.getJobStatus(jobId);
      
      if (status.status === 'not_found') {
        return res.status(404).json({
          error: 'Job not found',
          message: 'The specified job ID was not found'
        });
      }

      res.json({
        success: true,
        job: status,
        timestamp: new Date().toISOString()
      });

      logger.info('Job status requested', { userId, jobId, status: status.status });

    } catch (error) {
      logger.error('Job status query failed', { error: error.message, userId, jobId });
      res.status(500).json({
        error: 'Status query failed',
        message: 'Failed to retrieve job status'
      });
    }
  })
);

/**
 * Send real-time notification
 */
router.post('/notify',
  authMiddleware,
  rateLimitMiddleware('realtime_notify', 30, 60000), // 30 requests per minute
  asyncHandler(async (req, res) => {
    const { error, value } = notificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    const notification = value;

    try {
      // Try immediate delivery via WebSocket first
      const delivered = await webSocketService.sendNotificationToUser(userId, notification);
      
      if (!delivered) {
        // Queue for later delivery if user is offline
        const jobId = await mediaProcessingService.queueNotification(userId, notification, {
          delay: notification.delay,
          priority: notification.priority
        });
        
        return res.json({
          success: true,
          delivered: false,
          queued: true,
          jobId,
          message: 'Notification queued for delivery',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        delivered: true,
        message: 'Notification delivered immediately',
        timestamp: new Date().toISOString()
      });

      logger.info('Real-time notification sent', { userId, type: notification.type });

    } catch (error) {
      logger.error('Notification sending failed', { error: error.message, userId });
      res.status(500).json({
        error: 'Notification failed',
        message: 'Failed to send notification'
      });
    }
  })
);

/**
 * Get offline notifications
 */
router.get('/notifications/offline',
  authMiddleware,
  rateLimitMiddleware('realtime_offline', 20, 60000), // 20 requests per minute
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const notifications = await mediaProcessingService.getOfflineNotifications(userId);
      
      res.json({
        success: true,
        notifications,
        count: notifications.length,
        timestamp: new Date().toISOString()
      });

      logger.info('Offline notifications retrieved', { userId, count: notifications.length });

    } catch (error) {
      logger.error('Offline notifications query failed', { error: error.message, userId });
      res.status(500).json({
        error: 'Query failed',
        message: 'Failed to retrieve offline notifications'
      });
    }
  })
);

/**
 * Get real-time connection status
 */
router.get('/status',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const isOnline = webSocketService.isUserOnline(userId);
      const connectedUsers = webSocketService.getConnectedUsersCount();
      const queueStats = await mediaProcessingService.getQueueStats();

      res.json({
        success: true,
        user: {
          online: isOnline,
          userId
        },
        server: {
          connectedUsers,
          queues: queueStats
        },
        features: {
          websockets: true,
          mediaProcessing: true,
          pushNotifications: true,
          realtimeSync: true
        },
        timestamp: new Date().toISOString()
      });

      logger.info('Real-time status requested', { userId, isOnline });

    } catch (error) {
      logger.error('Status query failed', { error: error.message, userId });
      res.status(500).json({
        error: 'Status query failed',
        message: 'Failed to retrieve real-time status'
      });
    }
  })
);

/**
 * Trigger real-time progress sync
 */
router.post('/sync/progress',
  authMiddleware,
  rateLimitMiddleware('realtime_sync', 10, 60000), // 10 requests per minute
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const progressData = req.body;

    try {
      // Send progress update to other connected devices
      await webSocketService.sendRealtimeUpdate(userId, 'progress', progressData);
      
      res.json({
        success: true,
        message: 'Progress synchronized across devices',
        timestamp: new Date().toISOString()
      });

      logger.info('Progress sync triggered', { userId });

    } catch (error) {
      logger.error('Progress sync failed', { error: error.message, userId });
      res.status(500).json({
        error: 'Sync failed',
        message: 'Failed to synchronize progress'
      });
    }
  })
);

/**
 * Health check for real-time services
 */
router.get('/health',
  asyncHandler(async (req, res) => {
    try {
      const queueStats = await mediaProcessingService.getQueueStats();
      const connectedUsers = webSocketService.getConnectedUsersCount();

      const health = {
        status: 'healthy',
        services: {
          websockets: {
            status: 'running',
            connectedUsers
          },
          mediaProcessing: {
            status: 'running',
            queues: queueStats
          },
          notifications: {
            status: 'running'
          }
        },
        timestamp: new Date().toISOString()
      };

      res.json(health);

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  })
);

module.exports = router;
