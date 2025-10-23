-- ============================================================================
-- COMPLETE RLS POLICIES FOR GYMPAL
-- ============================================================================
-- This migration creates comprehensive Row Level Security policies
-- for all tables in the GymPal database

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fitness_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Public profiles can be viewed by anyone (for social features)
CREATE POLICY "Public profiles are viewable" ON profiles
    FOR SELECT USING (is_active = true);

-- ============================================================================
-- USER PERSONAL INFO POLICIES
-- ============================================================================

-- Users can view their own personal info
CREATE POLICY "Users can view own personal info" ON user_personal_info
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own personal info
CREATE POLICY "Users can insert own personal info" ON user_personal_info
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own personal info
CREATE POLICY "Users can update own personal info" ON user_personal_info
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own personal info
CREATE POLICY "Users can delete own personal info" ON user_personal_info
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER FITNESS PROFILE POLICIES
-- ============================================================================

-- Users can view their own fitness profile
CREATE POLICY "Users can view own fitness profile" ON user_fitness_profile
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own fitness profile
CREATE POLICY "Users can insert own fitness profile" ON user_fitness_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own fitness profile
CREATE POLICY "Users can update own fitness profile" ON user_fitness_profile
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own fitness profile
CREATE POLICY "Users can delete own fitness profile" ON user_fitness_profile
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER DIETARY PREFERENCES POLICIES
-- ============================================================================

-- Users can view their own dietary preferences
CREATE POLICY "Users can view own dietary preferences" ON user_dietary_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own dietary preferences
CREATE POLICY "Users can insert own dietary preferences" ON user_dietary_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own dietary preferences
CREATE POLICY "Users can update own dietary preferences" ON user_dietary_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own dietary preferences
CREATE POLICY "Users can delete own dietary preferences" ON user_dietary_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER STATS POLICIES
-- ============================================================================

-- Users can view their own stats
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stats
CREATE POLICY "Users can delete own stats" ON user_stats
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER SETTINGS POLICIES
-- ============================================================================

-- Users can view their own settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- EXERCISES POLICIES
-- ============================================================================

-- Anyone can view public exercises
CREATE POLICY "Public exercises are viewable" ON exercises
    FOR SELECT USING (is_public = true);

-- Users can view their own created exercises
CREATE POLICY "Users can view own exercises" ON exercises
    FOR SELECT USING (auth.uid() = created_by);

-- Users can insert exercises
CREATE POLICY "Users can create exercises" ON exercises
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises" ON exercises
    FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises" ON exercises
    FOR DELETE USING (auth.uid() = created_by);

-- ============================================================================
-- WORKOUTS POLICIES
-- ============================================================================

-- Users can view their own workouts
CREATE POLICY "Users can view own workouts" ON workouts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view public workouts
CREATE POLICY "Public workouts are viewable" ON workouts
    FOR SELECT USING (is_public = true);

-- Users can insert workouts
CREATE POLICY "Users can create workouts" ON workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update own workouts" ON workouts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete own workouts" ON workouts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- WORKOUT EXERCISES POLICIES
-- ============================================================================

-- Users can view workout exercises for workouts they own or that are public
CREATE POLICY "Users can view workout exercises" ON workout_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workouts w 
            WHERE w.id = workout_exercises.workout_id 
            AND (w.user_id = auth.uid() OR w.is_public = true)
        )
    );

-- Users can insert workout exercises for their own workouts
CREATE POLICY "Users can insert workout exercises" ON workout_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workouts w 
            WHERE w.id = workout_exercises.workout_id 
            AND w.user_id = auth.uid()
        )
    );

-- Users can update workout exercises for their own workouts
CREATE POLICY "Users can update workout exercises" ON workout_exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workouts w 
            WHERE w.id = workout_exercises.workout_id 
            AND w.user_id = auth.uid()
        )
    );

-- Users can delete workout exercises for their own workouts
CREATE POLICY "Users can delete workout exercises" ON workout_exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workouts w 
            WHERE w.id = workout_exercises.workout_id 
            AND w.user_id = auth.uid()
        )
    );

-- ============================================================================
-- WORKOUT SESSIONS POLICIES
-- ============================================================================

-- Users can view their own workout sessions
CREATE POLICY "Users can view own workout sessions" ON workout_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert workout sessions
CREATE POLICY "Users can create workout sessions" ON workout_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own workout sessions
CREATE POLICY "Users can update own workout sessions" ON workout_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own workout sessions
CREATE POLICY "Users can delete own workout sessions" ON workout_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SHARED WORKOUTS POLICIES
-- ============================================================================

-- Users can view workouts shared with them or by them
CREATE POLICY "Users can view shared workouts" ON shared_workouts
    FOR SELECT USING (
        auth.uid() = shared_by_user_id OR 
        auth.uid() = shared_with_user_id
    );

-- Users can share workouts
CREATE POLICY "Users can share workouts" ON shared_workouts
    FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);

-- Users can update workouts they shared
CREATE POLICY "Users can update shared workouts they sent" ON shared_workouts
    FOR UPDATE USING (auth.uid() = shared_by_user_id);

-- Recipients can update acceptance status
CREATE POLICY "Recipients can update acceptance" ON shared_workouts
    FOR UPDATE USING (auth.uid() = shared_with_user_id);

-- Users can delete workouts they shared
CREATE POLICY "Users can delete shared workouts they sent" ON shared_workouts
    FOR DELETE USING (auth.uid() = shared_by_user_id);

-- Recipients can delete workouts shared with them
CREATE POLICY "Recipients can delete shared workouts" ON shared_workouts
    FOR DELETE USING (auth.uid() = shared_with_user_id);

-- ============================================================================
-- POSTS POLICIES
-- ============================================================================

-- Users can view their own posts
CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view public posts
CREATE POLICY "Public posts are viewable" ON posts
    FOR SELECT USING (is_public = true);

-- Users can view posts from users they follow
CREATE POLICY "Users can view posts from followed users" ON posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM follows f 
            WHERE f.follower_id = auth.uid() 
            AND f.following_id = posts.user_id
        )
    );

-- Users can insert posts
CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POST LIKES POLICIES
-- ============================================================================

-- Users can view likes on posts they can see
CREATE POLICY "Users can view post likes" ON post_likes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts p 
            WHERE p.id = post_likes.post_id 
            AND (p.user_id = auth.uid() OR p.is_public = true)
        )
    );

-- Users can like posts
CREATE POLICY "Users can like posts" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike posts (delete their likes)
CREATE POLICY "Users can unlike posts" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POST COMMENTS POLICIES
-- ============================================================================

-- Users can view comments on posts they can see
CREATE POLICY "Users can view post comments" ON post_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts p 
            WHERE p.id = post_comments.post_id 
            AND (p.user_id = auth.uid() OR p.is_public = true)
        )
    );

-- Users can comment on posts
CREATE POLICY "Users can comment on posts" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- POST SHARES POLICIES
-- ============================================================================

-- Users can view shares of posts they can see
CREATE POLICY "Users can view post shares" ON post_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts p 
            WHERE p.id = post_shares.post_id 
            AND (p.user_id = auth.uid() OR p.is_public = true)
        )
    );

-- Users can share posts
CREATE POLICY "Users can share posts" ON post_shares
    FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);

-- Users can update their own shares
CREATE POLICY "Users can update own shares" ON post_shares
    FOR UPDATE USING (auth.uid() = shared_by_user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares" ON post_shares
    FOR DELETE USING (auth.uid() = shared_by_user_id);

-- ============================================================================
-- POST REPOSTS POLICIES
-- ============================================================================

-- Users can view reposts of posts they can see
CREATE POLICY "Users can view post reposts" ON post_reposts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM posts p 
            WHERE p.id = post_reposts.original_post_id 
            AND (p.user_id = auth.uid() OR p.is_public = true)
        )
    );

-- Users can repost posts
CREATE POLICY "Users can repost posts" ON post_reposts
    FOR INSERT WITH CHECK (auth.uid() = reposted_by_user_id);

-- Users can delete their own reposts
CREATE POLICY "Users can delete own reposts" ON post_reposts
    FOR DELETE USING (auth.uid() = reposted_by_user_id);

-- ============================================================================
-- FOLLOWS POLICIES
-- ============================================================================

-- Users can view their own follows
CREATE POLICY "Users can view own follows" ON follows
    FOR SELECT USING (
        auth.uid() = follower_id OR 
        auth.uid() = following_id
    );

-- Users can follow other users
CREATE POLICY "Users can follow others" ON follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others
CREATE POLICY "Users can unfollow others" ON follows
    FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if user can view another user's content
CREATE OR REPLACE FUNCTION can_view_user_content(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Users can always view their own content
    IF auth.uid() = target_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Check if target user is public
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = target_user_id 
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if current user follows target user
    IF EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() 
        AND following_id = target_user_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can interact with post
CREATE OR REPLACE FUNCTION can_interact_with_post(post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if post is public
    IF EXISTS (
        SELECT 1 FROM posts 
        WHERE id = post_id 
        AND is_public = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user owns the post
    IF EXISTS (
        SELECT 1 FROM posts 
        WHERE id = post_id 
        AND user_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user follows the post author
    IF EXISTS (
        SELECT 1 FROM posts p
        JOIN follows f ON f.following_id = p.user_id
        WHERE p.id = post_id 
        AND f.follower_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
