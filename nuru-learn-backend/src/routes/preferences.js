const express = require('express');
const router = express.Router();
const { getSupabaseAdmin } = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');
const { getCache, setCache } = require('../services/redis');

// Get user preferences
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `user_preferences:${userId}`;
    
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', error);
      return res.status(400).json({ error: error.message });
    }

    // If no preferences exist, return defaults matching the actual database schema
    const result = preferences || {
      user_id: userId,
      preferred_content_types: [],
      preferred_activity_types: [],
      difficulty_preference: 'beginner',
      cultural_interests: [],
      native_language: 'en',
      target_languages: ['kpe'],
      learning_style: null,
      study_time_preference: null,
      content_pace: null,
      font_size: 'medium',
      high_contrast: false,
      audio_speed: 1.0,
      subtitles_enabled: true,
      data_sharing_consent: true,
      analytics_consent: true,
      marketing_consent: false
    };

    // Cache for 1 hour
    await setCache(cacheKey, result, 3600);
    
    res.json(result);
  } catch (error) {
    console.error('Error in GET /preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Remove non-updatable fields
    delete updates.user_id;
    delete updates.created_at;

    const supabase = getSupabaseAdmin();
    
    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing preferences
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return res.status(400).json({ error: error.message });
      }
      result = preferences;
    } else {
      // Create new preferences
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...updates
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating preferences:', error);
        return res.status(400).json({ error: error.message });
      }
      result = preferences;
    }

    // Clear cache
    await setCache(`user_preferences:${userId}`, null, 0);
    
    // Clear recommendation caches since preferences changed
    await setCache(`recommendations:${userId}:*`, null, 0);
    await setCache(`next_lesson:${userId}`, null, 0);

    res.json({ preferences: result, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error in PUT /preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available preference options
router.get('/options', authMiddleware, async (req, res) => {
  try {
    const cacheKey = 'preference_options';
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    
    // Don't query lessons table for content_type since it doesn't exist
    // Use static options instead

    const options = {
      preferred_content_types: [
        'lesson',
        'exercise', 
        'quiz',
        'story',
        'vocabulary',
        'cultural_note',
        'media'
      ],
      preferred_activity_types: [
        'reading',
        'listening', 
        'speaking',
        'writing',
        'vocabulary',
        'grammar',
        'pronunciation',
        'cultural',
        'quiz',
        'exercise'
      ],
      difficulty_levels: [
        'beginner',
        'intermediate',
        'advanced'
      ],
      cultural_interests: [
        'traditional_stories',
        'music',
        'ceremonies',
        'food_culture',
        'family_traditions',
        'oral_history',
        'proverbs',
        'social_customs'
      ],
      learning_styles: [
        'visual',
        'auditory',
        'kinesthetic',
        'reading_writing'
      ],
      study_time_preferences: [
        'morning',
        'afternoon',
        'evening',
        'night'
      ],
      content_pace_options: [
        'slow',
        'normal',
        'fast'
      ],
      font_size_options: [
        'small',
        'medium',
        'large',
        'extra_large'
      ],
      languages: {
        native: [
          { code: 'en', name: 'English' },
          { code: 'kpe', name: 'Kpelle' }
        ],
        target: [
          { code: 'kpe', name: 'Kpelle' }
        ]
      }
    };

    // Cache for 24 hours
    await setCache(cacheKey, options, 86400);
    
    res.json(options);
  } catch (error) {
    console.error('Error in GET /preferences/options:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update specific preference category
router.patch('/:category', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;
    const updates = req.body;

    const validCategories = [
      'preferred_content_types',
      'preferred_activity_types', 
      'difficulty_preference',
      'cultural_interests',
      'native_language',
      'target_languages',
      'learning_style',
      'study_time_preference',
      'content_pace',
      'font_size',
      'high_contrast',
      'audio_speed',
      'subtitles_enabled',
      'data_sharing_consent',
      'analytics_consent',
      'marketing_consent'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const supabase = getSupabaseAdmin();
    
    // Get current preferences
    const { data: current } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const updateData = {};
    // Direct field updates for fields that match database schema
    if (validCategories.includes(category)) {
      updateData[category] = updates[category] || updates.value || updates;
    }

    let result;
    if (current) {
      // Update existing
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating preference category:', error);
        return res.status(400).json({ error: error.message });
      }
      result = preferences;
    } else {
      // Create new
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...updateData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating preferences:', error);
        return res.status(400).json({ error: error.message });
      }
      result = preferences;
    }

    // Clear caches
    await setCache(`user_preferences:${userId}`, null, 0);
    await setCache(`recommendations:${userId}:*`, null, 0);

    res.json({ 
      preferences: result, 
      message: `${category} preferences updated successfully` 
    });
  } catch (error) {
    console.error(`Error in PATCH /preferences/${req.params.category}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset preferences to defaults
router.post('/reset', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.body;

    const supabase = getSupabaseAdmin();

    if (category) {
      // Reset specific category
      const defaults = {
        learning_goals: [],
        preferred_difficulty: 'beginner',
        preferred_content_types: ['lesson', 'vocabulary'],
        daily_goal_minutes: 15,
        reminder_settings: {
          enabled: false,
          time: '18:00',
          frequency: 'daily'
        },
        language_settings: {
          interface_language: 'en',
          learning_language: 'kpelle'
        },
        accessibility_settings: {
          high_contrast: false,
          large_text: false,
          audio_descriptions: false
        },
        privacy_settings: {
          share_progress: false,
          public_profile: false
        }
      };

      const updateData = {};
      if (defaults.hasOwnProperty(category)) {
        updateData[category] = defaults[category];
      } else {
        return res.status(400).json({ error: 'Invalid category for reset' });
      }

      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error resetting preference category:', error);
        return res.status(400).json({ error: error.message });
      }

      // Clear cache
      await setCache(`user_preferences:${userId}`, null, 0);

      res.json({ 
        preferences, 
        message: `${category} preferences reset to defaults` 
      });
    } else {
      // Reset all preferences
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting all preferences:', error);
        return res.status(400).json({ error: error.message });
      }

      // Clear caches
      await setCache(`user_preferences:${userId}`, null, 0);
      await setCache(`recommendations:${userId}:*`, null, 0);

      res.json({ message: 'All preferences reset to defaults' });
    }
  } catch (error) {
    console.error('Error in POST /preferences/reset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
