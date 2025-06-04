const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * Connect to Redis
 */
async function connectRedis() {
  try {
    redisClient = redis.createClient({
      url: config.REDIS_URL,
      password: config.REDIS_PASSWORD,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis retry attempts exhausted');
          return undefined;
        }
        // Exponential backoff
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Get Redis client
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
}

/**
 * Set cache with TTL
 */
async function setCache(key, value, ttlSeconds = config.CACHE_TTL) {
  try {
    const client = getRedisClient();
    const serializedValue = JSON.stringify(value);
    await client.setEx(key, ttlSeconds, serializedValue);
    logger.debug(`Cache set for key: ${key}`);
    return true;
  } catch (error) {
    logger.error('Error setting cache:', error);
    return false;
  }
}

/**
 * Get cache
 */
async function getCache(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (value) {
      logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    logger.error('Error getting cache:', error);
    return null;
  }
}

/**
 * Delete cache
 */
async function deleteCache(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    logger.debug(`Cache deleted for key: ${key}`);
    return true;
  } catch (error) {
    logger.error('Error deleting cache:', error);
    return false;
  }
}

/**
 * Check if cache exists
 */
async function cacheExists(key) {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Error checking cache existence:', error);
    return false;
  }
}

/**
 * Set cache with tags for easier invalidation
 */
async function setCacheWithTags(key, value, tags = [], ttlSeconds = config.CACHE_TTL) {
  try {
    const client = getRedisClient();
    
    // Set the main cache
    await setCache(key, value, ttlSeconds);
    
    // Set tag associations
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      await client.sAdd(tagKey, key);
      await client.expire(tagKey, ttlSeconds);
    }
    
    return true;
  } catch (error) {
    logger.error('Error setting cache with tags:', error);
    return false;
  }
}

/**
 * Invalidate all cache entries with a specific tag
 */
async function invalidateCacheByTag(tag) {
  try {
    const client = getRedisClient();
    const tagKey = `tag:${tag}`;
    
    // Get all keys with this tag
    const keys = await client.sMembers(tagKey);
    
    if (keys.length > 0) {
      // Delete all associated cache entries
      await client.del(keys);
      logger.info(`Invalidated ${keys.length} cache entries for tag: ${tag}`);
    }
    
    // Delete the tag set itself
    await client.del(tagKey);
    
    return keys.length;
  } catch (error) {
    logger.error('Error invalidating cache by tag:', error);
    return 0;
  }
}

/**
 * Generate cache key for AI responses
 */
function generateAICacheKey(prompt, model, parameters = {}) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify({ prompt, model, parameters }));
  return `ai:${hash.digest('hex')}`;
}

/**
 * Cache AI response
 */
async function cacheAIResponse(prompt, model, response, parameters = {}, tokensUsed = 0, costUsd = 0) {
  try {
    const cacheKey = generateAICacheKey(prompt, model, parameters);
    const cacheData = {
      response,
      model,
      tokensUsed,
      costUsd,
      timestamp: new Date().toISOString(),
      hitCount: 1
    };
    
    // Cache for 24 hours by default for AI responses
    await setCache(cacheKey, cacheData, 24 * 60 * 60);
    
    // Also store in Supabase for persistence and analytics
    const { getSupabaseAdmin } = require('./supabase');
    const supabase = getSupabaseAdmin();
    
    const promptHash = require('crypto').createHash('sha256').update(prompt).digest('hex');
    
    await supabase.from('ai_cache').upsert({
      cache_key: cacheKey,
      prompt_hash: promptHash,
      response_data: response,
      model_name: model,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    
    return cacheKey;
  } catch (error) {
    logger.error('Error caching AI response:', error);
    return null;
  }
}

/**
 * Get cached AI response
 */
async function getCachedAIResponse(prompt, model, parameters = {}) {
  try {
    const cacheKey = generateAICacheKey(prompt, model, parameters);
    const cached = await getCache(cacheKey);
    
    if (cached) {
      // Increment hit count
      cached.hitCount = (cached.hitCount || 0) + 1;
      await setCache(cacheKey, cached, 24 * 60 * 60);
      
      // Update hit count in Supabase
      const { getSupabaseAdmin } = require('./supabase');
      const supabase = getSupabaseAdmin();
      
      await supabase
        .from('ai_cache')
        .update({ 
          hit_count: cached.hitCount,
          last_accessed: new Date().toISOString()
        })
        .eq('cache_key', cacheKey);
      
      logger.info(`AI Cache hit! Saved tokens: ${cached.tokensUsed}, cost: $${cached.costUsd}`);
      return cached.response;
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting cached AI response:', error);
    return null;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const client = getRedisClient();
    const info = await client.info('memory');
    const keyspace = await client.info('keyspace');
    
    return {
      memory: info,
      keyspace: keyspace,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Rate limiting using Redis
 */
async function checkRateLimit(identifier, endpoint, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  try {
    const client = getRedisClient();
    const key = `rate_limit:${identifier}:${endpoint}`;
    const windowSeconds = Math.floor(windowMs / 1000);
    
    // Use Redis sliding window log
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old entries
    await client.zRemRangeByScore(key, '-inf', windowStart);
    
    // Count current requests
    const currentRequests = await client.zCard(key);
    
    if (currentRequests >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs,
        total: maxRequests
      };
    }
    
    // Add current request
    await client.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
    await client.expire(key, windowSeconds);
    
    return {
      allowed: true,
      remaining: maxRequests - currentRequests - 1,
      resetTime: now + windowMs,
      total: maxRequests
    };
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: 100,
      resetTime: Date.now() + windowMs,
      total: maxRequests
    };
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  cacheExists,
  setCacheWithTags,
  invalidateCacheByTag,
  generateAICacheKey,
  cacheAIResponse,
  getCachedAIResponse,
  getCacheStats,
  checkRateLimit
};
