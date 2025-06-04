const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabaseAdmin, createUserProfile, getUserProfile } = require('../services/supabase');
const { setCache, deleteCache } = require('../services/redis');
const { rateLimitMiddleware, validateRequest } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().alphanum().min(3).max(20).optional(),
  fullName: Joi.string().min(2).max(100).optional(),
  preferredLanguage: Joi.string().valid('en', 'es', 'fr', 'de', 'pt').default('en'),
  dailyGoalMinutes: Joi.number().min(10).max(480).default(30)
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

// Rate limiting for auth endpoints
const authRateLimit = rateLimitMiddleware({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many authentication attempts, please try again later.'
});

/**
 * Sign up new user
 * POST /api/auth/signup
 */
router.post('/signup', 
  authRateLimit,
  validateRequest(signUpSchema),
  asyncHandler(async (req, res) => {
    const { email, password, username, fullName, preferredLanguage, dailyGoalMinutes } = req.body;

    const supabase = getSupabaseAdmin();

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm in development
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }
      throw authError;
    }

    // Create user profile
    const profileData = {
      email,
      username: username || null,
      full_name: fullName || null,
      preferred_language: preferredLanguage,
      daily_goal_minutes: dailyGoalMinutes
    };

    try {
      const userProfile = await createUserProfile(authData.user.id, profileData);

      // Generate JWT token
      const token = jwt.sign(
        { userId: authData.user.id, email },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );

      logger.info(`New user registered: ${email}`, { userId: authData.user.id });

      res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile: userProfile
        },
        token
      });
    } catch (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }
  })
);

/**
 * Sign in user
 * POST /api/auth/signin
 */
router.post('/signin',
  authRateLimit,
  validateRequest(signInSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const supabase = getSupabaseAdmin();

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(authData.user.id);

    if (!userProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile not found. Please contact support.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: authData.user.id, email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Cache user session
    await setCache(`session:${authData.user.id}`, {
      userId: authData.user.id,
      email,
      lastActivity: new Date().toISOString()
    }, 7 * 24 * 60 * 60); // 7 days

    logger.info(`User signed in: ${email}`, { userId: authData.user.id });

    res.json({
      message: 'Signed in successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: userProfile
      },
      token
    });
  })
);

/**
 * Sign out user
 * POST /api/auth/signout
 */
router.post('/signout',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        // Remove cached session
        await deleteCache(`session:${decoded.userId}`);
        
        logger.info(`User signed out: ${decoded.email}`, { userId: decoded.userId });
      } catch (error) {
        // Token verification failed, but we still respond with success
        logger.warn('Invalid token on signout:', error.message);
      }
    }

    res.json({
      message: 'Signed out successfully'
    });
  })
);

/**
 * Request password reset
 * POST /api/auth/reset-password
 */
router.post('/reset-password',
  authRateLimit,
  validateRequest(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.CORS_ORIGIN}/auth/reset-password`
    });

    if (error) {
      logger.error('Password reset error:', error);
    }

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  })
);

/**
 * Update password
 * POST /api/auth/update-password
 */
router.post('/update-password',
  authRateLimit,
  validateRequest(updatePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseAdmin();

    // Verify current token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please sign in again'
      });
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (verifyError) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: 'The current password is incorrect'
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (updateError) {
      throw updateError;
    }

    // Invalidate all user sessions
    await deleteCache(`session:${user.id}`);

    logger.info(`Password updated for user: ${user.email}`, { userId: user.id });

    res.json({
      message: 'Password updated successfully. Please sign in again.'
    });
  })
);

/**
 * Verify token
 * GET /api/auth/verify
 */
router.get('/verify',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseAdmin();

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(user.id);

    if (!userProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile not found'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        profile: userProfile
      }
    });
  })
);

/**
 * Refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token'
      });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'The refresh token is invalid or expired'
      });
    }

    // Generate new JWT token
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Token refreshed successfully',
      token,
      refreshToken: data.session.refresh_token
    });
  })
);

module.exports = router;
