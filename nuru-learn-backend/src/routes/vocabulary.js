const express = require('express');
const router = express.Router();
const { getSupabaseAdmin } = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');
const { getCache, setCache } = require('../services/redis');

// Get all vocabulary with pagination and filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      category,
      difficulty_level 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const cacheKey = `vocabulary:${JSON.stringify(req.query)}`;
    
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('vocabulary')
      .select('*')
      .order('kpelle_term')
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`kpelle_term.ilike.%${search}%,english_translation.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (difficulty_level) {
      query = query.eq('difficulty_level', difficulty_level);
    }

    const { data: vocabulary, error } = await query;

    if (error) {
      console.error('Error fetching vocabulary:', error);
      return res.status(400).json({ error: error.message });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('vocabulary')
      .select('*', { count: 'exact', head: true });

    const result = {
      vocabulary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };

    // Cache for 10 minutes
    await setCache(cacheKey, result, 600);
    
    res.json(result);
  } catch (error) {
    console.error('Error in GET /vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single vocabulary word by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `vocabulary:${id}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    const { data: word, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching vocabulary word:', error);
      return res.status(error.code === 'PGRST116' ? 404 : 400).json({ 
        error: error.code === 'PGRST116' ? 'Vocabulary word not found' : error.message 
      });
    }

    // Cache for 15 minutes
    await setCache(cacheKey, word, 900);
    
    res.json(word);
  } catch (error) {
    console.error('Error in GET /vocabulary/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search vocabulary with advanced filters
router.get('/search/advanced', authMiddleware, async (req, res) => {
  try {
    const { 
      q, 
      category, 
      difficulty_level,
      has_audio = false,
      has_cultural_context = false,
      limit = 50 
    } = req.query;
    
    const cacheKey = `vocabulary_search:${JSON.stringify(req.query)}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('vocabulary')
      .select('*')
      .limit(limit);

    // Text search
    if (q) {
      query = query.or(`kpelle_term.ilike.%${q}%,english_translation.ilike.%${q}%,cultural_context.ilike.%${q}%`);
    }
    
    // Category filter
    if (category) {
      query = query.eq('category', category);
    }
    
    // Difficulty level filter
    if (difficulty_level) {
      query = query.eq('difficulty_level', difficulty_level);
    }
    
    // Audio filter
    if (has_audio === 'true') {
      query = query.not('audio_url', 'is', null);
    }
    
    // Cultural context filter
    if (has_cultural_context === 'true') {
      query = query.not('cultural_context', 'is', null);
    }

    const { data: results, error } = await query;

    if (error) {
      console.error('Error searching vocabulary:', error);
      return res.status(400).json({ error: error.message });
    }

    // Cache for 5 minutes
    await setCache(cacheKey, results, 300);
    
    res.json(results);
  } catch (error) {
    console.error('Error in GET /vocabulary/search/advanced:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vocabulary categories
router.get('/meta/categories', authMiddleware, async (req, res) => {
  try {
    const cacheKey = 'vocabulary_categories';
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    const { data: categories, error } = await supabase
      .from('vocabulary')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching vocabulary categories:', error);
      return res.status(400).json({ error: error.message });
    }

    // Get unique categories with counts
    const categoryStats = {};
    categories.forEach(({ category }) => {
      if (category) {
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      }
    });

    const result = Object.entries(categoryStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Cache for 1 hour
    await setCache(cacheKey, result, 3600);
    
    res.json(result);
  } catch (error) {
    console.error('Error in GET /vocabulary/meta/categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new vocabulary word
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      kpelle_term,
      english_translation,
      pronunciation,
      part_of_speech,
      category,
      difficulty_level,
      example_kpelle,
      example_english,
      cultural_context,
      audio_url,
      image_url
    } = req.body;

    if (!kpelle_term || !english_translation) {
      return res.status(400).json({ 
        error: 'Kpelle word and English translation are required' 
      });
    }

    const supabase = getSupabaseAdmin();
    
    const { data: word, error } = await supabase
      .from('vocabulary')
      .insert({
        kpelle_term,
        english_translation,
        pronunciation,
        part_of_speech,
        category,
        difficulty_level: difficulty_level || 'beginner',
        example_kpelle,
        example_english,
        cultural_context,
        audio_url,
        image_url
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vocabulary word:', error);
      return res.status(400).json({ error: error.message });
    }

    // Clear relevant caches
    await setCache('vocabulary_categories', null, 0);
    
    res.status(201).json({ word, message: 'Vocabulary word created successfully' });
  } catch (error) {
    console.error('Error in POST /vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vocabulary word
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove non-updatable fields
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;

    const supabase = getSupabaseAdmin();
    
    const { data: word, error } = await supabase
      .from('vocabulary')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vocabulary word:', error);
      return res.status(error.code === 'PGRST116' ? 404 : 400).json({ 
        error: error.code === 'PGRST116' ? 'Vocabulary word not found' : error.message 
      });
    }

    // Clear caches
    await setCache(`vocabulary:${id}`, null, 0);
    
    res.json({ word, message: 'Vocabulary word updated successfully' });
  } catch (error) {
    console.error('Error in PUT /vocabulary/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vocabulary word
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vocabulary word:', error);
      return res.status(400).json({ error: error.message });
    }

    // Clear caches
    await setCache(`vocabulary:${id}`, null, 0);
    
    res.json({ message: 'Vocabulary word deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /vocabulary/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vocabulary statistics
router.get('/meta/stats', authMiddleware, async (req, res) => {
  try {
    const cacheKey = 'vocabulary_stats';
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    
    // Get total count
    const { count: totalWords } = await supabase
      .from('vocabulary')
      .select('*', { count: 'exact', head: true });

    // Get counts by difficulty level
    const { data: difficultyStats } = await supabase
      .from('vocabulary')
      .select('difficulty_level')
      .not('difficulty_level', 'is', null);

    const difficultyLevels = {};
    difficultyStats.forEach(({ difficulty_level }) => {
      difficultyLevels[difficulty_level] = (difficultyLevels[difficulty_level] || 0) + 1;
    });

    // Get counts with audio/images
    const { count: wordsWithAudio } = await supabase
      .from('vocabulary')
      .select('*', { count: 'exact', head: true })
      .not('audio_url', 'is', null);

    const { count: wordsWithImages } = await supabase
      .from('vocabulary')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null);

    const { count: wordsWithCulturalContext } = await supabase
      .from('vocabulary')
      .select('*', { count: 'exact', head: true })
      .not('cultural_context', 'is', null);

    const stats = {
      total_words: totalWords,
      difficulty_levels: difficultyLevels,
      words_with_audio: wordsWithAudio,
      words_with_images: wordsWithImages,
      words_with_cultural_context: wordsWithCulturalContext,
      completion_percentage: {
        audio: totalWords ? Math.round((wordsWithAudio / totalWords) * 100) : 0,
        images: totalWords ? Math.round((wordsWithImages / totalWords) * 100) : 0,
        cultural_context: totalWords ? Math.round((wordsWithCulturalContext / totalWords) * 100) : 0
      }
    };

    // Cache for 30 minutes
    await setCache(cacheKey, stats, 1800);
    
    res.json(stats);
  } catch (error) {
    console.error('Error in GET /vocabulary/meta/stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
