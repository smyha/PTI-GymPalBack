-- ============================================================================
-- GYMPAL COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This migration creates the complete database schema for GymPal
-- Based on the ER diagram and optimized architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MAIN USER PROFILES TABLE (Optimized - No Duplication with Supabase Auth)
-- ============================================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS post_reposts CASCADE;
DROP TABLE IF EXISTS post_shares CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS shared_workouts CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS user_dietary_preferences CASCADE;
DROP TABLE IF EXISTS user_fitness_profile CASCADE;
DROP TABLE IF EXISTS user_personal_info CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (main user table - references auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    fitness_level VARCHAR(20) DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DETAILED PERSONAL INFORMATION
-- ============================================================================

-- User personal information
CREATE TABLE user_personal_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    age INTEGER CHECK (age >= 13 AND age <= 120),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg <= 500),
    height_cm INTEGER CHECK (height_cm > 0 AND height_cm <= 300),
    bmi DECIMAL(4,2) GENERATED ALWAYS AS (weight_kg / ((height_cm/100.0) * (height_cm/100.0))) STORED,
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User fitness profile
CREATE TABLE user_fitness_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    experience_level VARCHAR(20) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    primary_goal VARCHAR(50) NOT NULL,
    secondary_goals TEXT[] DEFAULT '{}',
    workout_frequency INTEGER CHECK (workout_frequency >= 1 AND workout_frequency <= 7),
    preferred_workout_duration INTEGER CHECK (preferred_workout_duration > 0 AND preferred_workout_duration <= 300),
    available_equipment TEXT[] DEFAULT '{}',
    workout_preferences JSONB DEFAULT '{}',
    injury_history TEXT[] DEFAULT '{}',
    medical_restrictions TEXT[] DEFAULT '{}',
    fitness_goals_timeline TEXT,
    motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User dietary preferences
CREATE TABLE user_dietary_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    preferred_cuisines TEXT[] DEFAULT '{}',
    disliked_foods TEXT[] DEFAULT '{}',
    daily_calorie_target INTEGER CHECK (daily_calorie_target > 0 AND daily_calorie_target <= 10000),
    protein_target_percentage DECIMAL(4,2) CHECK (protein_target_percentage >= 0 AND protein_target_percentage <= 100),
    carb_target_percentage DECIMAL(4,2) CHECK (carb_target_percentage >= 0 AND carb_target_percentage <= 100),
    fat_target_percentage DECIMAL(4,2) CHECK (fat_target_percentage >= 0 AND fat_target_percentage <= 100),
    meal_preferences TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats (historical data)
CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    height_cm DECIMAL(5,2) CHECK (height_cm > 0 AND height_cm <= 300),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg <= 500),
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    target_weight_kg DECIMAL(5,2) CHECK (target_weight_kg > 0 AND target_weight_kg <= 500),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXERCISES AND WORKOUTS
-- ============================================================================

-- Exercises (global exercise library)
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    muscle_group VARCHAR(50) NOT NULL,
    muscle_groups TEXT[] DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    instructions TEXT,
    video_url TEXT,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts (user-created workout routines)
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 300),
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    target_goal VARCHAR(100),
    target_level VARCHAR(20),
    days_per_week INTEGER CHECK (days_per_week >= 1 AND days_per_week <= 7),
    equipment_required TEXT[] DEFAULT '{}',
    user_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    share_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout exercises (junction table)
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    sets INTEGER CHECK (sets > 0 AND sets <= 50),
    reps INTEGER CHECK (reps > 0 AND reps <= 1000),
    weight_kg DECIMAL(5,2) CHECK (weight_kg >= 0 AND weight_kg <= 1000),
    rest_seconds INTEGER CHECK (rest_seconds >= 0 AND rest_seconds <= 600),
    notes TEXT
);

-- Workout sessions (actual workout executions)
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 300),
    calories_burned INTEGER CHECK (calories_burned >= 0 AND calories_burned <= 10000),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shared workouts
CREATE TABLE shared_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SOCIAL FEATURES
-- ============================================================================

-- Posts (social media posts)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type VARCHAR(20) DEFAULT 'general' CHECK (post_type IN ('achievement', 'routine', 'tip', 'progress', 'motivation', 'question', 'general')),
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    image_urls TEXT[] DEFAULT '{}',
    video_url TEXT,
    hashtags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    is_original BOOLEAN DEFAULT true,
    original_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    shared_from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Post comments
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post shares
CREATE TABLE post_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    share_type VARCHAR(20) DEFAULT 'share' CHECK (share_type IN ('share', 'repost', 'forward')),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post reposts
CREATE TABLE post_reposts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reposted_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reposted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(original_post_id, reposted_by_user_id)
);

-- ============================================================================
-- FOLLOW SYSTEM
-- ============================================================================

-- Follows (user following system)
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- ============================================================================
-- USER CONFIGURATION
-- ============================================================================

-- User settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    workout_reminders BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    profile_visibility BOOLEAN DEFAULT true,
    workout_visibility BOOLEAN DEFAULT true,
    progress_visibility BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_profiles_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_fitness_level ON profiles(fitness_level);

-- User personal info indexes
CREATE INDEX idx_user_personal_info_user_id ON user_personal_info(user_id);
CREATE INDEX idx_user_personal_info_bmi ON user_personal_info(bmi);

-- User fitness profile indexes
CREATE INDEX idx_user_fitness_profile_user_id ON user_fitness_profile(user_id);
CREATE INDEX idx_user_fitness_profile_goal ON user_fitness_profile(primary_goal);

-- User dietary preferences indexes
CREATE INDEX idx_user_dietary_preferences_user_id ON user_dietary_preferences(user_id);

-- User stats indexes
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_user_stats_recorded_at ON user_stats(recorded_at);

-- Exercises indexes
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_public ON exercises(is_public) WHERE is_public = true;
CREATE INDEX idx_exercises_created_by ON exercises(created_by);

-- Workouts indexes
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_public ON workouts(is_public) WHERE is_public = true;
CREATE INDEX idx_workouts_difficulty ON workouts(difficulty);
CREATE INDEX idx_workouts_type ON workouts(type);

-- Workout exercises indexes
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX idx_workout_exercises_order ON workout_exercises(workout_id, order_index);

-- Workout sessions indexes
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_workout_id ON workout_sessions(workout_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at);

-- Shared workouts indexes
CREATE INDEX idx_shared_workouts_original ON shared_workouts(original_workout_id);
CREATE INDEX idx_shared_workouts_shared_by ON shared_workouts(shared_by_user_id);
CREATE INDEX idx_shared_workouts_shared_with ON shared_workouts(shared_with_user_id);

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_public ON posts(is_public) WHERE is_public = true;
CREATE INDEX idx_posts_type ON posts(post_type);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_workout_id ON posts(workout_id) WHERE workout_id IS NOT NULL;

-- Post likes indexes
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);

-- Post comments indexes
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_parent ON post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Post shares indexes
CREATE INDEX idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX idx_post_shares_shared_by ON post_shares(shared_by_user_id);
CREATE INDEX idx_post_shares_shared_with ON post_shares(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;

-- Post reposts indexes
CREATE INDEX idx_post_reposts_original ON post_reposts(original_post_id);
CREATE INDEX idx_post_reposts_reposted_by ON post_reposts(reposted_by_user_id);

-- Follows indexes
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- User settings indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_personal_info_updated_at BEFORE UPDATE ON user_personal_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_fitness_profile_updated_at BEFORE UPDATE ON user_fitness_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_dietary_preferences_updated_at BEFORE UPDATE ON user_dietary_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user profile with auth data
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  username VARCHAR(50),
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender VARCHAR(20),
  fitness_level VARCHAR(20),
  timezone VARCHAR(50),
  language VARCHAR(10),
  is_active BOOLEAN,
  preferences JSONB,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.date_of_birth,
    p.gender,
    p.fitness_level,
    p.timezone,
    p.language,
    p.is_active,
    p.preferences,
    p.social_links,
    p.created_at,
    p.updated_at,
    au.last_sign_in_at
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post counters
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply counter update triggers
CREATE TRIGGER update_post_likes_count_trigger
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
