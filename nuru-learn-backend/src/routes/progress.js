const express = require('express');
const Joi = require('joi');
const { getUserProgress, updateUserProgress, updateUserStreak } = require('../services/supabase');
const { validateRequest, userRateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { setCache, getCache } = require('../services/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const updateProgressSchema = Joi.object({
  completionPercentage: Joi.number().min(0).max(100).optional(),
  timeSpentMinutes: Joi.number().min(0).max(480).optional(),
  quizScore: Joi.number().min(0).max(100).optional(),
  completed: Joi.boolean().optional()
});

const bulkProgressSchema = Joi.object({
  progressUpdates: Joi.array().items(Joi.object({
    subjectId: Joi.string().uuid().required(),
    topicId: Joi.string().uuid().required(),
    completionPercentage: Joi.number().min(0).max(100).optional(),
    timeSpentMinutes: Joi.number().min(0).max(480).optional(),
    quizScore: Joi.number().min(0).max(100).optional()
  })).min(1).max(10).required()
});

/**
 * Get user's overall progress
 * GET /api/progress
 */
router.get('/',
  userRateLimit(200),
  asyncHandler(async (req, res) => {
    const { subject, limit = 50 } = req.query;

    // Check cache first
    const cacheKey = `progress:${req.user.id}:${subject || 'all'}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        progress: cached,
        cached: true
      });
    }

    const progress = await getUserProgress(req.user.id, subject);

    // Limit results
    const limitedProgress = progress.slice(0, parseInt(limit));

    // Cache for 5 minutes
    await setCache(cacheKey, limitedProgress, 5 * 60);

    res.json({
      progress: limitedProgress,
      total: progress.length,
      cached: false
    });
  })
);

/**
 * Get progress for a specific subject
 * GET /api/progress/subjects/:subjectId
 */
router.get('/subjects/:subjectId',
  userRateLimit(200),
  asyncHandler(async (req, res) => {
    const { subjectId } = req.params;

    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(subjectId)) {
      return res.status(400).json({
        error: 'Invalid subject ID',
        message: 'Subject ID must be a valid UUID'
      });
    }

    const progress = await getUserProgress(req.user.id, subjectId);

    // Calculate subject-level statistics
    const stats = {
      totalTopics: progress.length,
      completedTopics: progress.filter(p => p.completion_percentage === 100).length,
      totalTimeSpent: progress.reduce((sum, p) => sum + p.time_spent_minutes, 0),
      averageScore: progress.length > 0 
        ? progress.reduce((sum, p) => sum + (p.average_score || 0), 0) / progress.length
        : 0,
      lastAccessed: progress.length > 0 
        ? Math.max(...progress.map(p => new Date(p.last_accessed).getTime()))
        : null
    };

    res.json({
      subjectId,
      progress,
      stats
    });
  })
);

/**
 * Get progress for a specific topic
 * GET /api/progress/topics/:topicId
 */
router.get('/topics/:topicId',
  userRateLimit(200),
  asyncHandler(async (req, res) => {
    const { topicId } = req.params;

    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(topicId)) {
      return res.status(400).json({
        error: 'Invalid topic ID',
        message: 'Topic ID must be a valid UUID'
      });
    }

    const progress = await getUserProgress(req.user.id, null, topicId);

    if (progress.length === 0) {
      return res.status(404).json({
        error: 'Progress not found',
        message: 'No progress found for this topic'
      });
    }

    res.json({
      topicId,
      progress: progress[0]
    });
  })
);

/**
 * Update progress for a topic
 * PUT /api/progress/topics/:topicId
 */
router.put('/topics/:topicId',
  userRateLimit(100),
  validateRequest(updateProgressSchema),
  asyncHandler(async (req, res) => {
    const { topicId } = req.params;
    const { completionPercentage, timeSpentMinutes, quizScore, completed } = req.body;

    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(topicId)) {
      return res.status(400).json({
        error: 'Invalid topic ID',
        message: 'Topic ID must be a valid UUID'
      });
    }

    // Get topic info to find subject
    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    const { data: topic, error: topicError } = await supabase
      .from('learning_topics')
      .select('id, subject_id, name')
      .eq('id', topicId)
      .eq('is_active', true)
      .single();

    if (topicError || !topic) {
      return res.status(404).json({
        error: 'Topic not found',
        message: 'The specified topic was not found'
      });
    }

    // Prepare progress data
    const progressData = {};

    if (completionPercentage !== undefined) {
      progressData.completion_percentage = completionPercentage;
    }

    if (timeSpentMinutes !== undefined) {
      progressData.time_spent_minutes = timeSpentMinutes;
    }

    if (completed !== undefined) {
      progressData.completion_percentage = completed ? 100 : progressData.completion_percentage;
      if (completed) {
        progressData.completed_at = new Date().toISOString();
      }
    }

    // Handle quiz scores
    if (quizScore !== undefined) {
      // Get existing progress to update quiz scores array
      const existingProgress = await getUserProgress(req.user.id, null, topicId);
      const existingQuizScores = existingProgress.length > 0 ? existingProgress[0].quiz_scores || [] : [];
      
      const newQuizScores = [...existingQuizScores, {
        score: quizScore,
        timestamp: new Date().toISOString()
      }];

      progressData.quiz_scores = newQuizScores;
      progressData.average_score = newQuizScores.reduce((sum, quiz) => sum + quiz.score, 0) / newQuizScores.length;
      progressData.attempts_count = newQuizScores.length;
    }

    // Update progress
    const updatedProgress = await updateUserProgress(req.user.id, topic.subject_id, topicId, progressData);

    // Update streak if time was spent
    if (timeSpentMinutes && timeSpentMinutes > 0) {
      await updateUserStreak(req.user.id, timeSpentMinutes);
    }

    // Invalidate relevant caches
    await require('../services/redis').deleteCache(`progress:${req.user.id}:all`);
    await require('../services/redis').deleteCache(`progress:${req.user.id}:${topic.subject_id}`);

    logger.info(`Progress updated for topic: ${topic.name}`, {
      userId: req.user.id,
      topicId,
      subjectId: topic.subject_id,
      updates: Object.keys(progressData)
    });

    res.json({
      message: 'Progress updated successfully',
      progress: updatedProgress
    });
  })
);

/**
 * Bulk update progress for multiple topics
 * PUT /api/progress/bulk
 */
router.put('/bulk',
  userRateLimit(20), // More restrictive for bulk operations
  validateRequest(bulkProgressSchema),
  asyncHandler(async (req, res) => {
    const { progressUpdates } = req.body;

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    const results = [];
    const errors = [];
    let totalTimeSpent = 0;

    // Process each update
    for (const update of progressUpdates) {
      try {
        const { subjectId, topicId, ...progressData } = update;

        // Verify topic exists and belongs to subject
        const { data: topic, error: topicError } = await supabase
          .from('learning_topics')
          .select('id, subject_id, name')
          .eq('id', topicId)
          .eq('subject_id', subjectId)
          .eq('is_active', true)
          .single();

        if (topicError || !topic) {
          errors.push({
            topicId,
            error: 'Topic not found or does not belong to specified subject'
          });
          continue;
        }

        // Update progress
        const updatedProgress = await updateUserProgress(req.user.id, subjectId, topicId, progressData);
        
        results.push({
          topicId,
          subjectId,
          success: true,
          progress: updatedProgress
        });

        // Accumulate time spent
        if (progressData.timeSpentMinutes) {
          totalTimeSpent += progressData.timeSpentMinutes;
        }

      } catch (error) {
        logger.error(`Bulk progress update error for topic ${update.topicId}:`, error);
        errors.push({
          topicId: update.topicId,
          error: error.message
        });
      }
    }

    // Update streak if any time was spent
    if (totalTimeSpent > 0) {
      await updateUserStreak(req.user.id, totalTimeSpent);
    }

    // Invalidate caches
    await require('../services/redis').deleteCache(`progress:${req.user.id}:all`);
    
    // Invalidate subject-specific caches
    const subjectIds = [...new Set(progressUpdates.map(u => u.subjectId))];
    for (const subjectId of subjectIds) {
      await require('../services/redis').deleteCache(`progress:${req.user.id}:${subjectId}`);
    }

    logger.info(`Bulk progress update completed`, {
      userId: req.user.id,
      successCount: results.length,
      errorCount: errors.length,
      totalTimeSpent
    });

    res.json({
      message: 'Bulk progress update completed',
      results,
      errors,
      summary: {
        totalUpdates: progressUpdates.length,
        successful: results.length,
        failed: errors.length,
        totalTimeSpent
      }
    });
  })
);

/**
 * Get learning analytics/insights
 * GET /api/progress/analytics
 */
router.get('/analytics',
  userRateLimit(50),
  asyncHandler(async (req, res) => {
    const { period = '30' } = req.query; // days
    const periodDays = parseInt(period);

    if (periodDays < 1 || periodDays > 365) {
      return res.status(400).json({
        error: 'Invalid period',
        message: 'Period must be between 1 and 365 days'
      });
    }

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - periodDays);

    // Get streak data for the period
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('streak_date', startDate.toISOString().split('T')[0])
      .lte('streak_date', endDate.toISOString().split('T')[0])
      .order('streak_date', { ascending: true });

    if (streakError) throw streakError;

    // Get progress data
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        *,
        learning_subjects:subject_id(name, difficulty_level),
        learning_topics:topic_id(name, difficulty_level)
      `)
      .eq('user_id', req.user.id)
      .gte('updated_at', startDate.toISOString());

    if (progressError) throw progressError;

    // Calculate analytics
    const analytics = {
      period: {
        days: periodDays,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      study: {
        totalMinutes: streakData.reduce((sum, day) => sum + day.minutes_studied, 0),
        averageMinutesPerDay: streakData.length > 0 
          ? streakData.reduce((sum, day) => sum + day.minutes_studied, 0) / streakData.length 
          : 0,
        activeDays: streakData.filter(day => day.minutes_studied > 0).length,
        goalsCompleted: streakData.filter(day => day.daily_goal_met).length,
        consistencyRate: streakData.length > 0 
          ? (streakData.filter(day => day.minutes_studied > 0).length / streakData.length * 100).toFixed(1)
          : 0
      },
      progress: {
        topicsStarted: progressData.length,
        topicsCompleted: progressData.filter(p => p.completion_percentage === 100).length,
        averageCompletion: progressData.length > 0
          ? (progressData.reduce((sum, p) => sum + p.completion_percentage, 0) / progressData.length).toFixed(1)
          : 0,
        averageScore: progressData.length > 0
          ? (progressData.reduce((sum, p) => sum + (p.average_score || 0), 0) / progressData.length).toFixed(1)
          : 0,
        byDifficulty: progressData.reduce((acc, progress) => {
          const difficulty = progress.learning_topics?.difficulty_level || 'unknown';
          if (!acc[difficulty]) {
            acc[difficulty] = { count: 0, avgCompletion: 0, avgScore: 0 };
          }
          acc[difficulty].count++;
          acc[difficulty].avgCompletion += progress.completion_percentage;
          acc[difficulty].avgScore += progress.average_score || 0;
          return acc;
        }, {}),
        dailyBreakdown: streakData.map(day => ({
          date: day.streak_date,
          minutesStudied: day.minutes_studied,
          goalMet: day.daily_goal_met,
          goalsCompleted: day.goals_completed
        }))
      }
    };

    // Calculate averages for difficulty breakdown
    Object.keys(analytics.progress.byDifficulty).forEach(difficulty => {
      const data = analytics.progress.byDifficulty[difficulty];
      data.avgCompletion = (data.avgCompletion / data.count).toFixed(1);
      data.avgScore = (data.avgScore / data.count).toFixed(1);
    });

    res.json({
      analytics
    });
  })
);

/**
 * Reset progress for a topic (admin only)
 * DELETE /api/progress/topics/:topicId
 */
router.delete('/topics/:topicId',
  userRateLimit(10),
  asyncHandler(async (req, res) => {
    const { topicId } = req.params;
    const { confirm } = req.query;

    if (confirm !== 'true') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Add ?confirm=true to confirm progress reset'
      });
    }

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', req.user.id)
      .eq('topic_id', topicId);

    if (error) throw error;

    // Invalidate caches
    await require('../services/redis').deleteCache(`progress:${req.user.id}:all`);

    logger.info(`Progress reset for topic: ${topicId}`, {
      userId: req.user.id,
      topicId
    });

    res.json({
      message: 'Progress reset successfully'
    });
  })
);

module.exports = router;
