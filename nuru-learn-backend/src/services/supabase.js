const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

let supabase = null;
let supabaseAdmin = null;

/**
 * Initialize Supabase clients
 */
async function initializeSupabase() {
  try {
    // Public client for general operations
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    
    // Admin client for server-side operations
    supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is fine for initial setup
      throw error;
    }

    logger.info('Supabase clients initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Supabase:', error);
    throw error;
  }
}

/**
 * Get the public Supabase client
 */
function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initializeSupabase() first.');
  }
  return supabase;
}

/**
 * Get the admin Supabase client
 */
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin not initialized. Call initializeSupabase() first.');
  }
  return supabaseAdmin;
}

/**
 * Create a new user profile
 */
async function createUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        ...profileData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile by ID
 */
async function getUserProfile(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Verify JWT token
 */
async function verifyToken(token) {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    logger.error('Error verifying token:', error);
    throw error;
  }
}

/**
 * Update user streak
 */
async function updateUserStreak(userId, studyMinutes) {
  try {
    const { error } = await supabaseAdmin.rpc('update_user_streak', {
      user_uuid: userId,
      study_minutes: studyMinutes
    });

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error updating user streak:', error);
    throw error;
  }
}

/**
 * Get learning subjects
 */
async function getLearningSubjects(isActive = true) {
  try {
    let query = supabaseAdmin.from('learning_subjects').select('*');
    
    if (isActive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('sort_order');
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching learning subjects:', error);
    throw error;
  }
}

/**
 * Get learning topics for a subject
 */
async function getLearningTopics(subjectId, isActive = true) {
  try {
    let query = supabaseAdmin
      .from('learning_topics')
      .select('*')
      .eq('subject_id', subjectId);
    
    if (isActive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('sort_order');
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching learning topics:', error);
    throw error;
  }
}

/**
 * Get user progress
 */
async function getUserProgress(userId, subjectId = null, topicId = null) {
  try {
    let query = supabaseAdmin
      .from('user_progress')
      .select(`
        *,
        learning_subjects:subject_id(name, description),
        learning_topics:topic_id(name, description)
      `)
      .eq('user_id', userId);
    
    if (subjectId) query = query.eq('subject_id', subjectId);
    if (topicId) query = query.eq('topic_id', topicId);
    
    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching user progress:', error);
    throw error;
  }
}

/**
 * Update user progress
 */
async function updateUserProgress(userId, subjectId, topicId, progressData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .upsert({
        user_id: userId,
        subject_id: subjectId,
        topic_id: topicId,
        ...progressData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating user progress:', error);
    throw error;
  }
}

module.exports = {
  initializeSupabase,
  getSupabase,
  getSupabaseAdmin,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  verifyToken,
  updateUserStreak,
  getLearningSubjects,
  getLearningTopics,
  getUserProgress,
  updateUserProgress
};
