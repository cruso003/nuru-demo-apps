const webpush = require('web-push');
const logger = require('../utils/logger');
const redisService = require('./redis');

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.setup();
  }

  /**
   * Initialize web-push with VAPID keys
   */
  setup() {
    try {
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@nurulearn.com';

      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
        this.initialized = true;
        logger.info('Push notification service initialized');
      } else {
        logger.warn('VAPID keys not configured, push notifications disabled');
        logger.info('To enable push notifications, set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables');
      }
    } catch (error) {
      logger.error('Push notification setup failed:', error);
    }
  }

  /**
   * Generate VAPID keys (utility function)
   */
  static generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe(userId, subscription) {
    try {
      if (!this.initialized) {
        throw new Error('Push notifications not configured');
      }

      // Validate subscription format
      if (!subscription.endpoint || !subscription.keys) {
        throw new Error('Invalid subscription format');
      }

      // Store subscription in Redis
      const subscriptionKey = `push:subscription:${userId}`;
      await redisService.setCache(subscriptionKey, subscription, 2592000); // 30 days TTL

      logger.info('User subscribed to push notifications', { userId });

      return {
        success: true,
        message: 'Successfully subscribed to push notifications'
      };

    } catch (error) {
      logger.error('Push subscription failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribe(userId) {
    try {
      const subscriptionKey = `push:subscription:${userId}`;
      await redisService.deleteCache(subscriptionKey);

      logger.info('User unsubscribed from push notifications', { userId });

      return {
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      };

    } catch (error) {
      logger.error('Push unsubscription failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Send push notification to specific user
   */
  async sendNotificationToUser(userId, notification) {
    try {
      if (!this.initialized) {
        logger.warn('Push notifications not configured, skipping');
        return { success: false, reason: 'not_configured' };
      }

      // Get user's subscription
      const subscriptionKey = `push:subscription:${userId}`;
      const subscription = await redisService.getCache(subscriptionKey);

      if (!subscription) {
        logger.info('No push subscription found for user', { userId });
        return { success: false, reason: 'no_subscription' };
      }

      // Prepare notification payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message || notification.body,
        icon: notification.icon || '/icons/nuru-learn-192.png',
        badge: notification.badge || '/icons/nuru-learn-badge.png',
        data: {
          url: notification.url || '/',
          timestamp: new Date().toISOString(),
          ...notification.data
        },
        actions: notification.actions || [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      });

      // Send push notification
      const result = await webpush.sendNotification(subscription, payload);

      logger.info('Push notification sent successfully', { 
        userId, 
        title: notification.title,
        statusCode: result.statusCode 
      });

      return {
        success: true,
        statusCode: result.statusCode,
        delivered: true
      };

    } catch (error) {
      logger.error('Push notification sending failed', { 
        error: error.message, 
        userId,
        statusCode: error.statusCode 
      });

      // Handle specific error cases
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is no longer valid, remove it
        await this.unsubscribe(userId);
        logger.info('Invalid subscription removed', { userId });
      }

      throw error;
    }
  }

  /**
   * Send bulk push notifications
   */
  async sendBulkNotifications(notifications) {
    if (!this.initialized) {
      logger.warn('Push notifications not configured, skipping bulk send');
      return { success: false, reason: 'not_configured' };
    }

    const results = [];
    const batchSize = 10; // Process in batches to avoid overwhelming the service

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (notif) => {
        try {
          const result = await this.sendNotificationToUser(notif.userId, notif.notification);
          return { userId: notif.userId, success: true, result };
        } catch (error) {
          return { userId: notif.userId, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || { success: false, error: 'Promise rejected' }));

      // Small delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    logger.info('Bulk push notifications completed', { 
      total: notifications.length, 
      successful, 
      failed 
    });

    return {
      success: true,
      total: notifications.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Send learning reminder notifications
   */
  async sendLearningReminder(userId, reminderData) {
    const notification = {
      title: 'Time to Learn! 📚',
      message: reminderData.message || 'Continue your Kpelle learning journey',
      icon: '/icons/nuru-learn-192.png',
      data: {
        type: 'learning_reminder',
        subject: reminderData.subject,
        url: reminderData.url || '/dashboard'
      },
      actions: [
        {
          action: 'learn_now',
          title: 'Learn Now'
        },
        {
          action: 'remind_later',
          title: 'Remind Later'
        }
      ]
    };

    return this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send achievement unlock notification
   */
  async sendAchievementNotification(userId, achievement) {
    const notification = {
      title: '🏆 Achievement Unlocked!',
      message: `Congratulations! You've earned: ${achievement.name}`,
      icon: '/icons/achievement.png',
      data: {
        type: 'achievement',
        achievementId: achievement.id,
        url: '/achievements'
      },
      actions: [
        {
          action: 'view_achievement',
          title: 'View Achievement'
        },
        {
          action: 'share',
          title: 'Share'
        }
      ]
    };

    return this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send streak milestone notification
   */
  async sendStreakNotification(userId, streakData) {
    const notification = {
      title: '🔥 Streak Milestone!',
      message: `Amazing! You've maintained a ${streakData.days}-day learning streak!`,
      icon: '/icons/streak.png',
      data: {
        type: 'streak_milestone',
        days: streakData.days,
        url: '/progress'
      }
    };

    return this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send lesson completion celebration
   */
  async sendLessonCompletionNotification(userId, lessonData) {
    const notification = {
      title: '✅ Lesson Complete!',
      message: `Great job completing "${lessonData.title}"! Keep up the excellent work!`,
      icon: '/icons/lesson-complete.png',
      data: {
        type: 'lesson_completion',
        lessonId: lessonData.id,
        score: lessonData.score,
        url: '/lessons'
      }
    };

    return this.sendNotificationToUser(userId, notification);
  }

  /**
   * Get user's push subscription status
   */
  async getSubscriptionStatus(userId) {
    try {
      const subscriptionKey = `push:subscription:${userId}`;
      const subscription = await redisService.getCache(subscriptionKey);

      return {
        subscribed: !!subscription,
        subscription: subscription ? {
          endpoint: subscription.endpoint.substring(0, 50) + '...', // Truncate for privacy
          hasKeys: !!(subscription.keys && subscription.keys.p256dh && subscription.keys.auth)
        } : null
      };

    } catch (error) {
      logger.error('Error checking subscription status', { error: error.message, userId });
      return { subscribed: false, error: error.message };
    }
  }

  /**
   * Test push notification
   */
  async sendTestNotification(userId) {
    const notification = {
      title: '🧪 Test Notification',
      message: 'This is a test push notification from Nuru Learn!',
      icon: '/icons/nuru-learn-192.png',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    };

    return this.sendNotificationToUser(userId, notification);
  }

  /**
   * Get service configuration status
   */
  getServiceStatus() {
    return {
      initialized: this.initialized,
      configured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      email: process.env.VAPID_EMAIL || 'mailto:admin@nurulearn.com'
    };
  }
}

// Singleton instance
const pushNotificationService = new PushNotificationService();

module.exports = pushNotificationService;
