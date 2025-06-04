-- Add tables for comprehensive user progress tracking, streaks, and achievements

-- Activity logs table for tracking all user learning activities
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'lesson_completed', 'exercise_completed', 'quiz_completed', 
        'ai_chat_session', 'voice_practice', 'reading_session', 'streak_milestone'
    )),
    subject_name VARCHAR(100), -- Store subject name instead of foreign key
    lesson_name VARCHAR(255), -- Store lesson name instead of foreign key
    content_id VARCHAR(100), -- Generic content identifier
    duration INTEGER, -- in seconds
    score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
    points_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    activity_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User streaks table for tracking learning consistency
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_active_days INTEGER DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    total_points INTEGER DEFAULT 0,
    weekly_goal INTEGER DEFAULT 7,
    monthly_goal INTEGER DEFAULT 30,
    daily_points_goal INTEGER DEFAULT 100,
    preferred_study_time VARCHAR(20) CHECK (preferred_study_time IN ('morning', 'afternoon', 'evening', 'night')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements table for gamification
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_id)
);

-- Learning analytics table for detailed progress tracking
CREATE TABLE IF NOT EXISTS learning_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_study_time INTEGER DEFAULT 0, -- in seconds
    lessons_completed INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    points_earned INTEGER DEFAULT 0,
    ai_interactions INTEGER DEFAULT 0,
    voice_sessions INTEGER DEFAULT 0,
    subjects_studied JSONB DEFAULT '[]', -- array of subject IDs
    difficulty_levels JSONB DEFAULT '{}', -- difficulty distribution
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- User goals table for personalized learning targets
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
        'daily_streak', 'weekly_lessons', 'monthly_points', 'subject_mastery', 'skill_improvement'
    )),
    goal_name VARCHAR(255) NOT NULL,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study sessions table for detailed session tracking
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    total_duration INTEGER, -- calculated field in seconds
    activities_completed INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    subjects_covered JSONB DEFAULT '[]',
    session_type VARCHAR(50), -- focused, mixed, review, etc.
    completion_status VARCHAR(20) DEFAULT 'active' CHECK (completion_status IN ('active', 'completed', 'interrupted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_date ON learning_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_status ON user_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_start ON study_sessions(user_id, session_start DESC);

-- RLS (Row Level Security) policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view own analytics" ON learning_analytics;
DROP POLICY IF EXISTS "System can manage analytics" ON learning_analytics;
DROP POLICY IF EXISTS "Users can manage own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can manage own sessions" ON study_sessions;

-- Activity logs policies
CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User streaks policies
CREATE POLICY "Users can view own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
    FOR ALL USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON user_achievements
    FOR INSERT WITH CHECK (true); -- System handles validation

-- Learning analytics policies
CREATE POLICY "Users can view own analytics" ON learning_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage analytics" ON learning_analytics
    FOR ALL USING (auth.uid() = user_id);

-- User goals policies
CREATE POLICY "Users can manage own goals" ON user_goals
    FOR ALL USING (auth.uid() = user_id);

-- Study sessions policies
CREATE POLICY "Users can manage own sessions" ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Triggers for automatic updates

-- Update user_streaks.updated_at on changes
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streaks_updated_at();

-- Update learning_analytics.updated_at on changes
CREATE OR REPLACE FUNCTION update_learning_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_learning_analytics_updated_at
    BEFORE UPDATE ON learning_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_analytics_updated_at();

-- Auto-update daily analytics when activity is logged
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO learning_analytics (
        user_id, 
        date, 
        total_study_time,
        lessons_completed,
        exercises_completed,
        quizzes_completed,
        points_earned,
        ai_interactions,
        voice_sessions
    )
    VALUES (
        NEW.user_id,
        NEW.activity_date::date,
        COALESCE(NEW.duration, 0),
        CASE WHEN NEW.activity_type = 'lesson_completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.activity_type = 'exercise_completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.activity_type = 'quiz_completed' THEN 1 ELSE 0 END,
        COALESCE(NEW.points_earned, 0),
        CASE WHEN NEW.activity_type = 'ai_chat_session' THEN 1 ELSE 0 END,
        CASE WHEN NEW.activity_type = 'voice_practice' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_study_time = learning_analytics.total_study_time + COALESCE(NEW.duration, 0),
        lessons_completed = learning_analytics.lessons_completed + 
            CASE WHEN NEW.activity_type = 'lesson_completed' THEN 1 ELSE 0 END,
        exercises_completed = learning_analytics.exercises_completed + 
            CASE WHEN NEW.activity_type = 'exercise_completed' THEN 1 ELSE 0 END,
        quizzes_completed = learning_analytics.quizzes_completed + 
            CASE WHEN NEW.activity_type = 'quiz_completed' THEN 1 ELSE 0 END,
        points_earned = learning_analytics.points_earned + COALESCE(NEW.points_earned, 0),
        ai_interactions = learning_analytics.ai_interactions + 
            CASE WHEN NEW.activity_type = 'ai_chat_session' THEN 1 ELSE 0 END,
        voice_sessions = learning_analytics.voice_sessions + 
            CASE WHEN NEW.activity_type = 'voice_practice' THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_analytics
    AFTER INSERT ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_analytics();
