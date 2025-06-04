-- Direct schema deployment for Nuru Learn
-- This script will deploy the complete database schema to Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Check if tables already exist and create them if they don't
DO $$
BEGIN
    -- Users table (extends Supabase auth.users)
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          avatar_url TEXT,
          proficiency_level TEXT DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
          preferred_subjects TEXT[] DEFAULT ARRAY['language-arts'],
          daily_goal_minutes INTEGER DEFAULT 30 CHECK (daily_goal_minutes > 0),
          settings JSONB DEFAULT '{"notifications": true, "soundEnabled": true, "theme": "system"}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- User progress tracking
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_progress') THEN
        CREATE TABLE user_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
          current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
          longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
          lessons_completed INTEGER DEFAULT 0 CHECK (lessons_completed >= 0),
          activities_completed INTEGER DEFAULT 0 CHECK (activities_completed >= 0),
          average_accuracy FLOAT DEFAULT 0 CHECK (average_accuracy >= 0 AND average_accuracy <= 100),
          time_spent_minutes INTEGER DEFAULT 0 CHECK (time_spent_minutes >= 0),
          level INTEGER DEFAULT 1 CHECK (level > 0),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );
    END IF;

    -- Daily progress tracking
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_progress') THEN
        CREATE TABLE daily_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          sessions_today INTEGER DEFAULT 0 CHECK (sessions_today >= 0),
          xp_today INTEGER DEFAULT 0 CHECK (xp_today >= 0),
          minutes_today INTEGER DEFAULT 0 CHECK (minutes_today >= 0),
          lessons_today INTEGER DEFAULT 0 CHECK (lessons_today >= 0),
          challenge_completed BOOLEAN DEFAULT FALSE,
          streak_maintained BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, date)
        );
    END IF;

    -- User achievements and badges
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        CREATE TABLE user_achievements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          achievement_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT DEFAULT 'trophy',
          xp_reward INTEGER DEFAULT 10 CHECK (xp_reward >= 0),
          earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Learning sessions
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'learning_sessions') THEN
        CREATE TABLE learning_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          subject TEXT NOT NULL,
          activity_type TEXT,
          duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
          accuracy FLOAT CHECK (accuracy >= 0 AND accuracy <= 100),
          xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
          questions_answered INTEGER DEFAULT 0 CHECK (questions_answered >= 0),
          correct_answers INTEGER DEFAULT 0 CHECK (correct_answers >= 0),
          lesson_data JSONB,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- AI response caching
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_response_cache') THEN
        CREATE TABLE ai_response_cache (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_hash TEXT UNIQUE NOT NULL,
          request_data JSONB NOT NULL,
          response_data JSONB NOT NULL,
          cache_category TEXT DEFAULT 'general',
          usage_count INTEGER DEFAULT 1 CHECK (usage_count > 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
        );
    END IF;

    -- Generated lessons library
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'generated_lessons') THEN
        CREATE TABLE generated_lessons (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          subject TEXT NOT NULL,
          difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
          estimated_duration INTEGER DEFAULT 20 CHECK (estimated_duration > 0),
          content JSONB NOT NULL,
          language TEXT DEFAULT 'kpe',
          created_by UUID REFERENCES users(id),
          usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
          rating FLOAT DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
          is_public BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    -- Performance indexes
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_progress_user_id') THEN
        CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_daily_progress_user_date') THEN
        CREATE INDEX idx_daily_progress_user_date ON daily_progress(user_id, date);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_daily_progress_date') THEN
        CREATE INDEX idx_daily_progress_date ON daily_progress(date);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_achievements_user_id') THEN
        CREATE INDEX idx_achievements_user_id ON user_achievements(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_achievements_type') THEN
        CREATE INDEX idx_achievements_type ON user_achievements(achievement_type);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_sessions_user_id') THEN
        CREATE INDEX idx_sessions_user_id ON learning_sessions(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_sessions_completed_at') THEN
        CREATE INDEX idx_sessions_completed_at ON learning_sessions(completed_at);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_sessions_subject') THEN
        CREATE INDEX idx_sessions_subject ON learning_sessions(subject);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_ai_cache_hash') THEN
        CREATE INDEX idx_ai_cache_hash ON ai_response_cache(request_hash);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_ai_cache_expires') THEN
        CREATE INDEX idx_ai_cache_expires ON ai_response_cache(expires_at);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_ai_cache_category') THEN
        CREATE INDEX idx_ai_cache_category ON ai_response_cache(cache_category);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_lessons_subject') THEN
        CREATE INDEX idx_lessons_subject ON generated_lessons(subject);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_lessons_difficulty') THEN
        CREATE INDEX idx_lessons_difficulty ON generated_lessons(difficulty_level);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_lessons_public') THEN
        CREATE INDEX idx_lessons_public ON generated_lessons(is_public);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can manage own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can manage own sessions" ON learning_sessions;
DROP POLICY IF EXISTS "Authenticated users can read cache" ON ai_response_cache;
DROP POLICY IF EXISTS "Authenticated users can write cache" ON ai_response_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON ai_response_cache;
DROP POLICY IF EXISTS "Users can view public lessons" ON generated_lessons;
DROP POLICY IF EXISTS "Users can create lessons" ON generated_lessons;
DROP POLICY IF EXISTS "Users can update own lessons" ON generated_lessons;

-- Create RLS policies
-- Users table policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Daily progress policies
CREATE POLICY "Users can manage own daily progress" ON daily_progress FOR ALL USING (auth.uid()::text = user_id::text);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

-- Learning sessions policies
CREATE POLICY "Users can manage own sessions" ON learning_sessions FOR ALL USING (auth.uid()::text = user_id::text);

-- Cache policies
CREATE POLICY "Authenticated users can read cache" ON ai_response_cache FOR SELECT TO authenticated;
CREATE POLICY "Authenticated users can write cache" ON ai_response_cache FOR INSERT TO authenticated;
CREATE POLICY "Authenticated users can update cache" ON ai_response_cache FOR UPDATE TO authenticated;

-- Generated lessons policies
CREATE POLICY "Users can view public lessons" ON generated_lessons FOR SELECT USING (is_public = true OR auth.uid()::text = created_by::text);
CREATE POLICY "Users can create lessons" ON generated_lessons FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);
CREATE POLICY "Users can update own lessons" ON generated_lessons FOR UPDATE USING (auth.uid()::text = created_by::text);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
DROP TRIGGER IF EXISTS create_user_progress_trigger ON users;

-- Create triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at 
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically create user progress when user is created
CREATE OR REPLACE FUNCTION create_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_progress (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_progress_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_progress();

-- Success message
SELECT 'Nuru Learn database schema deployed successfully!' as result;
