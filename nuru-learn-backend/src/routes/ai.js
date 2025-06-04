const express = require('express');
const Joi = require('joi');
const crypto = require('crypto');
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const redisService = require('../services/redis');
const logger = require('../utils/logger');
const config = require('../config');

const router = express.Router();

// Validation schemas
const chatRequestSchema = Joi.object({
  message: Joi.string().min(1).max(4000).required(),
  context: Joi.object({
    subject: Joi.string().optional(),
    topic: Joi.string().optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    language: Joi.string().default('en'),
    userId: Joi.string().optional() // For personalization
  }).default({}),
  stream: Joi.boolean().default(false)
});

const imageAnalysisSchema = Joi.object({
  imageUrl: Joi.string().uri().optional(),
  imageBase64: Joi.string().optional(),
  prompt: Joi.string().min(1).max(1000).required(),
  context: Joi.object({
    subject: Joi.string().optional(),
    analysisType: Joi.string().valid('educational', 'assessment', 'feedback').default('educational')
  }).default({})
}).xor('imageUrl', 'imageBase64'); // Require either imageUrl or imageBase64

const voiceAnalysisSchema = Joi.object({
  audioUrl: Joi.string().uri().optional(),
  audioBase64: Joi.string().optional(),
  language: Joi.string().default('en'),
  analysisType: Joi.string().valid('pronunciation', 'comprehension', 'fluency').default('pronunciation'),
  context: Joi.object({
    expectedText: Joi.string().optional(),
    difficulty: Joi.string().optional()
  }).default({})
}).xor('audioUrl', 'audioBase64');

const lessonGenerationSchema = Joi.object({
  topic: Joi.string().min(1).max(200).required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  duration: Joi.number().min(5).max(120).default(30), // minutes
  format: Joi.string().valid('interactive', 'reading', 'video', 'mixed').default('interactive'),
  language: Joi.string().default('en'),
  learnerProfile: Joi.object({
    age: Joi.number().min(5).max(100).optional(),
    interests: Joi.array().items(Joi.string()).optional(),
    previousKnowledge: Joi.string().optional()
  }).optional()
});

// Utility functions
function generateCacheKey(endpoint, request, userId) {
  // Create a hash of the request data for caching
  const requestHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ endpoint, request, userId }))
    .digest('hex');
  
  return `ai_cache:${endpoint}:${requestHash}`;
}

function shouldCache(endpoint, request) {
  // Don't cache streaming requests
  if (request.stream) return false;
  
  // Don't cache requests with audio/video data (too large)
  if (request.audioBase64 || request.imageBase64) return false;
  
  // Cache text-based requests and lesson generation
  return ['chat', 'lesson-generation'].includes(endpoint);
}

function getCacheTTL(endpoint) {
  const ttlMap = {
    'chat': 3600, // 1 hour - general chat can be cached briefly
    'lesson-generation': 86400, // 24 hours - lessons are stable
    'image-analysis': 7200, // 2 hours - image analysis results
    'voice-analysis': 1800 // 30 minutes - pronunciation feedback
  };
  
  return ttlMap[endpoint] || 3600;
}

async function trackApiUsage(userId, endpoint, cached = false, cost = 0) {
  const usageKey = `api_usage:${userId}:${new Date().toISOString().split('T')[0]}`;
  const usageData = {
    endpoint,
    timestamp: new Date().toISOString(),
    cached,
    estimatedCost: cost
  };
  
  try {
    // Store in Redis for real-time tracking using setCache
    const existingUsage = await redisService.getCache(usageKey) || [];
    existingUsage.push(usageData);
    await redisService.setCache(usageKey, existingUsage, 86400 * 7); // Keep for 7 days
    
    // TODO: Also store in database for permanent analytics
    logger.info('API usage tracked', { userId, endpoint, cached, cost });
  } catch (error) {
    logger.error('Failed to track API usage', { error: error.message, userId, endpoint });
  }
}

// Mock AI service calls (replace with actual Nuru AI integration)
async function callNuruAI(endpoint, request) {
  // Simulate AI API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  
  // Mock responses based on endpoint
  switch (endpoint) {
    case 'chat':
      return {
        response: `This is a mock AI response to: "${request.message}". In a real implementation, this would be the actual Nuru AI response.`,
        usage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
        model: 'nuru-chat-v1'
      };
      
    case 'image-analysis':
      return {
        analysis: `Mock image analysis for prompt: "${request.prompt}". The image appears to show educational content.`,
        confidence: 0.85,
        detectedElements: ['text', 'diagram', 'educational_content'],
        usage: { inputTokens: 100, outputTokens: 80 }
      };
      
    case 'voice-analysis':
      return {
        transcript: 'Mock transcription of the audio',
        pronunciationScore: 0.78,
        feedback: 'Generally good pronunciation with room for improvement on certain sounds.',
        detailedAnalysis: {
          fluency: 0.8,
          accuracy: 0.75,
          completeness: 0.9
        },
        usage: { audioSeconds: 10, processingTime: 2.5 }
      };
      
    case 'lesson-generation':
      return {
        lesson: {
          title: `${request.topic} - ${request.difficulty} Level`,
          duration: request.duration,
          sections: [
            { type: 'introduction', content: 'Mock lesson introduction', estimatedTime: 5 },
            { type: 'content', content: 'Mock main lesson content', estimatedTime: 20 },
            { type: 'practice', content: 'Mock practice exercises', estimatedTime: 5 }
          ],
          objectives: ['Mock learning objective 1', 'Mock learning objective 2'],
          resources: ['Mock resource 1', 'Mock resource 2']
        },
        usage: { generationTime: 3.2, complexity: 'medium' }
      };
      
    default:
      throw new Error(`Unknown AI endpoint: ${endpoint}`);
  }
}

// AI Chat endpoint
router.post('/chat', 
  authMiddleware,
  rateLimitMiddleware('ai', 30, 60000), // 30 requests per minute
  asyncHandler(async (req, res) => {
    const { error, value } = chatRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const { message, context, stream } = value;
    const userId = req.user.id;
    
    // Add user context
    const enrichedRequest = {
      ...value,
      context: {
        ...context,
        userId,
        userProfile: {
          difficulty: req.user.profile.difficulty_preference,
          language: req.user.profile.preferred_language
        }
      }
    };

    // Check cache first
    const cacheKey = generateCacheKey('chat', enrichedRequest, userId);
    let response;
    let fromCache = false;

    if (shouldCache('chat', enrichedRequest)) {
      const cachedResponse = await redisService.getCache(cacheKey);
      if (cachedResponse) {
        response = cachedResponse;
        fromCache = true;
        logger.info('AI chat response served from cache', { userId, cacheKey });
      }
    }

    // If not cached, call AI service
    if (!response) {
      try {
        response = await callNuruAI('chat', enrichedRequest);
        
        // Cache the response
        if (shouldCache('chat', enrichedRequest)) {
          await redisService.setCache(cacheKey, response, getCacheTTL('chat'));
        }
        
        logger.info('AI chat response generated', { userId, tokens: response.usage?.totalTokens });
      } catch (error) {
        logger.error('AI chat request failed', { error: error.message, userId });
        return res.status(500).json({
          error: 'AI service error',
          message: 'Failed to process chat request'
        });
      }
    }

    // Track usage
    await trackApiUsage(userId, 'chat', fromCache, response.usage?.totalTokens * 0.002 || 0);

    res.json({
      ...response,
      cached: fromCache,
      cacheKey: fromCache ? cacheKey : undefined
    });
  })
);

// AI Image Analysis endpoint
router.post('/image-analysis',
  authMiddleware,
  rateLimitMiddleware('ai_image', 10, 60000), // 10 requests per minute
  asyncHandler(async (req, res) => {
    const { error, value } = imageAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    
    // Check cache (only for URL-based images, not base64)
    let response;
    let fromCache = false;
    let cacheKey;

    if (value.imageUrl && !value.imageBase64) {
      cacheKey = generateCacheKey('image-analysis', value, userId);
      const cachedResponse = await redisService.getCache(cacheKey);
      if (cachedResponse) {
        response = cachedResponse;
        fromCache = true;
        logger.info('AI image analysis served from cache', { userId, cacheKey });
      }
    }

    if (!response) {
      try {
        response = await callNuruAI('image-analysis', value);
        
        // Cache URL-based results
        if (value.imageUrl && !value.imageBase64) {
          await redisService.setCache(cacheKey, response, getCacheTTL('image-analysis'));
        }
        
        logger.info('AI image analysis generated', { userId, confidence: response.confidence });
      } catch (error) {
        logger.error('AI image analysis failed', { error: error.message, userId });
        return res.status(500).json({
          error: 'AI service error',
          message: 'Failed to process image analysis'
        });
      }
    }

    // Track usage
    await trackApiUsage(userId, 'image-analysis', fromCache, response.usage?.inputTokens * 0.01 || 0);

    res.json({
      ...response,
      cached: fromCache
    });
  })
);

// AI Voice Analysis endpoint
router.post('/voice-analysis',
  authMiddleware,
  rateLimitMiddleware('ai_voice', 5, 60000), // 5 requests per minute
  asyncHandler(async (req, res) => {
    const { error, value } = voiceAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;

    // Voice analysis is rarely cached due to uniqueness
    try {
      const response = await callNuruAI('voice-analysis', value);
      logger.info('AI voice analysis generated', { userId, score: response.pronunciationScore });
      
      // Track usage
      await trackApiUsage(userId, 'voice-analysis', false, response.usage?.audioSeconds * 0.05 || 0);

      res.json(response);
    } catch (error) {
      logger.error('AI voice analysis failed', { error: error.message, userId });
      return res.status(500).json({
        error: 'AI service error',
        message: 'Failed to process voice analysis'
      });
    }
  })
);

// AI Lesson Generation endpoint
router.post('/lesson-generation',
  authMiddleware,
  rateLimitMiddleware('ai_lesson', 3, 300000), // 3 requests per 5 minutes
  asyncHandler(async (req, res) => {
    const { error, value } = lessonGenerationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    
    // Add user profile to lesson generation
    const enrichedRequest = {
      ...value,
      learnerProfile: {
        ...value.learnerProfile,
        userId,
        currentLevel: req.user.profile.difficulty_preference,
        language: req.user.profile.preferred_language
      }
    };

    // Check cache
    const cacheKey = generateCacheKey('lesson-generation', enrichedRequest, userId);
    let response;
    let fromCache = false;

    const cachedResponse = await redisService.getCache(cacheKey);
    if (cachedResponse) {
      response = cachedResponse;
      fromCache = true;
      logger.info('AI lesson generation served from cache', { userId, cacheKey });
    }

    if (!response) {
      try {
        response = await callNuruAI('lesson-generation', enrichedRequest);
        
        // Cache lesson generation (stable content)
        await redisService.setCache(cacheKey, response, getCacheTTL('lesson-generation'));
        
        logger.info('AI lesson generated', { userId, topic: value.topic, difficulty: value.difficulty });
      } catch (error) {
        logger.error('AI lesson generation failed', { error: error.message, userId });
        return res.status(500).json({
          error: 'AI service error',
          message: 'Failed to generate lesson'
        });
      }
    }

    // Track usage
    await trackApiUsage(userId, 'lesson-generation', fromCache, 0.50); // Fixed cost per lesson

    res.json({
      ...response,
      cached: fromCache
    });
  })
);

// Get AI Usage Statistics
router.get('/usage-stats',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;
    
    try {
      const stats = {
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        usage: {
          totalRequests: 0,
          cachedRequests: 0,
          cacheHitRate: 0,
          estimatedCost: 0,
          estimatedSavings: 0,
          byEndpoint: {}
        }
      };

      // Collect usage data from Redis
      const allUsageData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const usageKey = `api_usage:${userId}:${date}`;
        const dailyUsage = await redisService.getCache(usageKey) || [];
        allUsageData.push(...dailyUsage);
      }
      
      // Process usage data
      for (const usage of allUsageData) {
        try {
          stats.usage.totalRequests++;
          stats.usage.estimatedCost += usage.estimatedCost || 0;
          
          if (usage.cached) {
            stats.usage.cachedRequests++;
            stats.usage.estimatedSavings += usage.estimatedCost || 0;
          }
          
          if (!stats.usage.byEndpoint[usage.endpoint]) {
            stats.usage.byEndpoint[usage.endpoint] = {
              total: 0,
              cached: 0,
              cost: 0
            };
          }
          
          stats.usage.byEndpoint[usage.endpoint].total++;
          stats.usage.byEndpoint[usage.endpoint].cost += usage.estimatedCost || 0;
          if (usage.cached) {
            stats.usage.byEndpoint[usage.endpoint].cached++;
          }
        } catch (parseError) {
          logger.warn('Failed to process usage data', { error: parseError.message });
        }
      }

      // Calculate cache hit rate
      if (stats.usage.totalRequests > 0) {
        stats.usage.cacheHitRate = (stats.usage.cachedRequests / stats.usage.totalRequests) * 100;
      }

      logger.info('AI usage stats generated', { userId, ...stats.usage });

      res.json(stats);
    } catch (error) {
      logger.error('Failed to get usage stats', { error: error.message, userId });
      return res.status(500).json({
        error: 'Failed to retrieve usage statistics',
        message: error.message
      });
    }
  })
);

// Cache management endpoints (admin only)
router.delete('/cache/clear',
  authMiddleware,
  asyncHandler(async (req, res) => {
    // Only allow admins to clear cache
    if (req.user.profile.role !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Admin role required'
      });
    }

    try {
      const pattern = req.query.pattern || 'ai_cache:*';
      
      // Use Redis client directly for advanced operations
      const client = redisService.getRedisClient();
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(keys);
      }
      
      logger.info('AI cache cleared', { pattern, keysCleared: keys.length, adminId: req.user.id });
      
      res.json({
        message: 'Cache cleared successfully',
        keysCleared: keys.length,
        pattern
      });
    } catch (error) {
      logger.error('Failed to clear cache', { error: error.message });
      return res.status(500).json({
        error: 'Failed to clear cache',
        message: error.message
      });
    }
  })
);

module.exports = router;
