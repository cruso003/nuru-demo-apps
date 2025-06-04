const express = require('express');
const router = express.Router();
const { getSupabaseAdmin } = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');
const { getCache, setCache } = require('../services/redis');

// Get personalized content recommendations for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    const userId = req.user.id;
    const cacheKey = `recommendations:${userId}:${type || 'all'}:${limit}`;
    
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    
    // Get user preferences and learning history
    const [userPrefs, userProgress] = await Promise.all([
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('user_progress')
        .select('lesson_id, completed_at, score')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(20)
    ]);

    const preferences = userPrefs.data || {};
    const completedLessons = userProgress.data || [];
    const completedLessonIds = completedLessons.map(p => p.lesson_id);

    // Generate recommendations based on user profile
    let query = supabase
      .from('content_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('recommendation_type', type);
    }

    const { data: existingRecommendations, error } = await query;

    if (error) {
      console.error('Error fetching recommendations:', error);
      return res.status(400).json({ error: error.message });
    }

    // If we don't have enough recommendations, generate new ones
    if (existingRecommendations.length < limit) {
      await generateRecommendations(userId, preferences, completedLessonIds, limit);
      
      // Fetch again after generation
      const { data: newRecommendations } = await query;
      const result = newRecommendations || existingRecommendations;
      
      // Cache for 1 hour
      await setCache(cacheKey, result, 3600);
      return res.json(result);
    }

    // Cache for 1 hour
    await setCache(cacheKey, existingRecommendations, 3600);
    res.json(existingRecommendations);
  } catch (error) {
    console.error('Error in GET /recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get next recommended lesson for user
router.get('/next-lesson', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `next_lesson:${userId}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    
    // Get user's current level and preferences
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('current_level')
      .eq('user_id', userId)
      .single();

    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get completed lessons
    const { data: completedLessons } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('completed', true);

    const completedLessonIds = completedLessons.map(p => p.lesson_id);
    const currentLevel = userProfile?.current_level || 'beginner';

    // Find next appropriate lesson
    let query = supabase
      .from('lessons')
      .select(`
        id,
        title,
        description,
        level,
        content_type,
        estimated_duration,
        lesson_activities(count)
      `)
      .eq('status', 'published')
      .eq('level', currentLevel)
      .order('created_at', { ascending: true })
      .limit(1);

    if (completedLessonIds.length > 0) {
      query = query.not('id', 'in', `(${completedLessonIds.join(',')})`);
    }

    // Apply user preferences
    if (userPrefs.data?.preferred_content_types?.length > 0) {
      query = query.in('content_type', userPrefs.data.preferred_content_types);
    }

    const { data: nextLesson, error } = await query;

    if (error) {
      console.error('Error finding next lesson:', error);
      return res.status(400).json({ error: error.message });
    }

    const result = nextLesson?.[0] || null;
    
    // Cache for 30 minutes
    await setCache(cacheKey, result, 1800);
    
    res.json(result);
  } catch (error) {
    console.error('Error in GET /recommendations/next-lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark recommendation as viewed/interacted with
router.post('/interaction', authMiddleware, async (req, res) => {
  try {
    const { recommendation_id, interaction_type, metadata = {} } = req.body;
    const userId = req.user.id;

    if (!recommendation_id || !interaction_type) {
      return res.status(400).json({
        error: 'Recommendation ID and interaction type are required'
      });
    }

    const supabase = getSupabaseAdmin();
    
    // Record the interaction
    const { data: interaction, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        content_type: 'recommendation',
        content_id: recommendation_id,
        interaction_type,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording interaction:', error);
      return res.status(400).json({ error: error.message });
    }

    // Update recommendation confidence based on interaction
    let confidenceAdjustment = 0;
    switch (interaction_type) {
      case 'clicked':
        confidenceAdjustment = 0.1;
        break;
      case 'dismissed':
        confidenceAdjustment = -0.2;
        break;
      case 'completed':
        confidenceAdjustment = 0.3;
        break;
      case 'liked':
        confidenceAdjustment = 0.2;
        break;
      case 'disliked':
        confidenceAdjustment = -0.3;
        break;
    }

    if (confidenceAdjustment !== 0) {
      await supabase
        .rpc('adjust_recommendation_confidence', {
          p_recommendation_id: recommendation_id,
          p_adjustment: confidenceAdjustment
        });
    }

    // Clear user's recommendation cache
    const userId_cache_pattern = `recommendations:${userId}:*`;
    // Note: In production, you'd want a more sophisticated cache invalidation
    await setCache(`next_lesson:${userId}`, null, 0);

    res.json({ 
      interaction, 
      message: 'Interaction recorded successfully' 
    });
  } catch (error) {
    console.error('Error in POST /recommendations/interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recommendation statistics for user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `recommendation_stats:${userId}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    
    // Get recommendation statistics
    const [recommendationCounts, interactionCounts] = await Promise.all([
      supabase
        .from('content_recommendations')
        .select('recommendation_type')
        .eq('user_id', userId),
      supabase
        .from('user_interactions')
        .select('interaction_type')
        .eq('user_id', userId)
        .eq('content_type', 'recommendation')
    ]);

    const recTypes = {};
    recommendationCounts.data?.forEach(({ recommendation_type }) => {
      recTypes[recommendation_type] = (recTypes[recommendation_type] || 0) + 1;
    });

    const interactions = {};
    interactionCounts.data?.forEach(({ interaction_type }) => {
      interactions[interaction_type] = (interactions[interaction_type] || 0) + 1;
    });

    const stats = {
      total_recommendations: recommendationCounts.data?.length || 0,
      recommendation_types: recTypes,
      total_interactions: interactionCounts.data?.length || 0,
      interaction_types: interactions,
      engagement_rate: recommendationCounts.data?.length > 0 ? 
        Math.round((interactionCounts.data?.length / recommendationCounts.data.length) * 100) : 0
    };

    // Cache for 1 hour
    await setCache(cacheKey, stats, 3600);
    
    res.json(stats);
  } catch (error) {
    console.error('Error in GET /recommendations/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh recommendations for user
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { force = false } = req.body;

    const supabase = getSupabaseAdmin();
    
    // If force refresh, delete existing recommendations
    if (force) {
      await supabase
        .from('content_recommendations')
        .delete()
        .eq('user_id', userId);
    }

    // Get user data for recommendation generation
    const [userPrefs, completedLessons] = await Promise.all([
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('completed', true)
    ]);

    const preferences = userPrefs.data || {};
    const completedLessonIds = completedLessons.data?.map(p => p.lesson_id) || [];

    // Generate new recommendations
    await generateRecommendations(userId, preferences, completedLessonIds, 20);

    // Clear caches
    const cacheKeys = [
      `recommendations:${userId}:*`,
      `next_lesson:${userId}`,
      `recommendation_stats:${userId}`
    ];
    for (const key of cacheKeys) {
      await setCache(key, null, 0);
    }

    res.json({ message: 'Recommendations refreshed successfully' });
  } catch (error) {
    console.error('Error in POST /recommendations/refresh:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate recommendations
async function generateRecommendations(userId, preferences, completedLessonIds, limit = 10) {
  const supabase = getSupabaseAdmin();

  try {
    // Get available lessons not yet completed
    let lessonQuery = supabase
      .from('lessons')
      .select(`
        id,
        title,
        level,
        content_type,
        estimated_duration,
        created_at
      `)
      .eq('status', 'published')
      .limit(limit * 2); // Get more to have options

    if (completedLessonIds.length > 0) {
      lessonQuery = lessonQuery.not('id', 'in', `(${completedLessonIds.join(',')})`);
    }

    const { data: availableLessons } = await lessonQuery;

    if (!availableLessons?.length) {
      return;
    }

    // Generate different types of recommendations
    const recommendations = [];

    // 1. Level-based recommendations
    const userLevel = preferences.current_level || 'beginner';
    const levelLessons = availableLessons
      .filter(lesson => lesson.level === userLevel)
      .slice(0, Math.ceil(limit * 0.4));

    levelLessons.forEach(lesson => {
      recommendations.push({
        user_id: userId,
        lesson_id: lesson.id,
        recommendation_type: 'level_based',
        confidence_score: 0.8,
        reasoning: `Matches your current level: ${userLevel}`
      });
    });

    // 2. Content type preferences
    if (preferences.preferred_content_types?.length > 0) {
      const preferredLessons = availableLessons
        .filter(lesson => 
          preferences.preferred_content_types.includes(lesson.content_type) &&
          !recommendations.find(r => r.lesson_id === lesson.id)
        )
        .slice(0, Math.ceil(limit * 0.3));

      preferredLessons.forEach(lesson => {
        recommendations.push({
          user_id: userId,
          lesson_id: lesson.id,
          recommendation_type: 'content_preference',
          confidence_score: 0.7,
          reasoning: `Matches your preferred content type: ${lesson.content_type}`
        });
      });
    }

    // 3. Recent/trending content
    const recentLessons = availableLessons
      .filter(lesson => !recommendations.find(r => r.lesson_id === lesson.id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, Math.ceil(limit * 0.3));

    recentLessons.forEach(lesson => {
      recommendations.push({
        user_id: userId,
        lesson_id: lesson.id,
        recommendation_type: 'trending',
        confidence_score: 0.6,
        reasoning: 'Recently added content'
      });
    });

    // Insert recommendations (take only the limit we need)
    if (recommendations.length > 0) {
      const finalRecommendations = recommendations.slice(0, limit);
      await supabase
        .from('content_recommendations')
        .insert(finalRecommendations);
    }

  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

module.exports = router;
