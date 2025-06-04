const express = require('express');
const Joi = require('joi');
const { getUserProfile, updateUserProfile, updateUserStreak } = require('../services/supabase');
const { requireRole, validateRequest, userRateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(20).optional(),
  fullName: Joi.string().min(2).max(100).optional(),
  avatarUrl: Joi.string().uri().optional(),
  preferredLanguage: Joi.string().valid('en', 'es', 'fr', 'de', 'pt').optional(),
  timezone: Joi.string().optional(),
  dailyGoalMinutes: Joi.number().min(10).max(480).optional(),
  difficultyPreference: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  notificationPreferences: Joi.object({
    email: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    streakReminders: Joi.boolean().optional()
  }).optional()
});

const updateStreakSchema = Joi.object({
  studyMinutes: Joi.number().min(1).max(480).required()
});

/**
 * Get current user profile
 * GET /api/users/profile
 */
router.get('/profile',
  userRateLimit(200), // 200 requests per hour
  asyncHandler(async (req, res) => {
    const userProfile = await getUserProfile(req.user.id);

    if (!userProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile not found'
      });
    }

    res.json({
      profile: userProfile
    });
  })
);

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile',
  userRateLimit(50), // 50 updates per hour
  validateRequest(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const updates = req.body;

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const updatedProfile = await updateUserProfile(req.user.id, updates);

    logger.info(`Profile updated for user: ${req.user.email}`, { 
      userId: req.user.id,
      updates: Object.keys(updates)
    });

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  })
);

/**
 * Update user streak
 * POST /api/users/streak
 */
router.post('/streak',
  userRateLimit(100), // 100 streak updates per hour
  validateRequest(updateStreakSchema),
  asyncHandler(async (req, res) => {
    const { studyMinutes } = req.body;

    await updateUserStreak(req.user.id, studyMinutes);

    // Get updated profile to return current streak
    const updatedProfile = await getUserProfile(req.user.id);

    logger.info(`Streak updated for user: ${req.user.email}`, {
      userId: req.user.id,
      studyMinutes,
      currentStreak: updatedProfile.current_streak_days
    });

    res.json({
      message: 'Streak updated successfully',
      studyMinutes,
      currentStreak: updatedProfile.current_streak_days,
      totalStudyTime: updatedProfile.total_study_time_minutes
    });
  })
);

/**
 * Get user statistics
 * GET /api/users/stats
 */
router.get('/stats',
  userRateLimit(100),
  asyncHandler(async (req, res) => {
    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    // Get user profile
    const userProfile = await getUserProfile(req.user.id);

    // Get recent streak data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('streak_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('streak_date', { ascending: false });

    if (streakError) throw streakError;

    // Get learning progress summary
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        *,
        learning_subjects:subject_id(name, description),
        learning_topics:topic_id(name, description)
      `)
      .eq('user_id', req.user.id);

    if (progressError) throw progressError;

    // Calculate statistics
    const stats = {
      profile: {
        currentStreak: userProfile.current_streak_days,
        longestStreak: userProfile.longest_streak_days,
        totalStudyTime: userProfile.total_study_time_minutes,
        dailyGoal: userProfile.daily_goal_minutes,
        memberSince: userProfile.created_at
      },
      recent: {
        last30Days: streakData,
        totalMinutesLast30Days: streakData.reduce((sum, day) => sum + day.minutes_studied, 0),
        daysActiveLast30Days: streakData.filter(day => day.minutes_studied > 0).length,
        goalCompletionRate: streakData.length > 0 
          ? (streakData.filter(day => day.daily_goal_met).length / streakData.length * 100).toFixed(1)
          : 0
      },
      progress: {
        subjectsStarted: new Set(progressData.map(p => p.subject_id)).size,
        topicsCompleted: progressData.filter(p => p.completion_percentage === 100).length,
        averageScore: progressData.length > 0
          ? (progressData.reduce((sum, p) => sum + (p.average_score || 0), 0) / progressData.length).toFixed(1)
          : 0,
        bySubject: progressData.reduce((acc, progress) => {
          const subjectName = progress.learning_subjects?.name || 'Unknown';
          if (!acc[subjectName]) {
            acc[subjectName] = {
              timeSpent: 0,
              topicsCompleted: 0,
              averageScore: 0,
              lastAccessed: null
            };
          }
          acc[subjectName].timeSpent += progress.time_spent_minutes;
          if (progress.completion_percentage === 100) {
            acc[subjectName].topicsCompleted++;
          }
          acc[subjectName].averageScore = progress.average_score || 0;
          if (!acc[subjectName].lastAccessed || progress.last_accessed > acc[subjectName].lastAccessed) {
            acc[subjectName].lastAccessed = progress.last_accessed;
          }
          return acc;
        }, {})
      }
    };

    res.json({
      stats
    });
  })
);

/**
 * Delete user account
 * DELETE /api/users/account
 */
router.delete('/account',
  userRateLimit(5), // Very limited - 5 attempts per hour
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password required',
        message: 'Please provide your password to confirm account deletion'
      });
    }

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    // Verify password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password
    });

    if (verifyError) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'The provided password is incorrect'
      });
    }

    // Delete user (this will cascade to all related data due to foreign key constraints)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(req.user.id);

    if (deleteError) {
      throw deleteError;
    }

    logger.info(`Account deleted for user: ${req.user.email}`, { userId: req.user.id });

    res.json({
      message: 'Account deleted successfully'
    });
  })
);

/**
 * Get user preferences
 * GET /api/users/preferences
 */
router.get('/preferences',
  userRateLimit(100),
  asyncHandler(async (req, res) => {
    const userProfile = await getUserProfile(req.user.id);

    const preferences = {
      language: userProfile.preferred_language,
      timezone: userProfile.timezone,
      dailyGoal: userProfile.daily_goal_minutes,
      difficulty: userProfile.difficulty_preference,
      notifications: userProfile.notification_preferences
    };

    res.json({
      preferences
    });
  })
);

/**
 * Admin only: Get all users (paginated)
 * GET /api/users/admin/all
 */
router.get('/admin/all',
  requireRole(['admin']),
  userRateLimit(20),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      users: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  })
);

module.exports = router;
