const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getSupabaseAdmin } = require('../services/supabase');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's achievements
router.get('/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const supabase = getSupabaseAdmin();

    try {
      // Get user's earned achievements
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (achievementsError) {
        throw achievementsError;
      }

      // Get all available achievements for comparison
      const allAchievements = [
        {
          id: 'first_lesson',
          name: 'First Steps',
          description: 'Complete your first lesson',
          category: 'getting_started',
          points: 50,
          rarity: 'common'
        },
        {
          id: 'first_quiz',
          name: 'Quiz Master',
          description: 'Complete your first quiz',
          category: 'assessment',
          points: 75,
          rarity: 'common'
        },
        {
          id: 'streak_3',
          name: 'Getting Consistent',
          description: 'Maintain a 3-day learning streak',
          category: 'consistency',
          points: 100,
          rarity: 'common'
        },
        {
          id: 'streak_7',
          name: 'Week Warrior',
          description: 'Maintain a 7-day learning streak',
          category: 'consistency',
          points: 250,
          rarity: 'uncommon'
        },
        {
          id: 'streak_30',
          name: 'Monthly Champion',
          description: 'Maintain a 30-day learning streak',
          category: 'consistency',
          points: 1000,
          rarity: 'rare'
        },
        {
          id: 'points_100',
          name: 'Point Collector',
          description: 'Earn 100 total points',
          category: 'points',
          points: 50,
          rarity: 'common'
        },
        {
          id: 'points_1000',
          name: 'Point Master',
          description: 'Earn 1000 total points',
          category: 'points',
          points: 200,
          rarity: 'uncommon'
        },
        {
          id: 'points_10000',
          name: 'Point Legend',
          description: 'Earn 10,000 total points',
          category: 'points',
          points: 500,
          rarity: 'legendary'
        },
        {
          id: 'voice_practice_10',
          name: 'Voice Virtuoso',
          description: 'Complete 10 voice practice sessions',
          category: 'skills',
          points: 300,
          rarity: 'uncommon'
        },
        {
          id: 'ai_chat_100',
          name: 'AI Conversationalist',
          description: 'Have 100 AI chat sessions',
          category: 'engagement',
          points: 400,
          rarity: 'rare'
        },
        {
          id: 'perfect_score',
          name: 'Perfectionist',
          description: 'Get a perfect score on any assessment',
          category: 'excellence',
          points: 150,
          rarity: 'uncommon'
        },
        {
          id: 'early_bird',
          name: 'Early Bird',
          description: 'Complete 10 morning study sessions',
          category: 'habits',
          points: 200,
          rarity: 'uncommon'
        },
        {
          id: 'night_owl',
          name: 'Night Owl',
          description: 'Complete 10 evening study sessions',
          category: 'habits',
          points: 200,
          rarity: 'uncommon'
        },
        {
          id: 'marathon_session',
          name: 'Marathon Learner',
          description: 'Study for 2 hours in a single session',
          category: 'dedication',
          points: 300,
          rarity: 'rare'
        },
        {
          id: 'subject_master_math',
          name: 'Math Master',
          description: 'Complete 20 math lessons',
          category: 'expertise',
          points: 500,
          rarity: 'rare'
        },
        {
          id: 'subject_master_science',
          name: 'Science Scholar',
          description: 'Complete 20 science lessons',
          category: 'expertise',
          points: 500,
          rarity: 'rare'
        }
      ];

      const earnedIds = new Set(userAchievements.map(a => a.achievement_id));
      
      const achievementsWithStatus = allAchievements.map(achievement => ({
        ...achievement,
        earned: earnedIds.has(achievement.id),
        earnedAt: userAchievements.find(ua => ua.achievement_id === achievement.id)?.earned_at || null
      }));

      // Calculate achievement stats
      const stats = {
        totalAchievements: allAchievements.length,
        earnedAchievements: userAchievements.length,
        completionPercentage: Math.round((userAchievements.length / allAchievements.length) * 100),
        totalAchievementPoints: userAchievements.reduce((sum, a) => {
          const achievement = allAchievements.find(aa => aa.id === a.achievement_id);
          return sum + (achievement?.points || 0);
        }, 0),
        categoryCounts: {}
      };

      // Count achievements by category
      allAchievements.forEach(achievement => {
        const category = achievement.category;
        if (!stats.categoryCounts[category]) {
          stats.categoryCounts[category] = { total: 0, earned: 0 };
        }
        stats.categoryCounts[category].total++;
        if (earnedIds.has(achievement.id)) {
          stats.categoryCounts[category].earned++;
        }
      });

      res.json({
        achievements: achievementsWithStatus,
        stats,
        recentAchievements: userAchievements.slice(0, 5)
      });

    } catch (error) {
      logger.error('Failed to get achievements', { error: error.message, userId });
      return res.status(500).json({
        error: 'Failed to retrieve achievements',
        message: error.message
      });
    }
  })
);

// Get achievements by category
router.get('/category/:category',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const category = req.params.category;
    const supabase = getSupabaseAdmin();

    try {
      // Get user's earned achievements
      const { data: userAchievements, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Filter achievements by category
      const categoryAchievements = allAchievements.filter(a => a.category === category);
      const earnedIds = new Set(userAchievements.map(a => a.achievement_id));

      const achievementsWithStatus = categoryAchievements.map(achievement => ({
        ...achievement,
        earned: earnedIds.has(achievement.id),
        earnedAt: userAchievements.find(ua => ua.achievement_id === achievement.id)?.earned_at || null
      }));

      res.json({
        category,
        achievements: achievementsWithStatus,
        progress: {
          earned: achievementsWithStatus.filter(a => a.earned).length,
          total: categoryAchievements.length
        }
      });

    } catch (error) {
      logger.error('Failed to get category achievements', { error: error.message, userId, category });
      return res.status(500).json({
        error: 'Failed to retrieve category achievements',
        message: error.message
      });
    }
  })
);

// Get achievement leaderboard
router.get('/leaderboard',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseAdmin();
    const timeframe = req.query.timeframe || 'all_time'; // all_time, monthly, weekly

    try {
      let dateFilter = '';
      
      switch (timeframe) {
        case 'weekly':
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'monthly':
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          dateFilter = '1970-01-01T00:00:00.000Z';
      }

      // Get achievement counts per user
      let query = supabase
        .from('user_achievements')
        .select(`
          user_id,
          count(*),
          user_profiles!inner(
            user_id,
            display_name,
            avatar_url
          )
        `)
        .gte('earned_at', dateFilter);

      const { data: leaderboardData, error } = await query;

      if (error) {
        throw error;
      }

      // Format leaderboard data
      const leaderboard = leaderboardData
        .map(entry => ({
          userId: entry.user_id,
          displayName: entry.user_profiles.display_name || 'Anonymous',
          avatarUrl: entry.user_profiles.avatar_url,
          achievementCount: entry.count,
          rank: 0 // Will be set below
        }))
        .sort((a, b) => b.achievementCount - a.achievementCount)
        .slice(0, 50) // Top 50
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));

      res.json({
        timeframe,
        leaderboard,
        userRank: leaderboard.find(entry => entry.userId === req.user.id)?.rank || null
      });

    } catch (error) {
      logger.error('Failed to get achievement leaderboard', { error: error.message });
      return res.status(500).json({
        error: 'Failed to retrieve leaderboard',
        message: error.message
      });
    }
  })
);

// Check and award achievements (internal endpoint, called by other services)
router.post('/check',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const checkSchema = Joi.object({
      achievementIds: Joi.array().items(Joi.string()).required(),
      metadata: Joi.object().optional()
    });

    const { error, value } = checkSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }

    const userId = req.user.id;
    const supabase = getSupabaseAdmin();

    try {
      // Get user's current achievements
      const { data: currentAchievements, error: currentError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (currentError) {
        throw currentError;
      }

      const earnedIds = new Set(currentAchievements.map(a => a.achievement_id));
      const newAchievements = [];

      // Check each achievement
      for (const achievementId of value.achievementIds) {
        if (!earnedIds.has(achievementId)) {
          const achievement = allAchievements.find(a => a.id === achievementId);
          if (achievement) {
            // Award the achievement
            const { data: newAchievement, error: awardError } = await supabase
              .from('user_achievements')
              .insert({
                user_id: userId,
                achievement_id: achievementId,
                achievement_name: achievement.name,
                achievement_description: achievement.description,
                earned_at: new Date().toISOString(),
                metadata: value.metadata
              })
              .select()
              .single();

            if (!awardError) {
              newAchievements.push({
                ...achievement,
                earnedAt: newAchievement.earned_at
              });

              // Award points for the achievement
              await supabase
                .from('user_profiles')
                .update({
                  total_points: supabase.raw('total_points + ?', [achievement.points])
                })
                .eq('user_id', userId);

              logger.info('Achievement awarded', { userId, achievementId, points: achievement.points });
            }
          }
        }
      }

      res.json({
        newAchievements,
        totalAwarded: newAchievements.length,
        message: newAchievements.length > 0 ? 
          `Congratulations! You earned ${newAchievements.length} new achievement${newAchievements.length > 1 ? 's' : ''}!` :
          'No new achievements at this time.'
      });

    } catch (error) {
      logger.error('Failed to check achievements', { error: error.message, userId });
      return res.status(500).json({
        error: 'Failed to check achievements',
        message: error.message
      });
    }
  })
);

// Achievement definitions (could be moved to database)
const allAchievements = [
  {
    id: 'first_lesson',
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'getting_started',
    points: 50,
    rarity: 'common'
  },
  {
    id: 'first_quiz',
    name: 'Quiz Master',
    description: 'Complete your first quiz',
    category: 'assessment',
    points: 75,
    rarity: 'common'
  },
  {
    id: 'streak_3',
    name: 'Getting Consistent',
    description: 'Maintain a 3-day learning streak',
    category: 'consistency',
    points: 100,
    rarity: 'common'
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    category: 'consistency',
    points: 250,
    rarity: 'uncommon'
  },
  {
    id: 'streak_30',
    name: 'Monthly Champion',
    description: 'Maintain a 30-day learning streak',
    category: 'consistency',
    points: 1000,
    rarity: 'rare'
  },
  {
    id: 'points_100',
    name: 'Point Collector',
    description: 'Earn 100 total points',
    category: 'points',
    points: 50,
    rarity: 'common'
  },
  {
    id: 'points_1000',
    name: 'Point Master',
    description: 'Earn 1000 total points',
    category: 'points',
    points: 200,
    rarity: 'uncommon'
  },
  {
    id: 'points_10000',
    name: 'Point Legend',
    description: 'Earn 10,000 total points',
    category: 'points',
    points: 500,
    rarity: 'legendary'
  }
];

module.exports = router;
