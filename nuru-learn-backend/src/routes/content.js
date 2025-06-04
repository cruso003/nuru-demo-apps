const express = require('express');
const router = express.Router();
const { getSupabaseAdmin } = require('../services/supabase');
const { authMiddleware } = require('../middleware/auth');
const { getCache, setCache } = require('../services/redis');

// Simple test endpoint to verify database connection
router.get('/test', authMiddleware, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (error) {
      console.error('Database test error:', error);
      return res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
    
    res.json({ 
      status: 'success', 
      message: 'Database connection working', 
      userExists: data && data.length > 0 
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get all lessons with pagination and filtering
router.get('/lessons', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      level, 
      status = 'published',
      search
    } = req.query;
    
    const offset = (page - 1) * limit;
    const cacheKey = `lessons:${JSON.stringify(req.query)}`;
    
    // Try to get from cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('lessons')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (level) {
      query = query.eq('difficulty_level', level);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: lessons, error } = await query;

    if (error) {
      console.error('Error fetching lessons:', error);
      return res.status(400).json({ error: error.message });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    const result = {
      lessons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };

    // Cache for 5 minutes
    await setCache(cacheKey, result, 300);
    
    res.json(result);
  } catch (error) {
    console.error('Error in GET /lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single lesson by ID
router.get('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `lesson:${id}`;
    
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(`
        *,
        lesson_activities(
          id,
          title,
          description,
          activity_type,
          content,
          activity_order,
          estimated_duration_minutes,
          points_value,
          is_required
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lesson:', error);
      return res.status(error.code === 'PGRST116' ? 404 : 400).json({ 
        error: error.code === 'PGRST116' ? 'Lesson not found' : error.message 
      });
    }

    // Cache for 10 minutes
    await setCache(cacheKey, lesson, 600);
    
    res.json(lesson);
  } catch (error) {
    console.error('Error in GET /lessons/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new lesson (AI-generated or manual)
router.post('/lessons', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      difficulty_level,
      estimated_duration_minutes,
      language_code,
      tags = [],
      subject_id,
      topic_id,
      learning_objectives = [],
      cultural_context,
      kpelle_content
    } = req.body;

    if (!title || !description || !difficulty_level) {
      return res.status(400).json({ 
        error: 'Title, description, and difficulty_level are required' 
      });
    }

    const supabase = getSupabaseAdmin();
    
    // Create lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        title,
        description,
        content,
        difficulty_level,
        estimated_duration_minutes,
        language_code: language_code || 'en',
        tags: tags,
        subject_id,
        topic_id,
        learning_objectives,
        cultural_context,
        kpelle_content,
        created_by: req.user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (lessonError) {
      console.error('Error creating lesson:', lessonError);
      return res.status(400).json({ error: lessonError.message });
    }

    // Clear lessons cache
    const cacheKeys = await getCache('cache_keys:lessons') || [];
    for (const key of cacheKeys) {
      await setCache(key, null, 0); // Delete cache
    }

    res.status(201).json({ lesson, message: 'Lesson created successfully' });
  } catch (error) {
    console.error('Error in POST /lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lesson
router.put('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove non-updatable fields
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;

    const supabase = getSupabaseAdmin();
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson:', error);
      return res.status(error.code === 'PGRST116' ? 404 : 400).json({ 
        error: error.code === 'PGRST116' ? 'Lesson not found' : error.message 
      });
    }

    // Clear caches
    await setCache(`lesson:${id}`, null, 0);
    
    res.json({ lesson, message: 'Lesson updated successfully' });
  } catch (error) {
    console.error('Error in PUT /lessons/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete lesson
router.delete('/lessons/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lesson:', error);
      return res.status(400).json({ error: error.message });
    }

    // Clear caches
    await setCache(`lesson:${id}`, null, 0);
    
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /lessons/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cultural contexts
router.get('/cultural-contexts', authMiddleware, async (req, res) => {
  try {
    const { category, search } = req.query;
    const cacheKey = `cultural_contexts:${JSON.stringify(req.query)}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('cultural_contexts')
      .select('*')
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: contexts, error } = await query;

    if (error) {
      console.error('Error fetching cultural contexts:', error);
      return res.status(400).json({ error: error.message });
    }

    // Cache for 15 minutes
    await setCache(cacheKey, contexts, 900);
    
    res.json(contexts);
  } catch (error) {
    console.error('Error in GET /cultural-contexts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content tags
router.get('/tags', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    const cacheKey = `tags:${category || 'all'}`;
    
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('tags')
      .select('*')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: tags, error } = await query;

    if (error) {
      console.error('Error fetching tags:', error);
      return res.status(400).json({ error: error.message });
    }

    // Cache for 30 minutes
    await setCache(cacheKey, tags, 1800);
    
    res.json(tags);
  } catch (error) {
    console.error('Error in GET /tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
