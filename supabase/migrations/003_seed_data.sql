-- ============================================================================
-- COMPLETE SEED DATA FOR GYMPAL
-- ============================================================================
-- This migration creates comprehensive seed data for testing and development

-- ============================================================================
-- SAMPLE EXERCISES (Global Exercise Library)
-- ============================================================================

-- Insert sample exercises
INSERT INTO exercises (id, name, description, muscle_group, muscle_groups, equipment, difficulty, instructions, tags, is_public, created_by) VALUES
-- Chest Exercises
('550e8400-e29b-41d4-a716-446655440001', 'Push-ups', 'Classic bodyweight chest exercise', 'chest', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['bodyweight'], 'beginner', 
 '1. Start in plank position\n2. Lower body until chest nearly touches floor\n3. Push back up to starting position', 
 ARRAY['bodyweight', 'chest', 'beginner'], true, NULL),

('550e8400-e29b-41d4-a716-446655440002', 'Bench Press', 'Barbell chest exercise', 'chest', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['barbell', 'bench'], 'intermediate',
 '1. Lie on bench with feet flat\n2. Grip bar slightly wider than shoulders\n3. Lower bar to chest\n4. Press up explosively',
 ARRAY['barbell', 'chest', 'strength'], true, NULL),

('550e8400-e29b-41d4-a716-446655440003', 'Incline Dumbbell Press', 'Upper chest focused exercise', 'chest', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['dumbbells', 'incline_bench'], 'intermediate',
 '1. Set bench to 30-45 degree incline\n2. Hold dumbbells at chest level\n3. Press up and slightly together\n4. Lower with control',
 ARRAY['dumbbells', 'chest', 'incline'], true, NULL),

-- Back Exercises
('550e8400-e29b-41d4-a716-446655440004', 'Pull-ups', 'Bodyweight back exercise', 'back', ARRAY['back', 'biceps'], ARRAY['pull_up_bar'], 'intermediate',
 '1. Hang from bar with overhand grip\n2. Pull body up until chin over bar\n3. Lower with control',
 ARRAY['bodyweight', 'back', 'pull'], true, NULL),

('550e8400-e29b-41d4-a716-446655440005', 'Bent-over Row', 'Barbell back exercise', 'back', ARRAY['back', 'biceps'], ARRAY['barbell'], 'intermediate',
 '1. Bend forward at hips, keep back straight\n2. Pull bar to lower chest\n3. Squeeze shoulder blades together\n4. Lower with control',
 ARRAY['barbell', 'back', 'row'], true, NULL),

-- Leg Exercises
('550e8400-e29b-41d4-a716-446655440006', 'Squats', 'Fundamental leg exercise', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['bodyweight'], 'beginner',
 '1. Stand with feet shoulder-width apart\n2. Lower as if sitting in chair\n3. Keep knees behind toes\n4. Return to standing',
 ARRAY['bodyweight', 'legs', 'squat'], true, NULL),

('550e8400-e29b-41d4-a716-446655440007', 'Deadlift', 'Full body compound exercise', 'legs', ARRAY['hamstrings', 'glutes', 'back'], ARRAY['barbell'], 'advanced',
 '1. Stand with feet hip-width apart\n2. Bend at hips and knees to grip bar\n3. Keep back straight\n4. Stand up by extending hips and knees',
 ARRAY['barbell', 'compound', 'strength'], true, NULL),

-- Shoulder Exercises
('550e8400-e29b-41d4-a716-446655440008', 'Overhead Press', 'Shoulder strength exercise', 'shoulders', ARRAY['shoulders', 'triceps'], ARRAY['barbell'], 'intermediate',
 '1. Start with bar at shoulder level\n2. Press straight up overhead\n3. Lower with control',
 ARRAY['barbell', 'shoulders', 'press'], true, NULL),

('550e8400-e29b-41d4-a716-446655440009', 'Lateral Raises', 'Shoulder isolation exercise', 'shoulders', ARRAY['shoulders'], ARRAY['dumbbells'], 'beginner',
 '1. Hold dumbbells at sides\n2. Raise arms to shoulder height\n3. Lower with control',
 ARRAY['dumbbells', 'shoulders', 'isolation'], true, NULL),

-- Arm Exercises
('550e8400-e29b-41d4-a716-446655440010', 'Bicep Curls', 'Bicep isolation exercise', 'arms', ARRAY['biceps'], ARRAY['dumbbells'], 'beginner',
 '1. Hold dumbbells with arms at sides\n2. Curl weights up to shoulders\n3. Lower with control',
 ARRAY['dumbbells', 'biceps', 'isolation'], true, NULL),

('550e8400-e29b-41d4-a716-446655440011', 'Tricep Dips', 'Tricep bodyweight exercise', 'arms', ARRAY['triceps'], ARRAY['bodyweight'], 'intermediate',
 '1. Support body on bench or chair\n2. Lower body by bending elbows\n3. Push back up to starting position',
 ARRAY['bodyweight', 'triceps', 'dips'], true, NULL);

-- ============================================================================
-- SAMPLE WORKOUTS (User-Created Workouts)
-- ============================================================================

-- Note: These will be created by actual users, so we'll create them after user creation
-- For now, we'll create some template workouts that can be used as examples

-- ============================================================================
-- SAMPLE POSTS (Social Content)
-- ============================================================================

-- Note: These will be created by actual users, so we'll create them after user creation
-- For now, we'll create some example posts that can be used as templates

-- ============================================================================
-- HELPER FUNCTIONS FOR SEED DATA
-- ============================================================================

-- Function to create a complete user profile with all related data
CREATE OR REPLACE FUNCTION create_complete_user_profile(
    user_email TEXT,
    user_username TEXT,
    user_full_name TEXT,
    user_bio TEXT DEFAULT NULL,
    user_date_of_birth DATE DEFAULT NULL,
    user_gender TEXT DEFAULT NULL,
    user_fitness_level TEXT DEFAULT 'beginner'
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    profile_id UUID;
BEGIN
    -- This function assumes the user already exists in auth.users
    -- In a real scenario, you would create the auth user first
    
    -- Get the user ID from auth.users (this would be done by Supabase Auth)
    -- For seed data, we'll create a mock user ID
    user_id := uuid_generate_v4();
    
    -- Create profile
    INSERT INTO profiles (id, username, full_name, bio, date_of_birth, gender, fitness_level, is_active)
    VALUES (user_id, user_username, user_full_name, user_bio, user_date_of_birth, user_gender, user_fitness_level, true)
    RETURNING id INTO profile_id;
    
    -- Create personal info
    INSERT INTO user_personal_info (user_id, age, weight_kg, height_cm, body_fat_percentage)
    VALUES (user_id, 25, 70.0, 175, 15.0);
    
    -- Create fitness profile
    INSERT INTO user_fitness_profile (user_id, experience_level, primary_goal, secondary_goals, workout_frequency, preferred_workout_duration, available_equipment, motivation_level)
    VALUES (user_id, user_fitness_level, 'muscle_gain', ARRAY['strength', 'endurance'], 4, 60, ARRAY['dumbbells', 'barbell', 'bench'], 8);
    
    -- Create dietary preferences
    INSERT INTO user_dietary_preferences (user_id, dietary_restrictions, allergies, preferred_cuisines, daily_calorie_target, protein_target_percentage, carb_target_percentage, fat_target_percentage)
    VALUES (user_id, ARRAY['none'], ARRAY['none'], ARRAY['mediterranean', 'asian'], 2500, 30.0, 40.0, 30.0);
    
    -- Create user settings
    INSERT INTO user_settings (user_id, email_notifications, push_notifications, workout_reminders, timezone, language, theme, profile_visibility, workout_visibility, progress_visibility)
    VALUES (user_id, true, true, true, 'UTC', 'en', 'light', true, true, true);
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE WORKOUT TEMPLATES
-- ============================================================================

-- Function to create a sample workout with exercises
CREATE OR REPLACE FUNCTION create_sample_workout(
    workout_user_id UUID,
    workout_name TEXT,
    workout_description TEXT,
    workout_type TEXT,
    workout_difficulty TEXT,
    workout_duration INTEGER,
    workout_equipment TEXT[]
)
RETURNS UUID AS $$
DECLARE
    workout_id UUID;
    exercise_record RECORD;
    exercise_order INTEGER := 1;
BEGIN
    -- Create workout
    INSERT INTO workouts (user_id, name, description, type, difficulty, duration_minutes, equipment_required, is_template, is_public)
    VALUES (workout_user_id, workout_name, workout_description, workout_type, workout_difficulty, workout_duration, workout_equipment, true, true)
    RETURNING id INTO workout_id;
    
    -- Add exercises based on workout type
    IF workout_type = 'chest' THEN
        -- Add chest exercises
        FOR exercise_record IN 
            SELECT id FROM exercises 
            WHERE muscle_group = 'chest' 
            AND difficulty = workout_difficulty
            LIMIT 4
        LOOP
            INSERT INTO workout_exercises (workout_id, exercise_id, order_index, sets, reps, rest_seconds)
            VALUES (workout_id, exercise_record.id, exercise_order, 3, 12, 60);
            exercise_order := exercise_order + 1;
        END LOOP;
    ELSIF workout_type = 'full_body' THEN
        -- Add full body exercises
        FOR exercise_record IN 
            SELECT id FROM exercises 
            WHERE muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'arms')
            AND difficulty = workout_difficulty
            LIMIT 6
        LOOP
            INSERT INTO workout_exercises (workout_id, exercise_id, order_index, sets, reps, rest_seconds)
            VALUES (workout_id, exercise_record.id, exercise_order, 3, 10, 90);
            exercise_order := exercise_order + 1;
        END LOOP;
    END IF;
    
    RETURN workout_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE SOCIAL CONTENT
-- ============================================================================

-- Function to create sample posts
CREATE OR REPLACE FUNCTION create_sample_posts(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create sample posts for the user
    INSERT INTO posts (user_id, content, post_type, hashtags, is_public)
    VALUES 
    (user_id, 'Just completed my first week of training! Feeling stronger already 💪 #fitness #progress', 'achievement', ARRAY['fitness', 'progress', 'motivation'], true),
    (user_id, 'Here is my favorite chest workout routine. Try it out and let me know what you think!', 'routine', ARRAY['chest', 'workout', 'routine'], true),
    (user_id, 'Tip: Always warm up before lifting heavy weights. Your body will thank you!', 'tip', ARRAY['tip', 'warmup', 'safety'], true),
    (user_id, 'Progress update: Gained 2kg of muscle this month! Consistency is key 🔥', 'progress', ARRAY['progress', 'muscle', 'gains'], true),
    (user_id, 'Motivation Monday: Every expert was once a beginner. Keep pushing! 💪', 'motivation', ARRAY['motivation', 'monday', 'inspiration'], true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE SAMPLE DATA
-- ============================================================================

-- Note: In a real application, you would create users through Supabase Auth first
-- For demonstration purposes, we'll create some sample data that can be used
-- when real users are created

-- Create sample workout templates that can be used by any user
-- These will be created when a user creates their first workout

-- ============================================================================
-- USEFUL QUERIES FOR TESTING
-- ============================================================================

-- Query to get all exercises by muscle group
CREATE OR REPLACE VIEW exercises_by_muscle_group AS
SELECT 
    muscle_group,
    COUNT(*) as exercise_count,
    ARRAY_AGG(name ORDER BY name) as exercise_names
FROM exercises 
WHERE is_public = true
GROUP BY muscle_group
ORDER BY muscle_group;

-- Query to get workout statistics
CREATE OR REPLACE VIEW workout_stats AS
SELECT 
    w.user_id,
    COUNT(*) as total_workouts,
    AVG(w.duration_minutes) as avg_duration,
    COUNT(ws.id) as completed_sessions,
    SUM(ws.calories_burned) as total_calories_burned
FROM workouts w
LEFT JOIN workout_sessions ws ON w.id = ws.workout_id
GROUP BY w.user_id;

-- Query to get social engagement stats
CREATE OR REPLACE VIEW social_stats AS
SELECT 
    p.user_id,
    COUNT(p.id) as total_posts,
    SUM(p.likes_count) as total_likes,
    SUM(p.comments_count) as total_comments,
    SUM(p.shares_count) as total_shares
FROM posts p
GROUP BY p.user_id;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'Main user profiles - references auth.users for authentication data';
COMMENT ON TABLE user_personal_info IS 'Detailed personal information for users';
COMMENT ON TABLE user_fitness_profile IS 'Fitness-specific user preferences and goals';
COMMENT ON TABLE user_dietary_preferences IS 'Dietary restrictions and nutritional preferences';
COMMENT ON TABLE user_stats IS 'Historical user statistics and measurements';
COMMENT ON TABLE exercises IS 'Global exercise library - exercises available to all users';
COMMENT ON TABLE workouts IS 'User-created workout routines';
COMMENT ON TABLE workout_exercises IS 'Junction table linking workouts to exercises';
COMMENT ON TABLE workout_sessions IS 'Actual workout executions by users';
COMMENT ON TABLE posts IS 'Social media posts by users';
COMMENT ON TABLE post_likes IS 'User likes on posts';
COMMENT ON TABLE post_comments IS 'Comments on posts';
COMMENT ON TABLE post_shares IS 'Shares of posts between users';
COMMENT ON TABLE post_reposts IS 'Reposts of original posts';
COMMENT ON TABLE follows IS 'User following relationships';
COMMENT ON TABLE user_settings IS 'User application settings and preferences';
