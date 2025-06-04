const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const { getUserProfile } = require('../services/supabase');
const { checkRateLimit } = require('../services/redis');

/**
 * Authentication middleware
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with our secret
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }
    
    // Get user profile
    const userProfile = await getUserProfile(decoded.userId);
    
    if (!userProfile) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      profile: userProfile
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Failed to authenticate request'
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is provided, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user info
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token with our secret
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (jwtError) {
      return next(); // Continue without user info if token is invalid
    }
    
    const userProfile = await getUserProfile(decoded.userId);
    if (userProfile) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        profile: userProfile
      };
    }

    next();
  } catch (error) {
    // Log error but continue without user info
    logger.warn('Optional auth failed:', error);
    next();
  }
}

/**
 * Role-based authorization middleware
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    const userRole = req.user.profile?.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Rate limiting middleware
 */
function rateLimitMiddleware(options = {}) {
  const {
    maxRequests = config.RATE_LIMIT_MAX_REQUESTS,
    windowMs = config.RATE_LIMIT_WINDOW_MS,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests, please try again later.'
  } = options;

  return async (req, res, next) => {
    try {
      const identifier = keyGenerator(req);
      const endpoint = req.route?.path || req.path;
      
      const rateLimit = await checkRateLimit(identifier, endpoint, maxRequests, windowMs);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimit.total,
        'X-RateLimit-Remaining': rateLimit.remaining,
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
      });

      if (!rateLimit.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

/**
 * User-specific rate limiting
 */
function userRateLimit(maxRequests = 1000, windowMs = 60 * 60 * 1000) { // 1000 requests per hour
  return rateLimitMiddleware({
    maxRequests,
    windowMs,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: 'User rate limit exceeded. Please slow down your requests.'
  });
}

/**
 * API key validation middleware (for external integrations)
 */
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the X-API-Key header'
    });
  }

  // In production, validate against database
  // For now, check against environment variable
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }

  next();
}

/**
 * Subscription status check middleware
 */
function requireSubscription(requiredStatus = ['premium', 'trial']) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    const userSubscription = req.user.profile?.subscription_status;
    const allowedStatuses = Array.isArray(requiredStatus) ? requiredStatus : [requiredStatus];
    
    if (!allowedStatuses.includes(userSubscription)) {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'This feature requires a premium subscription',
        currentSubscription: userSubscription,
        requiredSubscription: allowedStatuses
      });
    }

    // Check if subscription is expired
    if (req.user.profile?.subscription_expires_at) {
      const expiresAt = new Date(req.user.profile.subscription_expires_at);
      if (expiresAt < new Date()) {
        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue.',
          expiredAt: expiresAt.toISOString()
        });
      }
    }

    next();
  };
}

/**
 * Request validation middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message,
        details: error.details
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  rateLimitMiddleware,
  userRateLimit,
  validateApiKey,
  requireSubscription,
  validateRequest
};
