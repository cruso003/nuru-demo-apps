-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'trial', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    subscription_status subscription_status DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    
    -- Learning preferences
    daily_goal_minutes INTEGER DEFAULT 30,
    difficulty_preference difficulty_level DEFAULT 'beginner',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "streak_reminders": true}',
    
    -- Progress tracking
    total_study_time_minutes INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_active_date DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_username CHECK (username ~* '^[a-zA-Z0-9_]{3,20}$'),
    CONSTRAINT valid_daily_goal CHECK (daily_goal_minutes > 0 AND daily_goal_minutes <= 480)
);

-- User sessions table for enhanced session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning subjects table
CREATE TABLE IF NOT EXISTS learning_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    color_hex TEXT DEFAULT '#3B82F6',
    difficulty_level difficulty_level DEFAULT 'beginner',
    estimated_hours INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning topics table
CREATE TABLE IF NOT EXISTS learning_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subject_id UUID REFERENCES learning_subjects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level difficulty_level DEFAULT 'beginner',
    estimated_minutes INTEGER DEFAULT 30,
    prerequisites JSONB DEFAULT '[]', -- Array of topic IDs
    learning_objectives JSONB DEFAULT '[]', -- Array of learning goals
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(subject_id, name)
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES learning_subjects(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES learning_topics(id) ON DELETE CASCADE,
    
    -- Progress metrics
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Performance tracking
    quiz_scores JSONB DEFAULT '[]', -- Array of quiz results
    average_score DECIMAL(5,2) DEFAULT 0.00,
    attempts_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, subject_id, topic_id),
    CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    CONSTRAINT valid_score CHECK (average_score >= 0 AND average_score <= 100)
);

-- User streak tracking
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    streak_date DATE NOT NULL,
    minutes_studied INTEGER DEFAULT 0,
    goals_completed INTEGER DEFAULT 0,
    daily_goal_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, streak_date),
    CONSTRAINT valid_minutes CHECK (minutes_studied >= 0),
    CONSTRAINT valid_goals CHECK (goals_completed >= 0)
);

-- AI cache table for smart caching (70-90% cost reduction)
CREATE TABLE IF NOT EXISTS ai_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    prompt_hash TEXT NOT NULL, -- SHA-256 hash of the prompt
    response_data JSONB NOT NULL,
    model_name TEXT NOT NULL,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    
    -- Cache metadata
    hit_count INTEGER DEFAULT 1,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(identifier, endpoint, window_start)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- Create RLS (Row Level Security) policies

-- User profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User sessions RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- User progress RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id);

-- User streaks RLS
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
    FOR ALL USING (auth.uid() = user_id);

-- Public read access for learning content
ALTER TABLE learning_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subjects" ON learning_subjects
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view active topics" ON learning_topics
    FOR SELECT USING (is_active = TRUE);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_subjects_updated_at
    BEFORE UPDATE ON learning_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_topics_updated_at
    BEFORE UPDATE ON learning_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID, study_minutes INTEGER)
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    current_streak INTEGER := 0;
    yesterday_record RECORD;
    today_record RECORD;
BEGIN
    -- Get today's record
    SELECT * INTO today_record FROM user_streaks 
    WHERE user_id = user_uuid AND streak_date = today_date;
    
    -- Update or insert today's record
    IF today_record IS NULL THEN
        INSERT INTO user_streaks (user_id, streak_date, minutes_studied, daily_goal_met)
        VALUES (user_uuid, today_date, study_minutes, 
                study_minutes >= (SELECT daily_goal_minutes FROM user_profiles WHERE id = user_uuid));
    ELSE
        UPDATE user_streaks 
        SET minutes_studied = minutes_studied + study_minutes,
            daily_goal_met = (minutes_studied + study_minutes) >= 
                           (SELECT daily_goal_minutes FROM user_profiles WHERE id = user_uuid)
        WHERE user_id = user_uuid AND streak_date = today_date;
    END IF;
    
    -- Calculate current streak
    SELECT COUNT(*) INTO current_streak
    FROM user_streaks 
    WHERE user_id = user_uuid 
    AND daily_goal_met = TRUE 
    AND streak_date >= (
        SELECT COALESCE(MAX(streak_date), today_date) 
        FROM user_streaks 
        WHERE user_id = user_uuid 
        AND daily_goal_met = FALSE 
        AND streak_date < today_date
    );
    
    -- Update user profile with streak information
    UPDATE user_profiles 
    SET current_streak_days = current_streak,
        longest_streak_days = GREATEST(longest_streak_days, current_streak),
        last_active_date = today_date,
        total_study_time_minutes = total_study_time_minutes + study_minutes
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Seed some initial learning subjects
INSERT INTO learning_subjects (name, description, icon_url, difficulty_level, estimated_hours) VALUES
('Programming Fundamentals', 'Learn the basics of programming with hands-on exercises', '/icons/code.svg', 'beginner', 40),
('Mathematics', 'Essential math concepts for everyday problem solving', '/icons/math.svg', 'beginner', 30),
('Language Learning', 'Master new languages with interactive lessons', '/icons/language.svg', 'beginner', 60),
('Science Concepts', 'Explore fascinating scientific principles', '/icons/science.svg', 'intermediate', 50),
('Critical Thinking', 'Develop analytical and logical reasoning skills', '/icons/brain.svg', 'intermediate', 25);

-- Insert topics for Programming Fundamentals
INSERT INTO learning_topics (subject_id, name, description, difficulty_level, estimated_minutes) 
SELECT 
    s.id,
    topic_name,
    topic_description,
    'beginner'::difficulty_level,
    topic_minutes
FROM learning_subjects s,
    (VALUES 
        ('Variables and Data Types', 'Understanding how to store and manipulate data', 45),
        ('Control Structures', 'Learning loops, conditionals, and program flow', 60),
        ('Functions and Methods', 'Creating reusable code blocks', 50),
        ('Arrays and Lists', 'Working with collections of data', 40),
        ('Object-Oriented Programming', 'Introduction to classes and objects', 75)
    ) AS topics(topic_name, topic_description, topic_minutes)
WHERE s.name = 'Programming Fundamentals';

COMMENT ON TABLE user_profiles IS 'Extended user profiles with learning preferences and progress tracking';
COMMENT ON TABLE ai_cache IS 'Smart caching for AI responses to reduce costs by 70-90%';
COMMENT ON TABLE user_streaks IS 'Daily learning streak tracking for gamification';
COMMENT ON TABLE rate_limits IS 'API rate limiting to prevent abuse and manage costs';
