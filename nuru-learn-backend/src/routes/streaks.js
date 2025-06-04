const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getSupabaseAdmin } = require('../services/supabase');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const activityLogSchema = Joi.object({
  activityType: Joi.string().valid(
    'lesson_completed', 
    'exercise_completed', 
    'quiz_completed', 
    'ai_chat_session',
    'voice_practice',
    'reading_session',
    'streak_milestone'
  ).required(),
  subjectId: Joi.string().uuid().optional(),
  lessonId: Joi.string().uuid().optional(),
  duration: Joi.number().min(1).max(7200).optional(), // seconds, max 2 hours
  score: Joi.number().min(0).max(100).optional(),
  metadata: Joi.object().optional()
});

const streakUpdateSchema = Joi.object({
  activityDate: Joi.date().iso().default(() => new Date().toISOString()),
  activityType: Joi.string().required(),
  points: Joi.number().min(1).max(1000).default(10)
});

// Get user's current streak information
router.get('/current',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const supabase = getSupabaseAdmin();

    try {
      // Get current streak data
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (streakError && streakError.code !== 'PGRST116') { // Not found error is OK
        throw streakError;
      }

      // Get recent activity for streak calculation
      const { data: recentActivity, error: activityError } = await supabase
        .from('activity_logs')
        .select('activity_date, activity_type')
        .eq('user_id', userId)
        .gte('activity_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('activity_date', { ascending: false });

      if (activityError) {
        throw activityError;
      }

      // Calculate streak status
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const hasActivityToday = recentActivity.some(activity => 
        activity.activity_date.split('T')[0] === today
      );
      
      const hasActivityYesterday = recentActivity.some(activity => 
        activity.activity_date.split('T')[0] === yesterday
      );

      // Calculate consecutive days
      let consecutiveDays = 0;
      const activityDates = [...new Set(recentActivity.map(a => a.activity_date.split('T')[0]))].sort().reverse();
      
      if (hasActivityToday || hasActivityYesterday) {
        let checkDate = hasActivityToday ? today : yesterday;
        for (const date of activityDates) {
          if (date === checkDate) {
            consecutiveDays++;
            const nextDate = new Date(new Date(checkDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            checkDate = nextDate;
          } else {
            break;
          }
        }
      }

      const currentStreak = {
        currentStreak: consecutiveDays,
        longestStreak: streakData?.longest_streak || consecutiveDays,
        totalDays: streakData?.total_active_days || activityDates.length,
        lastActivityDate: recentActivity[0]?.activity_date || null,
        streakStatus: hasActivityToday ? 'active' : 
                     hasActivityYesterday ? 'at_risk' : 'broken',
        totalPoints: streakData?.total_points || 0,
        weeklyGoal: streakData?.weekly_goal || 7,
        monthlyGoal: streakData?.monthly_goal || 30
      };

      // Update streak data in database
      await supabase
        .from('user_streaks')
        .upsert({
          user_id: userId,
          current_streak: currentStreak.currentStreak,
          longest_streak: Math.max(currentStreak.longestStreak, consecutiveDays),
          total_active_days: currentStreak.totalDays,
          last_activity_date: currentStreak.lastActivityDate,
          total_points: currentStreak.totalPoints,
          weekly_goal: currentStreak.weeklyGoal,
          monthly_goal: currentStreak.monthlyGoal,
          updated_at: new Date().toISOString()
        });

      logger.info('Streak data retrieved', { userId, currentStreak: consecutiveDays });

      res.json({
        streak: currentStreak,
        recentActivity: recentActivity.slice(0, 7) // Last 7 days
      });

    } catch (error) {
      logger.error('Failed to get streak data', { error: error.message, userId });
      return res.status(500).json({
        error: 'Failed to retrieve streak data',
        message: error.message
      });
    }
  })
);

// Log user activity for streak tracking
router.post('/activity',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { error, value } = activityLogSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    const supabase = getSupabaseAdmin();

    try {
      // Calculate points based on activity type
      const pointsMap = {
        'lesson_completed': 50,
        'exercise_completed': 25,
        'quiz_completed': 75,
        'ai_chat_session': 15,
        'voice_practice': 30,
        'reading_session': 20,
        'streak_milestone': 100
      };

      const basePoints = pointsMap[value.activityType] || 10;
      const scoreMultiplier = value.score ? (value.score / 100) : 1;
      const durationBonus = value.duration ? Math.min(value.duration / 60, 30) : 0; // Max 30 bonus points
      const totalPoints = Math.round(basePoints * scoreMultiplier + durationBonus);

      // Log the activity
      const { data: activityLog, error: logError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          activity_type: value.activityType,
          subject_id: value.subjectId,
          lesson_id: value.lessonId,
          duration: value.duration,
          score: value.score,
          points_earned: totalPoints,
          metadata: value.metadata,
          activity_date: new Date().toISOString()
        })
        .select()
        .single();

      if (logError) {
        throw logError;
      }

      // Update user points in user_streaks table
      // First get current points from user_streaks
      const { data: currentStreak, error: getStreakError } = await supabase
        .from('user_streaks')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      let newTotalPoints = totalPoints;
      if (!getStreakError && currentStreak) {
        newTotalPoints = (currentStreak.total_points || 0) + totalPoints;
      }

      // Skip points update for now due to schema cache issues
      // TODO: Fix schema cache issue and re-enable points tracking
      logger.info('Skipping points update due to schema cache issue', { userId, totalPoints });

      // Check for achievements
      await checkForAchievements(supabase, userId, value.activityType, totalPoints);

      logger.info('Activity logged successfully', { 
        userId, 
        activityType: value.activityType, 
        pointsEarned: totalPoints 
      });

      res.json({
        success: true,
        activity: activityLog,
        pointsEarned: totalPoints,
        message: `Great job! You earned ${totalPoints} points for ${value.activityType.replace('_', ' ')}`
      });

    } catch (error) {
      logger.error('Failed to log activity', { error: error.message, userId });
      return res.status(500).json({
        error: 'Failed to log activity',
        message: error.message
      });
    }
  })
);

// Get streak history and analytics
router.get('/history',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const supabase = getSupabaseAdmin();
    const days = parseInt(req.query.days) || 30;

    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get activity history
      const { data: activities, error: activitiesError } = await supabase
        .from('activity_logs')
        .select('activity_date, activity_type, points_earned, duration, score')
        .eq('user_id', userId)
        .gte('activity_date', startDate)
        .order('activity_date', { ascending: false });

      if (activitiesError) {
        throw activitiesError;
      }

      // Group activities by date
      const dailyStats = {};
      activities.forEach(activity => {
        const date = activity.activity_date.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            totalPoints: 0,
            totalDuration: 0,
            activities: [],
            averageScore: 0,
            activityCount: 0
          };
        }
        
        dailyStats[date].totalPoints += activity.points_earned || 0;
        dailyStats[date].totalDuration += activity.duration || 0;
        dailyStats[date].activities.push(activity.activity_type);
        dailyStats[date].activityCount++;
        
        if (activity.score) {
          dailyStats[date].averageScore = (dailyStats[date].averageScore + activity.score) / 2;
        }
      });

      // Calculate weekly/monthly trends
      const sortedDates = Object.keys(dailyStats).sort();
      const weeklyTrends = calculateTrends(sortedDates, dailyStats, 7);
      const monthlyTrends = calculateTrends(sortedDates, dailyStats, 30);

      res.json({
        period: { days, startDate, endDate: new Date().toISOString() },
        dailyStats: Object.values(dailyStats).sort((a, b) => new Date(b.date) - new Date(a.date)),
        summary: {
          totalActivities: activities.length,
          totalPoints: activities.reduce((sum, a) => sum + (a.points_earned || 0), 0),
          totalDuration: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
          averageScore: activities.filter(a => a.score).reduce((sum, a, _, arr) => sum + a.score / arr.length, 0),
          activeDays: Object.keys(dailyStats).length,
          weeklyTrends,
          monthlyTrends
        }
      });

    } catch (error) {
      logger.error('Failed to get streak history', { error: error.message, userId });
      return res.status(500).json({
        error: 'Failed to retrieve streak history',
        message: error.message
      });
    }
  })
);

// Set user goals
router.put('/goals',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const goalsSchema = Joi.object({
      weeklyGoal: Joi.number().min(1).max(7).required(),
      monthlyGoal: Joi.number().min(1).max(31).required(),
      dailyPointsGoal: Joi.number().min(10).max(1000).optional(),
      preferredStudyTime: Joi.string().valid('morning', 'afternoon', 'evening', 'night').optional()
    });

    const { error, value } = goalsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    const supabase = getSupabaseAdmin();

    try {
      const { error: updateError } = await supabase
        .from('user_streaks')
        .upsert({
          user_id: userId,
          weekly_goal: value.weeklyGoal,
          monthly_goal: value.monthlyGoal,
          daily_points_goal: value.dailyPointsGoal,
          preferred_study_time: value.preferredStudyTime,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        throw updateError;
      }

      logger.info('User goals updated', { userId, goals: value });

      res.json({
        success: true,
        message: 'Goals updated successfully',
        goals: value
      });

    } catch (error) {
      logger.error('Failed to update goals', { error: error.message, userId });
      return res.status(500).json({
        error: 'Failed to update goals',
        message: error.message
      });
    }
  })
);

// Helper functions
function calculateTrends(dates, dailyStats, period) {
  if (dates.length < period) return { trend: 'insufficient_data', change: 0 };

  const recentPeriod = dates.slice(-period);
  const previousPeriod = dates.slice(-period * 2, -period);

  const recentAvg = recentPeriod.reduce((sum, date) => 
    sum + dailyStats[date].totalPoints, 0) / recentPeriod.length;
    
  const previousAvg = previousPeriod.length > 0 ? 
    previousPeriod.reduce((sum, date) => sum + dailyStats[date].totalPoints, 0) / previousPeriod.length : 0;

  const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  
  return {
    trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
    change: Math.round(change),
    recentAverage: Math.round(recentAvg),
    previousAverage: Math.round(previousAvg)
  };
}

async function checkForAchievements(supabase, userId, activityType, pointsEarned) {
  try {
    // Get user's current achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedAchievements = new Set(userAchievements?.map(a => a.achievement_id) || []);

    // Get user stats for achievement checking
    const { data: userStats } = await supabase
      .from('user_profiles')
      .select('total_points')
      .eq('user_id', userId)
      .single();

    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, total_active_days')
      .eq('user_id', userId)
      .single();

    // Define achievement criteria
    const achievementChecks = [
      {
        id: 'first_lesson',
        name: 'First Steps',
        description: 'Complete your first lesson',
        condition: activityType === 'lesson_completed' && !earnedAchievements.has('first_lesson')
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        condition: (streakData?.current_streak || 0) >= 7 && !earnedAchievements.has('streak_7')
      },
      {
        id: 'points_1000',
        name: 'Point Master',
        description: 'Earn 1000 total points',
        condition: (userStats?.total_points || 0) >= 1000 && !earnedAchievements.has('points_1000')
      },
      {
        id: 'active_30',
        name: 'Monthly Champion',
        description: 'Stay active for 30 days',
        condition: (streakData?.total_active_days || 0) >= 30 && !earnedAchievements.has('active_30')
      }
    ];

    // Award new achievements
    for (const achievement of achievementChecks) {
      if (achievement.condition) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            achievement_name: achievement.name,
            achievement_description: achievement.description,
            earned_at: new Date().toISOString()
          });

        logger.info('Achievement earned', { userId, achievementId: achievement.id });
      }
    }

  } catch (error) {
    logger.error('Failed to check achievements', { error: error.message, userId });
  }
}

module.exports = router;
