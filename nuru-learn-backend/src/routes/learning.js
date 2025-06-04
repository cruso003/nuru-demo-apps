const express = require('express');
const Joi = require('joi');
const { getLearningSubjects, getLearningTopics } = require('../services/supabase');
const { optionalAuth, requireRole, validateRequest, userRateLimit } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { setCache, getCache } = require('../services/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const createSubjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  iconUrl: Joi.string().uri().optional(),
  colorHex: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  difficultyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
  estimatedHours: Joi.number().min(1).max(1000).optional(),
  sortOrder: Joi.number().min(0).optional()
});

const createTopicSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  difficultyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
  estimatedMinutes: Joi.number().min(5).max(480).default(30),
  prerequisites: Joi.array().items(Joi.string().uuid()).default([]),
  learningObjectives: Joi.array().items(Joi.string()).default([]),
  sortOrder: Joi.number().min(0).optional()
});

/**
 * Get all learning subjects
 * GET /api/learning/subjects
 */
router.get('/subjects',
  optionalAuth, // Optional auth to potentially customize content
  userRateLimit(200),
  asyncHandler(async (req, res) => {
    // Check cache first
    const cacheKey = 'learning:subjects:active';
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        subjects: cached,
        cached: true
      });
    }

    const subjects = await getLearningSubjects(true);

    // Cache for 1 hour
    await setCache(cacheKey, subjects, 60 * 60);

    res.json({
      subjects,
      cached: false
    });
  })
);

/**
 * Get learning topics for a subject
 * GET /api/learning/subjects/:subjectId/topics
 */
router.get('/subjects/:subjectId/topics',
  optionalAuth,
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

    // Check cache first
    const cacheKey = `learning:topics:${subjectId}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        topics: cached,
        cached: true
      });
    }

    const topics = await getLearningTopics(subjectId, true);

    if (topics.length === 0) {
      return res.status(404).json({
        error: 'Subject not found',
        message: 'No topics found for the specified subject'
      });
    }

    // Cache for 30 minutes
    await setCache(cacheKey, topics, 30 * 60);

    res.json({
      topics,
      cached: false
    });
  })
);

/**
 * Get a specific topic
 * GET /api/learning/topics/:topicId
 */
router.get('/topics/:topicId',
  optionalAuth,
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

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    // Check cache first
    const cacheKey = `learning:topic:${topicId}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        topic: cached,
        cached: true
      });
    }

    const { data: topic, error } = await supabase
      .from('learning_topics')
      .select(`
        *,
        learning_subjects:subject_id(id, name, description, difficulty_level)
      `)
      .eq('id', topicId)
      .eq('is_active', true)
      .single();

    if (error || !topic) {
      return res.status(404).json({
        error: 'Topic not found',
        message: 'The specified topic was not found'
      });
    }

    // Cache for 30 minutes
    await setCache(cacheKey, topic, 30 * 60);

    res.json({
      topic,
      cached: false
    });
  })
);

/**
 * Search learning content
 * GET /api/learning/search
 */
router.get('/search',
  optionalAuth,
  userRateLimit(100),
  asyncHandler(async (req, res) => {
    const { q: query, difficulty, subject } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    // Search in both subjects and topics
    const searchTerm = `%${query.trim()}%`;
    
    // Search subjects
    let subjectQuery = supabase
      .from('learning_subjects')
      .select('id, name, description, difficulty_level, estimated_hours')
      .eq('is_active', true)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);

    if (difficulty) {
      subjectQuery = subjectQuery.eq('difficulty_level', difficulty);
    }

    const { data: subjects, error: subjectError } = await subjectQuery;
    if (subjectError) throw subjectError;

    // Search topics
    let topicQuery = supabase
      .from('learning_topics')
      .select(`
        id, name, description, difficulty_level, estimated_minutes,
        learning_subjects:subject_id(id, name)
      `)
      .eq('is_active', true)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);

    if (difficulty) {
      topicQuery = topicQuery.eq('difficulty_level', difficulty);
    }

    if (subject) {
      topicQuery = topicQuery.eq('subject_id', subject);
    }

    const { data: topics, error: topicError } = await topicQuery;
    if (topicError) throw topicError;

    const results = {
      query: query.trim(),
      subjects: subjects || [],
      topics: topics || [],
      total: (subjects?.length || 0) + (topics?.length || 0)
    };

    res.json(results);
  })
);

/**
 * Admin: Create new subject
 * POST /api/learning/subjects
 */
router.post('/subjects',
  requireRole(['admin', 'teacher']),
  validateRequest(createSubjectSchema),
  userRateLimit(20),
  asyncHandler(async (req, res) => {
    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    const { data: subject, error } = await supabase
      .from('learning_subjects')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Subject already exists',
          message: 'A subject with this name already exists'
        });
      }
      throw error;
    }

    // Invalidate cache
    await require('../services/redis').deleteCache('learning:subjects:active');

    logger.info(`New subject created: ${subject.name}`, { 
      subjectId: subject.id,
      createdBy: req.user.id 
    });

    res.status(201).json({
      message: 'Subject created successfully',
      subject
    });
  })
);

/**
 * Admin: Create new topic
 * POST /api/learning/subjects/:subjectId/topics
 */
router.post('/subjects/:subjectId/topics',
  requireRole(['admin', 'teacher']),
  validateRequest(createTopicSchema),
  userRateLimit(50),
  asyncHandler(async (req, res) => {
    const { subjectId } = req.params;

    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(subjectId)) {
      return res.status(400).json({
        error: 'Invalid subject ID',
        message: 'Subject ID must be a valid UUID'
      });
    }

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    // Verify subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('learning_subjects')
      .select('id')
      .eq('id', subjectId)
      .eq('is_active', true)
      .single();

    if (subjectError || !subject) {
      return res.status(404).json({
        error: 'Subject not found',
        message: 'The specified subject was not found'
      });
    }

    const topicData = {
      ...req.body,
      subject_id: subjectId
    };

    const { data: topic, error } = await supabase
      .from('learning_topics')
      .insert(topicData)
      .select(`
        *,
        learning_subjects:subject_id(name, description)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Topic already exists',
          message: 'A topic with this name already exists in this subject'
        });
      }
      throw error;
    }

    // Invalidate cache
    await require('../services/redis').deleteCache(`learning:topics:${subjectId}`);

    logger.info(`New topic created: ${topic.name}`, { 
      topicId: topic.id,
      subjectId,
      createdBy: req.user.id 
    });

    res.status(201).json({
      message: 'Topic created successfully',
      topic
    });
  })
);

/**
 * Admin: Update subject
 * PUT /api/learning/subjects/:subjectId
 */
router.put('/subjects/:subjectId',
  requireRole(['admin', 'teacher']),
  validateRequest(createSubjectSchema.fork(['name'], (schema) => schema.optional())),
  userRateLimit(20),
  asyncHandler(async (req, res) => {
    const { subjectId } = req.params;

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    const { data: subject, error } = await supabase
      .from('learning_subjects')
      .update(req.body)
      .eq('id', subjectId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Subject not found',
          message: 'The specified subject was not found'
        });
      }
      throw error;
    }

    // Invalidate caches
    await require('../services/redis').deleteCache('learning:subjects:active');
    await require('../services/redis').deleteCache(`learning:topics:${subjectId}`);

    logger.info(`Subject updated: ${subject.name}`, { 
      subjectId,
      updatedBy: req.user.id 
    });

    res.json({
      message: 'Subject updated successfully',
      subject
    });
  })
);

/**
 * Admin: Deactivate subject
 * DELETE /api/learning/subjects/:subjectId
 */
router.delete('/subjects/:subjectId',
  requireRole(['admin']),
  userRateLimit(10),
  asyncHandler(async (req, res) => {
    const { subjectId } = req.params;

    const { getSupabaseAdmin } = require('../services/supabase');
    const supabase = getSupabaseAdmin();

    // Soft delete by setting is_active to false
    const { data: subject, error } = await supabase
      .from('learning_subjects')
      .update({ is_active: false })
      .eq('id', subjectId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Subject not found',
          message: 'The specified subject was not found'
        });
      }
      throw error;
    }

    // Invalidate caches
    await require('../services/redis').deleteCache('learning:subjects:active');
    await require('../services/redis').deleteCache(`learning:topics:${subjectId}`);

    logger.info(`Subject deactivated: ${subject.name}`, { 
      subjectId,
      deactivatedBy: req.user.id 
    });

    res.json({
      message: 'Subject deactivated successfully'
    });
  })
);

module.exports = router;
