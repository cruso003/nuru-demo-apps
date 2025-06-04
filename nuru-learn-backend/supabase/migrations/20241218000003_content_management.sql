-- Phase 4: Content Management & Personalization Migration
-- This migration adds comprehensive content management capabilities

-- Create content-related enums
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('lesson', 'exercise', 'quiz', 'story', 'vocabulary', 'cultural_note', 'media');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('reading', 'listening', 'speaking', 'writing', 'vocabulary', 'grammar', 'pronunciation', 'cultural', 'quiz', 'exercise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('draft', 'review', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recommendation_type AS ENUM ('similar_content', 'difficulty_progression', 'interest_based', 'completion_based', 'ai_generated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Lessons table - Core learning content
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Structured lesson content
    subject_id UUID REFERENCES learning_subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES learning_topics(id) ON DELETE CASCADE,
    
    -- Content metadata
    difficulty_level difficulty_level NOT NULL DEFAULT 'beginner',
    estimated_duration_minutes INTEGER DEFAULT 30,
    language_code TEXT DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    
    -- Content organization
    lesson_order INTEGER DEFAULT 0,
    prerequisites UUID[] DEFAULT '{}', -- Array of lesson IDs
    learning_objectives TEXT[] DEFAULT '{}',
    
    -- Publication status
    status content_status DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    
    -- AI generation metadata
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt_hash TEXT, -- For caching AI-generated content
    generation_parameters JSONB, -- Store AI generation parameters
    
    -- Cultural context for Kpelle language learning
    cultural_context JSONB, -- Cultural background, traditions, etc.
    kpelle_content JSONB, -- Kpelle language specific content
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_duration CHECK (estimated_duration_minutes > 0),
    CONSTRAINT valid_order CHECK (lesson_order >= 0),
    CONSTRAINT valid_version CHECK (version > 0)
);

-- Vocabulary database - Comprehensive Kpelle-English vocabulary
CREATE TABLE IF NOT EXISTS vocabulary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    kpelle_term TEXT NOT NULL,
    english_translation TEXT NOT NULL,
    pronunciation TEXT, -- IPA or phonetic representation
    pronunciation_audio_url TEXT, -- URL to audio file
    
    -- Linguistic information
    part_of_speech TEXT, -- noun, verb, adjective, etc.
    gender TEXT, -- for gendered languages
    plural_form TEXT,
    root_word TEXT,
    etymology TEXT,
    
    -- Usage and context
    usage_examples JSONB DEFAULT '[]', -- Array of example sentences
    cultural_context TEXT, -- Cultural significance or context
    difficulty_level difficulty_level DEFAULT 'beginner',
    frequency_rank INTEGER, -- How common the word is (1 = most common)
    
    -- Categorization
    category TEXT, -- family, food, colors, etc.
    tags TEXT[] DEFAULT '{}',
    related_words UUID[] DEFAULT '{}', -- Array of related vocabulary IDs
    
    -- Learning support
    memory_aids TEXT, -- Mnemonics or memory techniques
    common_mistakes TEXT, -- Common errors learners make
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_kpelle_english UNIQUE(kpelle_term, english_translation)
);

-- Cultural contexts - Rich cultural information for authentic learning
CREATE TABLE IF NOT EXISTS cultural_contexts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL, -- Rich structured content
    
    -- Context categorization
    context_type TEXT NOT NULL, -- tradition, ceremony, daily_life, history, etc.
    region TEXT, -- Geographic region
    time_period TEXT, -- Historical period or modern
    importance_level INTEGER DEFAULT 1, -- 1-5 scale
    
    -- Associated content
    related_vocabulary UUID[] DEFAULT '{}', -- Vocabulary IDs
    related_lessons UUID[] DEFAULT '{}', -- Lesson IDs
    
    -- Media assets
    images JSONB DEFAULT '[]', -- Array of image URLs and descriptions
    videos JSONB DEFAULT '[]', -- Array of video URLs and descriptions
    audio JSONB DEFAULT '[]', -- Array of audio URLs and descriptions
    
    -- Learning integration
    key_phrases JSONB DEFAULT '[]', -- Important phrases in context
    cultural_notes TEXT,
    sensitivity_notes TEXT, -- Cultural sensitivity guidelines
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Content versions - Track content changes and enable rollback
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID NOT NULL, -- Reference to lessons, vocabulary, etc.
    content_type content_type NOT NULL,
    version_number INTEGER NOT NULL,
    
    -- Version metadata
    changes_summary TEXT,
    change_reason TEXT,
    previous_content JSONB, -- Store previous version for rollback
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_content_version UNIQUE(content_id, content_type, version_number)
);

-- User preferences - Personalization data
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Learning preferences
    preferred_content_types content_type[] DEFAULT '{}',
    preferred_activity_types activity_type[] DEFAULT '{}',
    difficulty_preference difficulty_level DEFAULT 'beginner',
    
    -- Cultural and language preferences
    cultural_interests TEXT[] DEFAULT '{}',
    native_language TEXT DEFAULT 'en',
    target_languages TEXT[] DEFAULT '{"kpe"}', -- Kpelle by default
    
    -- Personalization data
    learning_style TEXT, -- visual, auditory, kinesthetic, etc.
    study_time_preference TEXT, -- morning, afternoon, evening
    content_pace TEXT, -- slow, normal, fast
    
    -- Accessibility preferences
    font_size TEXT DEFAULT 'medium',
    high_contrast BOOLEAN DEFAULT FALSE,
    audio_speed DECIMAL(3,2) DEFAULT 1.0,
    subtitles_enabled BOOLEAN DEFAULT TRUE,
    
    -- Privacy and notification preferences
    data_sharing_consent BOOLEAN DEFAULT TRUE,
    analytics_consent BOOLEAN DEFAULT TRUE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Lesson activities - Individual activities within lessons
CREATE TABLE IF NOT EXISTS lesson_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    
    -- Activity content
    title TEXT NOT NULL,
    description TEXT,
    activity_type activity_type NOT NULL,
    content JSONB NOT NULL, -- Activity-specific content structure
    
    -- Activity metadata
    activity_order INTEGER DEFAULT 0,
    estimated_duration_minutes INTEGER DEFAULT 5,
    points_value INTEGER DEFAULT 10,
    is_required BOOLEAN DEFAULT TRUE,
    
    -- Assessment data
    correct_answers JSONB, -- For quizzes and exercises
    assessment_criteria JSONB, -- Grading criteria
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_activity_order CHECK (activity_order >= 0),
    CONSTRAINT valid_duration CHECK (estimated_duration_minutes > 0),
    CONSTRAINT valid_points CHECK (points_value >= 0)
);

-- Content recommendations - AI-powered personalized recommendations
CREATE TABLE IF NOT EXISTS content_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID NOT NULL, -- Can reference lessons, vocabulary, etc.
    content_type content_type NOT NULL,
    
    -- Recommendation metadata
    recommendation_type recommendation_type NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    reasoning TEXT, -- Why this was recommended
    
    -- Recommendation context
    based_on_content UUID[], -- What content this recommendation is based on
    user_context JSONB, -- User state when recommendation was made
    
    -- Interaction tracking
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    clicked_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    rating INTEGER, -- User feedback 1-5
    
    -- Recommendation validity
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- User content interactions - Track how users interact with content
CREATE TABLE IF NOT EXISTS user_content_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID NOT NULL,
    content_type content_type NOT NULL,
    
    -- Interaction data
    interaction_type TEXT NOT NULL, -- view, start, complete, pause, resume, skip
    duration_seconds INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Context data
    device_type TEXT, -- mobile, tablet, desktop
    session_id UUID,
    referrer_content_id UUID, -- What led to this content
    
    -- Performance data
    score DECIMAL(5,2), -- For assessments
    attempts INTEGER DEFAULT 1,
    hints_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_progress CHECK (progress_percentage >= 0.0 AND progress_percentage <= 100.0),
    CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0.0 AND score <= 100.0)),
    CONSTRAINT valid_attempts CHECK (attempts > 0)
);

-- Content tags - Flexible tagging system
CREATE TABLE IF NOT EXISTS content_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT, -- Hex color for UI
    category TEXT, -- difficulty, topic, skill, etc.
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Content tag relationships - Many-to-many for content and tags
CREATE TABLE IF NOT EXISTS content_tag_relationships (
    content_id UUID NOT NULL,
    content_type content_type NOT NULL,
    tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    PRIMARY KEY (content_id, content_type, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_subject_topic ON lessons(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_ai_generated ON lessons(is_ai_generated);
CREATE INDEX IF NOT EXISTS idx_lessons_language ON lessons(language_code);
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON lessons USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_vocabulary_kpelle ON vocabulary(kpelle_term);
CREATE INDEX IF NOT EXISTS idx_vocabulary_english ON vocabulary(english_translation);
CREATE INDEX IF NOT EXISTS idx_vocabulary_difficulty ON vocabulary(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(category);
CREATE INDEX IF NOT EXISTS idx_vocabulary_frequency ON vocabulary(frequency_rank);
CREATE INDEX IF NOT EXISTS idx_vocabulary_tags ON vocabulary USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_cultural_contexts_type ON cultural_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_cultural_contexts_region ON cultural_contexts(region);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_activities_lesson ON lesson_activities(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_activities_type ON lesson_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lesson_activities_order ON lesson_activities(lesson_id, activity_order);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON content_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_content ON content_recommendations(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_active ON content_recommendations(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON content_recommendations(recommendation_type);

CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_content ON user_content_interactions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_content_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON user_content_interactions(session_id);

CREATE INDEX IF NOT EXISTS idx_content_tags_name ON content_tags(name);
CREATE INDEX IF NOT EXISTS idx_content_tags_category ON content_tags(category);

-- Enable RLS for content tables
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tag_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content access

-- Lessons: Public read for published content, authors can edit their own
CREATE POLICY "Anyone can view published lessons" ON lessons
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their lessons" ON lessons
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all lessons" ON lessons
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Vocabulary: Public read access
CREATE POLICY "Anyone can view vocabulary" ON vocabulary
    FOR SELECT TO authenticated;

CREATE POLICY "Admins and teachers can manage vocabulary" ON vocabulary
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Cultural contexts: Public read access
CREATE POLICY "Anyone can view cultural contexts" ON cultural_contexts
    FOR SELECT TO authenticated;

CREATE POLICY "Authors can manage their cultural contexts" ON cultural_contexts
    FOR ALL USING (created_by = auth.uid());

-- User preferences: Users can only access their own
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Lesson activities: Follow lesson permissions
CREATE POLICY "Anyone can view activities for published lessons" ON lesson_activities
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM lessons 
            WHERE id = lesson_activities.lesson_id AND status = 'published'
        )
    );

-- Content recommendations: Users can only see their own
CREATE POLICY "Users can view their own recommendations" ON content_recommendations
    FOR SELECT USING (user_id = auth.uid());

-- User interactions: Users can only access their own
CREATE POLICY "Users can manage their own interactions" ON user_content_interactions
    FOR ALL USING (user_id = auth.uid());

-- Content tags: Public read, admins can manage
CREATE POLICY "Anyone can view content tags" ON content_tags
    FOR SELECT TO authenticated;

CREATE POLICY "Admins can manage content tags" ON content_tags
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update triggers for timestamp management
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_updated_at
    BEFORE UPDATE ON vocabulary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultural_contexts_updated_at
    BEFORE UPDATE ON cultural_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_activities_updated_at
    BEFORE UPDATE ON lesson_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for content management

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE content_tags 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.tag_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE content_tags 
    SET usage_count = GREATEST(0, usage_count - 1) 
    WHERE id = OLD.tag_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tag usage tracking
CREATE TRIGGER tag_usage_increment
    AFTER INSERT ON content_tag_relationships
    FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

CREATE TRIGGER tag_usage_decrement
    AFTER DELETE ON content_tag_relationships
    FOR EACH ROW EXECUTE FUNCTION decrement_tag_usage();

-- Function to create user preferences on user creation
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_preferences_trigger
    AFTER INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_user_preferences();

-- Seed initial vocabulary data for Kpelle language learning
INSERT INTO vocabulary (kpelle_term, english_translation, pronunciation, part_of_speech, category, difficulty_level, frequency_rank, usage_examples) VALUES
('tɛnɛ', 'hello', '/tɛnɛ/', 'interjection', 'greetings', 'beginner', 1, '[{"kpelle": "Tɛnɛ, kɛ fe?", "english": "Hello, how are you?", "context": "casual greeting"}]'),
('kɛ fe', 'how are you', '/kɛ fe/', 'phrase', 'greetings', 'beginner', 2, '[{"kpelle": "Kɛ fe, meni?", "english": "How are you, friend?", "context": "asking about wellbeing"}]'),
('pɛlɛ', 'house', '/pɛlɛ/', 'noun', 'family', 'beginner', 3, '[{"kpelle": "A pɛlɛ bɛrɛ", "english": "His house is big", "context": "describing a home"}]'),
('nyawa', 'person', '/nyawa/', 'noun', 'people', 'beginner', 4, '[{"kpelle": "Nyawa mia", "english": "Good person", "context": "describing character"}]'),
('kɔlɔŋ', 'work', '/kɔlɔŋ/', 'noun', 'activities', 'beginner', 5, '[{"kpelle": "Kɔlɔŋ yɛ tɔ", "english": "Work is hard", "context": "talking about difficulty"}]'),
('meni', 'friend', '/meni/', 'noun', 'relationships', 'beginner', 6, '[{"kpelle": "Meni mia", "english": "Good friend", "context": "expressing friendship"}]'),
('bɛrɛ', 'big', '/bɛrɛ/', 'adjective', 'size', 'beginner', 7, '[{"kpelle": "Bɛrɛ pɛlɛ", "english": "Big house", "context": "describing size"}]'),
('mia', 'good', '/mia/', 'adjective', 'quality', 'beginner', 8, '[{"kpelle": "Mia turu", "english": "Good morning", "context": "morning greeting"}]'),
('turu', 'morning', '/turu/', 'noun', 'time', 'beginner', 9, '[{"kpelle": "Turu mia", "english": "Good morning", "context": "time-specific greeting"}]'),
('nua', 'come', '/nua/', 'verb', 'movement', 'beginner', 10, '[{"kpelle": "Nua la", "english": "Come here", "context": "inviting someone"}]');

-- Seed initial cultural contexts
INSERT INTO cultural_contexts (title, description, content, context_type, region, importance_level, cultural_notes) VALUES
('Traditional Kpelle Greetings', 'Understanding the importance of proper greetings in Kpelle culture', 
'{"overview": "Greetings are fundamental in Kpelle society and show respect", "practices": ["Always greet elders first", "Use appropriate time-specific greetings", "Include inquiries about family"], "significance": "Proper greetings establish social harmony and respect"}',
'daily_life', 'West Africa', 5, 'Greetings are not just politeness but essential social protocol that strengthens community bonds'),

('Extended Family Structure', 'The role of extended family in Kpelle society',
'{"overview": "Extended family includes multiple generations living together", "relationships": ["Elders provide wisdom and guidance", "Children are raised by the community", "Mutual support is expected"], "modern_changes": "Urban migration affects traditional structures"}',
'tradition', 'Liberia', 4, 'Understanding family structure is crucial for proper communication and relationship building'),

('Traditional Music and Storytelling', 'The oral tradition of preserving history and culture',
'{"instruments": ["Drums", "Rattles", "Flutes"], "story_types": ["Historical narratives", "Moral tales", "Ceremonial songs"], "learning_method": "Stories teach language, values, and history simultaneously"}',
'tradition', 'West Africa', 5, 'Oral tradition is the primary method of cultural transmission and language preservation');

-- Seed initial content tags
INSERT INTO content_tags (name, description, color, category) VALUES
('beginner', 'Suitable for beginning learners', '#4CAF50', 'difficulty'),
('intermediate', 'For learners with basic knowledge', '#FF9800', 'difficulty'),
('advanced', 'For experienced learners', '#F44336', 'difficulty'),
('vocabulary', 'Vocabulary building content', '#2196F3', 'skill'),
('grammar', 'Grammar and sentence structure', '#9C27B0', 'skill'),
('pronunciation', 'Speaking and pronunciation practice', '#FF5722', 'skill'),
('cultural', 'Cultural context and understanding', '#795548', 'skill'),
('daily-life', 'Everyday situations and conversations', '#607D8B', 'topic'),
('family', 'Family relationships and terminology', '#E91E63', 'topic'),
('greetings', 'Social greetings and politeness', '#00BCD4', 'topic'),
('traditional', 'Traditional customs and practices', '#8BC34A', 'topic'),
('modern', 'Contemporary usage and adaptations', '#FFC107', 'topic');

COMMENT ON TABLE lessons IS 'Core learning content with rich metadata and AI generation support';
COMMENT ON TABLE vocabulary IS 'Comprehensive Kpelle-English vocabulary database with cultural context';
COMMENT ON TABLE cultural_contexts IS 'Rich cultural information for authentic language learning';
COMMENT ON TABLE user_preferences IS 'User personalization settings for customized learning experience';
COMMENT ON TABLE content_recommendations IS 'AI-powered personalized content recommendations';
COMMENT ON TABLE user_content_interactions IS 'Detailed tracking of user engagement with content';
