const Queue = require('bull');
const logger = require('../utils/logger');
const redisService = require('./redis');
const webSocketService = require('./websocket');
const { callNuruAI } = require('../routes/ai');

// Create job queues
const mediaQueue = new Queue('media processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
});

class MediaProcessingService {
  constructor() {
    this.setupQueueProcessors();
  }

  /**
   * Set up queue processors
   */
  setupQueueProcessors() {
    // Media processing queue processor
    mediaQueue.process('process-image', async (job) => {
      return this.processImage(job.data);
    });

    mediaQueue.process('process-audio', async (job) => {
      return this.processAudio(job.data);
    });

    mediaQueue.process('process-multimodal', async (job) => {
      return this.processMultimodal(job.data);
    });

    // Notification queue processor
    notificationQueue.process('send-notification', async (job) => {
      return this.sendNotification(job.data);
    });

    notificationQueue.process('send-push-notification', async (job) => {
      return this.sendPushNotification(job.data);
    });

    // Queue event handlers
    this.setupQueueEventHandlers();

    logger.info('Media processing queues initialized');
  }

  /**
   * Set up queue event handlers
   */
  setupQueueEventHandlers() {
    // Media queue events
    mediaQueue.on('completed', (job, result) => {
      logger.info(`Media job completed: ${job.id}`, { type: job.name, result });
      
      // Notify user via WebSocket
      webSocketService.broadcastMediaUpdate(job.id, 'completed', result);
      
      // Update cache with result
      redisService.setCache(`media:result:${job.id}`, result, 3600);
    });

    mediaQueue.on('failed', (job, err) => {
      logger.error(`Media job failed: ${job.id}`, { type: job.name, error: err.message });
      
      // Notify user of failure
      webSocketService.broadcastMediaUpdate(job.id, 'failed', { error: err.message });
    });

    mediaQueue.on('progress', (job, progress) => {
      logger.info(`Media job progress: ${job.id}`, { progress: `${progress}%` });
      
      // Send progress update
      webSocketService.broadcastMediaUpdate(job.id, 'progress', { progress });
    });

    // Notification queue events
    notificationQueue.on('completed', (job) => {
      logger.info(`Notification sent: ${job.id}`, { type: job.name });
    });

    notificationQueue.on('failed', (job, err) => {
      logger.error(`Notification failed: ${job.id}`, { error: err.message });
    });
  }

  /**
   * Queue image processing job
   */
  async queueImageProcessing(userId, imageData, options = {}) {
    const jobData = {
      userId,
      imageData,
      options: {
        analysisType: options.analysisType || 'educational',
        prompt: options.prompt || 'Analyze this image for educational content',
        context: options.context || {},
        ...options
      },
      timestamp: new Date().toISOString()
    };

    const job = await mediaQueue.add('process-image', jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0
    });

    logger.info(`Image processing job queued: ${job.id}`, { userId });
    
    return {
      jobId: job.id,
      status: 'queued',
      estimatedDuration: 30000 // 30 seconds estimate
    };
  }

  /**
   * Queue audio processing job
   */
  async queueAudioProcessing(userId, audioData, options = {}) {
    const jobData = {
      userId,
      audioData,
      options: {
        analysisType: options.analysisType || 'pronunciation',
        language: options.language || 'en',
        expectedText: options.expectedText || '',
        context: options.context || {},
        ...options
      },
      timestamp: new Date().toISOString()
    };

    const job = await mediaQueue.add('process-audio', jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0
    });

    logger.info(`Audio processing job queued: ${job.id}`, { userId });
    
    return {
      jobId: job.id,
      status: 'queued',
      estimatedDuration: 45000 // 45 seconds estimate
    };
  }

  /**
   * Queue multimodal processing job
   */
  async queueMultimodalProcessing(userId, mediaData, options = {}) {
    const jobData = {
      userId,
      mediaData,
      options: {
        mode: options.mode || 'educational',
        language: options.language || 'en',
        responseLanguage: options.responseLanguage || 'en',
        context: options.context || {},
        ...options
      },
      timestamp: new Date().toISOString()
    };

    const job = await mediaQueue.add('process-multimodal', jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0
    });

    logger.info(`Multimodal processing job queued: ${job.id}`, { userId });
    
    return {
      jobId: job.id,
      status: 'queued',
      estimatedDuration: 60000 // 60 seconds estimate
    };
  }

  /**
   * Process image using Nuru AI
   */
  async processImage(data) {
    const { userId, imageData, options } = data;
    
    try {
      logger.info(`Processing image for user: ${userId}`);
      
      // Prepare request for Nuru AI
      const request = {
        imageUrl: imageData.url || null,
        imageBase64: imageData.base64 || null,
        prompt: options.prompt,
        context: options.context
      };

      // Call Nuru AI service
      const result = await callNuruAI('image-analysis', request);
      
      // Store result in cache
      await redisService.setCache(`media:${userId}:image:latest`, result, 7200);
      
      // Track usage
      await this.trackMediaUsage(userId, 'image', result.usage);
      
      logger.info(`Image processing completed for user: ${userId}`);
      
      return {
        success: true,
        analysis: result.analysis,
        confidence: result.confidence,
        detectedElements: result.detectedElements,
        processingTime: result.processingTime || 0,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Image processing failed for user: ${userId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Process audio using Nuru AI
   */
  async processAudio(data) {
    const { userId, audioData, options } = data;
    
    try {
      logger.info(`Processing audio for user: ${userId}`);
      
      // Prepare request for Nuru AI
      const request = {
        audioUrl: audioData.url || null,
        audioBase64: audioData.base64 || null,
        language: options.language,
        analysisType: options.analysisType,
        context: options.context
      };

      // Call Nuru AI service
      const result = await callNuruAI('voice-analysis', request);
      
      // Store result in cache
      await redisService.setCache(`media:${userId}:audio:latest`, result, 7200);
      
      // Track usage
      await this.trackMediaUsage(userId, 'audio', result.usage);
      
      logger.info(`Audio processing completed for user: ${userId}`);
      
      return {
        success: true,
        transcript: result.transcript,
        pronunciationScore: result.pronunciationScore,
        feedback: result.feedback,
        detailedAnalysis: result.detailedAnalysis,
        processingTime: result.processingTime || 0,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Audio processing failed for user: ${userId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Process multimodal content using Nuru AI
   */
  async processMultimodal(data) {
    const { userId, mediaData, options } = data;
    
    try {
      logger.info(`Processing multimodal content for user: ${userId}`);
      
      // This would integrate with Nuru AI's multimodal processing
      // For now, we'll simulate processing different media types
      
      const results = {};
      
      if (mediaData.image) {
        const imageResult = await this.processImage({
          userId,
          imageData: mediaData.image,
          options: { ...options, prompt: 'Analyze this image in educational context' }
        });
        results.image = imageResult;
      }
      
      if (mediaData.audio) {
        const audioResult = await this.processAudio({
          userId,
          audioData: mediaData.audio,
          options: { ...options, analysisType: 'comprehension' }
        });
        results.audio = audioResult;
      }
      
      if (mediaData.text) {
        // Process text through chat endpoint
        const textResult = await callNuruAI('chat', {
          message: mediaData.text,
          context: options.context
        });
        results.text = textResult;
      }
      
      // Combine results into comprehensive response
      const combinedResult = {
        success: true,
        multimodal: true,
        results,
        summary: this.generateMultimodalSummary(results),
        timestamp: new Date().toISOString()
      };
      
      // Store combined result
      await redisService.setCache(`media:${userId}:multimodal:latest`, combinedResult, 7200);
      
      logger.info(`Multimodal processing completed for user: ${userId}`);
      
      return combinedResult;
      
    } catch (error) {
      logger.error(`Multimodal processing failed for user: ${userId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Generate summary of multimodal processing results
   */
  generateMultimodalSummary(results) {
    const summary = {
      processedTypes: Object.keys(results),
      overallConfidence: 0,
      keyInsights: []
    };
    
    let confidenceSum = 0;
    let confidenceCount = 0;
    
    Object.values(results).forEach(result => {
      if (result.confidence) {
        confidenceSum += result.confidence;
        confidenceCount++;
      }
      
      if (result.analysis) {
        summary.keyInsights.push(result.analysis);
      }
    });
    
    if (confidenceCount > 0) {
      summary.overallConfidence = confidenceSum / confidenceCount;
    }
    
    return summary;
  }

  /**
   * Queue notification
   */
  async queueNotification(userId, notification, options = {}) {
    const jobData = {
      userId,
      notification: {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        data: notification.data || {},
        ...notification
      },
      options,
      timestamp: new Date().toISOString()
    };

    const job = await notificationQueue.add('send-notification', jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0
    });

    logger.info(`Notification queued: ${job.id}`, { userId, type: notification.type });
    
    return job.id;
  }

  /**
   * Send notification (processor function)
   */
  async sendNotification(data) {
    const { userId, notification } = data;
    
    try {
      // Send real-time notification via WebSocket
      const sent = await webSocketService.sendNotificationToUser(userId, notification);
      
      if (sent) {
        logger.info(`Real-time notification sent to user: ${userId}`);
      } else {
        logger.info(`User offline, notification queued for later: ${userId}`);
        // Store notification for when user comes online
        await this.storeOfflineNotification(userId, notification);
      }
      
      return { success: true, delivered: sent };
      
    } catch (error) {
      logger.error(`Notification delivery failed for user: ${userId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Send push notification (processor function)
   */
  async sendPushNotification(data) {
    const { userId, notification, subscription } = data;
    
    try {
      // This would integrate with web-push for actual push notifications
      // For now, just log the attempt
      logger.info(`Push notification would be sent to user: ${userId}`, { 
        title: notification.title,
        message: notification.message 
      });
      
      return { success: true, sent: true };
      
    } catch (error) {
      logger.error(`Push notification failed for user: ${userId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Store offline notification
   */
  async storeOfflineNotification(userId, notification) {
    const key = `notifications:offline:${userId}`;
    const notifications = await redisService.getCache(key) || [];
    
    notifications.push({
      ...notification,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(0, notifications.length - 50);
    }
    
    await redisService.setCache(key, notifications, 604800); // 7 days TTL
  }

  /**
   * Get offline notifications for user
   */
  async getOfflineNotifications(userId) {
    const key = `notifications:offline:${userId}`;
    const notifications = await redisService.getCache(key) || [];
    
    // Clear after retrieving
    await redisService.deleteCache(key);
    
    return notifications;
  }

  /**
   * Track media usage
   */
  async trackMediaUsage(userId, mediaType, usage = {}) {
    const timestamp = new Date().toISOString();
    const usageData = {
      userId,
      mediaType,
      usage,
      timestamp
    };
    
    // Store in daily usage stats
    const dateKey = timestamp.split('T')[0]; // YYYY-MM-DD
    const statsKey = `media:usage:${dateKey}`;
    
    const dailyStats = await redisService.getCache(statsKey) || [];
    dailyStats.push(usageData);
    
    await redisService.setCache(statsKey, dailyStats, 86400 * 7); // 7 days TTL
    
    logger.info(`Media usage tracked`, { userId, mediaType, usage });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    const job = await mediaQueue.getJob(jobId);
    
    if (!job) {
      return { status: 'not_found' };
    }
    
    const state = await job.getState();
    const progress = job.progress();
    
    return {
      id: job.id,
      status: state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const mediaStats = {
      waiting: await mediaQueue.getWaiting().then(jobs => jobs.length),
      active: await mediaQueue.getActive().then(jobs => jobs.length),
      completed: await mediaQueue.getCompleted().then(jobs => jobs.length),
      failed: await mediaQueue.getFailed().then(jobs => jobs.length)
    };
    
    const notificationStats = {
      waiting: await notificationQueue.getWaiting().then(jobs => jobs.length),
      active: await notificationQueue.getActive().then(jobs => jobs.length),
      completed: await notificationQueue.getCompleted().then(jobs => jobs.length),
      failed: await notificationQueue.getFailed().then(jobs => jobs.length)
    };
    
    return {
      media: mediaStats,
      notifications: notificationStats,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const mediaProcessingService = new MediaProcessingService();

module.exports = {
  mediaProcessingService,
  mediaQueue,
  notificationQueue
};
