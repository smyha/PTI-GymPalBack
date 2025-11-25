-- ============================================================================
-- 006_rls_policies_refresh.sql
-- Rebuilds all Row-Level Security policies to ensure consistent access control
-- across the entire GymPal database. Mirrors the live Supabase migration
-- applied via MCP (migration 005_refresh_rls_policies).
-- ============================================================================

BEGIN;

-- Clean up existing policies so this script can run idempotently
-- DROP POLICY IF EXISTS "Profiles are viewable" ON profiles;
-- DROP POLICY IF EXISTS "Profiles view own" ON profiles;
-- DROP POLICY IF EXISTS "Profiles insert own" ON profiles;
-- DROP POLICY IF EXISTS "Profiles update own" ON profiles;
-- DROP POLICY IF EXISTS "Profiles delete own" ON profiles;

-- DROP POLICY IF EXISTS "Personal info select" ON user_personal_info;
-- DROP POLICY IF EXISTS "Personal info insert" ON user_personal_info;
-- DROP POLICY IF EXISTS "Personal info update" ON user_personal_info;
-- DROP POLICY IF EXISTS "Personal info delete" ON user_personal_info;

-- DROP POLICY IF EXISTS "Fitness profile select" ON user_fitness_profile;
-- DROP POLICY IF EXISTS "Fitness profile insert" ON user_fitness_profile;
-- DROP POLICY IF EXISTS "Fitness profile update" ON user_fitness_profile;
-- DROP POLICY IF EXISTS "Fitness profile delete" ON user_fitness_profile;

-- DROP POLICY IF EXISTS "Dietary select" ON user_dietary_preferences;
-- DROP POLICY IF EXISTS "Dietary insert" ON user_dietary_preferences;
-- DROP POLICY IF EXISTS "Dietary update" ON user_dietary_preferences;
-- DROP POLICY IF EXISTS "Dietary delete" ON user_dietary_preferences;

-- DROP POLICY IF EXISTS "User stats select" ON user_stats;
-- DROP POLICY IF EXISTS "User stats insert" ON user_stats;
-- DROP POLICY IF EXISTS "User stats update" ON user_stats;
-- DROP POLICY IF EXISTS "User stats delete" ON user_stats;

-- DROP POLICY IF EXISTS "User settings select" ON user_settings;
-- DROP POLICY IF EXISTS "User settings insert" ON user_settings;
-- DROP POLICY IF EXISTS "User settings update" ON user_settings;
-- DROP POLICY IF EXISTS "User settings delete" ON user_settings;

-- DROP POLICY IF EXISTS "Exercises public" ON exercises;
-- DROP POLICY IF EXISTS "Exercises insert own" ON exercises;
-- DROP POLICY IF EXISTS "Exercises update own" ON exercises;
-- DROP POLICY IF EXISTS "Exercises delete own" ON exercises;

-- DROP POLICY IF EXISTS "Workouts service" ON workouts;
-- DROP POLICY IF EXISTS "Workouts select" ON workouts;
-- DROP POLICY IF EXISTS "Workouts insert" ON workouts;
-- DROP POLICY IF EXISTS "Workouts update" ON workouts;
-- DROP POLICY IF EXISTS "Workouts delete" ON workouts;

-- DROP POLICY IF EXISTS "Workout exercises select" ON workout_exercises;
-- DROP POLICY IF EXISTS "Workout exercises insert" ON workout_exercises;
-- DROP POLICY IF EXISTS "Workout exercises update" ON workout_exercises;
-- DROP POLICY IF EXISTS "Workout exercises delete" ON workout_exercises;

-- DROP POLICY IF EXISTS "Workout sessions select" ON workout_sessions;
-- DROP POLICY IF EXISTS "Workout sessions insert" ON workout_sessions;
-- DROP POLICY IF EXISTS "Workout sessions update" ON workout_sessions;
-- DROP POLICY IF EXISTS "Workout sessions delete" ON workout_sessions;

-- DROP POLICY IF EXISTS "Scheduled workouts service" ON scheduled_workouts;
-- DROP POLICY IF EXISTS "Scheduled workouts select" ON scheduled_workouts;
-- DROP POLICY IF EXISTS "Scheduled workouts insert" ON scheduled_workouts;
-- DROP POLICY IF EXISTS "Scheduled workouts update" ON scheduled_workouts;
-- DROP POLICY IF EXISTS "Scheduled workouts delete" ON scheduled_workouts;

-- DROP POLICY IF EXISTS "Shared workouts select" ON shared_workouts;
-- DROP POLICY IF EXISTS "Shared workouts insert" ON shared_workouts;
-- DROP POLICY IF EXISTS "Shared workouts update sender" ON shared_workouts;
-- DROP POLICY IF EXISTS "Shared workouts update recipient" ON shared_workouts;
-- DROP POLICY IF EXISTS "Shared workouts delete sender" ON shared_workouts;
-- DROP POLICY IF EXISTS "Shared workouts delete recipient" ON shared_workouts;

-- DROP POLICY IF EXISTS "Posts service" ON posts;
-- DROP POLICY IF EXISTS "Posts select" ON posts;
-- DROP POLICY IF EXISTS "Posts insert" ON posts;
-- DROP POLICY IF EXISTS "Posts update" ON posts;
-- DROP POLICY IF EXISTS "Posts delete" ON posts;

-- DROP POLICY IF EXISTS "Post likes select" ON post_likes;
-- DROP POLICY IF EXISTS "Post likes insert" ON post_likes;
-- DROP POLICY IF EXISTS "Post likes delete" ON post_likes;

-- DROP POLICY IF EXISTS "Post comments select" ON post_comments;
-- DROP POLICY IF EXISTS "Post comments insert" ON post_comments;
-- DROP POLICY IF EXISTS "Post comments update" ON post_comments;
-- DROP POLICY IF EXISTS "Post comments delete" ON post_comments;

-- DROP POLICY IF EXISTS "Post shares select" ON post_shares;
-- DROP POLICY IF EXISTS "Post shares insert" ON post_shares;
-- DROP POLICY IF EXISTS "Post shares update" ON post_shares;
-- DROP POLICY IF EXISTS "Post shares delete" ON post_shares;

-- DROP POLICY IF EXISTS "Post reposts select" ON post_reposts;
-- DROP POLICY IF EXISTS "Post reposts insert" ON post_reposts;
-- DROP POLICY IF EXISTS "Post reposts delete" ON post_reposts;

-- DROP POLICY IF EXISTS "Follows select" ON follows;
-- DROP POLICY IF EXISTS "Follows insert" ON follows;
-- DROP POLICY IF EXISTS "Follows delete" ON follows;

-- DROP POLICY IF EXISTS "AI conversations select" ON ai_conversations;
-- DROP POLICY IF EXISTS "AI conversations modify" ON ai_conversations;
-- DROP POLICY IF EXISTS "AI messages select" ON ai_messages;
-- DROP POLICY IF EXISTS "AI messages modify" ON ai_messages;

-- DROP POLICY IF EXISTS "Exercise set logs select" ON exercise_set_logs;
-- DROP POLICY IF EXISTS "Exercise set logs modify" ON exercise_set_logs;

-- DROP FUNCTION IF EXISTS can_interact_with_post(uuid);
-- DROP FUNCTION IF EXISTS can_view_user_content(uuid);

-- Helper function: determine if current user can view another user's content
CREATE OR REPLACE FUNCTION can_view_user_content(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    IF auth.uid() = target_user_id THEN
        RETURN TRUE;
    END IF;
    IF EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND is_active = true) THEN
        RETURN TRUE;
    END IF;
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

-- Helper function: determine if current user can interact with a post
CREATE OR REPLACE FUNCTION can_interact_with_post(post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    IF EXISTS (SELECT 1 FROM posts WHERE id = post_id AND is_public = true) THEN
        RETURN TRUE;
    END IF;
    IF EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid()) THEN
        RETURN TRUE;
    END IF;
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

-- Profiles
CREATE POLICY "Profiles are viewable" ON profiles FOR SELECT USING (is_active = true);
CREATE POLICY "Profiles view own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles delete own" ON profiles FOR DELETE USING (auth.uid() = id);

-- User personal info
CREATE POLICY "Personal info select" ON user_personal_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Personal info insert" ON user_personal_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Personal info update" ON user_personal_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Personal info delete" ON user_personal_info FOR DELETE USING (auth.uid() = user_id);

-- User fitness profile
CREATE POLICY "Fitness profile select" ON user_fitness_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Fitness profile insert" ON user_fitness_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Fitness profile update" ON user_fitness_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Fitness profile delete" ON user_fitness_profile FOR DELETE USING (auth.uid() = user_id);

-- Dietary preferences
CREATE POLICY "Dietary select" ON user_dietary_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Dietary insert" ON user_dietary_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dietary update" ON user_dietary_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Dietary delete" ON user_dietary_preferences FOR DELETE USING (auth.uid() = user_id);

-- User stats
CREATE POLICY "User stats select" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User stats insert" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User stats update" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User stats delete" ON user_stats FOR DELETE USING (auth.uid() = user_id);

-- User settings
CREATE POLICY "User settings select" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User settings insert" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User settings update" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User settings delete" ON user_settings FOR DELETE USING (auth.uid() = user_id);

-- Exercises
CREATE POLICY "Exercises public" ON exercises FOR SELECT USING (is_public = true OR auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "Exercises insert own" ON exercises FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Exercises update own" ON exercises FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Exercises delete own" ON exercises FOR DELETE USING (auth.uid() = created_by);

-- Workouts
CREATE POLICY "Workouts service" ON workouts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Workouts select" ON workouts FOR SELECT USING (
    auth.uid() = user_id
    OR is_public = true
    OR EXISTS (
        SELECT 1 FROM shared_workouts sw
        WHERE sw.original_workout_id = workouts.id
          AND (sw.shared_with_user_id = auth.uid() OR sw.shared_by_user_id = auth.uid())
    )
);
CREATE POLICY "Workouts insert" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workouts update" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Workouts delete" ON workouts FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises
CREATE POLICY "Workout exercises select" ON workout_exercises FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workouts w
        WHERE w.id = workout_exercises.workout_id
          AND (w.user_id = auth.uid() OR w.is_public = true)
    )
);
CREATE POLICY "Workout exercises insert" ON workout_exercises FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM workouts w
        WHERE w.id = workout_exercises.workout_id
          AND w.user_id = auth.uid()
    )
);
CREATE POLICY "Workout exercises update" ON workout_exercises FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM workouts w
        WHERE w.id = workout_exercises.workout_id
          AND w.user_id = auth.uid()
    )
);
CREATE POLICY "Workout exercises delete" ON workout_exercises FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM workouts w
        WHERE w.id = workout_exercises.workout_id
          AND w.user_id = auth.uid()
    )
);

-- Workout sessions
CREATE POLICY "Workout sessions select" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Workout sessions insert" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workout sessions update" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Workout sessions delete" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Scheduled workouts
CREATE POLICY "Scheduled workouts service" ON scheduled_workouts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Scheduled workouts select" ON scheduled_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Scheduled workouts insert" ON scheduled_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Scheduled workouts update" ON scheduled_workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Scheduled workouts delete" ON scheduled_workouts FOR DELETE USING (auth.uid() = user_id);

-- Shared workouts
CREATE POLICY "Shared workouts select" ON shared_workouts FOR SELECT USING (auth.uid() = shared_by_user_id OR auth.uid() = shared_with_user_id);
CREATE POLICY "Shared workouts insert" ON shared_workouts FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);
CREATE POLICY "Shared workouts update sender" ON shared_workouts FOR UPDATE USING (auth.uid() = shared_by_user_id);
CREATE POLICY "Shared workouts update recipient" ON shared_workouts FOR UPDATE USING (auth.uid() = shared_with_user_id);
CREATE POLICY "Shared workouts delete sender" ON shared_workouts FOR DELETE USING (auth.uid() = shared_by_user_id);
CREATE POLICY "Shared workouts delete recipient" ON shared_workouts FOR DELETE USING (auth.uid() = shared_with_user_id);

-- Posts
CREATE POLICY "Posts service" ON posts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Posts select" ON posts FOR SELECT USING (is_public = true OR auth.uid() = user_id OR can_view_user_content(user_id));
CREATE POLICY "Posts insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Posts update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Posts delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Post likes
CREATE POLICY "Post likes select" ON post_likes FOR SELECT USING (can_interact_with_post(post_id));
CREATE POLICY "Post likes insert" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Post likes delete" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post comments
CREATE POLICY "Post comments select" ON post_comments FOR SELECT USING (can_interact_with_post(post_id));
CREATE POLICY "Post comments insert" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Post comments update" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Post comments delete" ON post_comments FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM posts WHERE id = post_comments.post_id));

-- Post shares
CREATE POLICY "Post shares select" ON post_shares FOR SELECT USING (can_interact_with_post(post_id));
CREATE POLICY "Post shares insert" ON post_shares FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);
CREATE POLICY "Post shares update" ON post_shares FOR UPDATE USING (auth.uid() = shared_by_user_id);
CREATE POLICY "Post shares delete" ON post_shares FOR DELETE USING (auth.uid() = shared_by_user_id);

-- Post reposts
CREATE POLICY "Post reposts select" ON post_reposts FOR SELECT USING (can_interact_with_post(original_post_id));
CREATE POLICY "Post reposts insert" ON post_reposts FOR INSERT WITH CHECK (auth.uid() = reposted_by_user_id);
CREATE POLICY "Post reposts delete" ON post_reposts FOR DELETE USING (auth.uid() = reposted_by_user_id);

-- Follows
CREATE POLICY "Follows select" ON follows FOR SELECT USING (true);
CREATE POLICY "Follows insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Follows delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- AI conversations/messages
CREATE POLICY "AI conversations select" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "AI conversations modify" ON ai_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "AI messages select" ON ai_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM ai_conversations c
        WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
    )
);
CREATE POLICY "AI messages modify" ON ai_messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM ai_conversations c
        WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM ai_conversations c
        WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
    )
);

-- Exercise set logs
ALTER TABLE exercise_set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercise set logs select" ON exercise_set_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workout_sessions ws
        WHERE ws.id = exercise_set_logs.workout_session_id AND ws.user_id = auth.uid()
    )
    OR EXISTS(
        SELECT 1 FROM scheduled_workouts sw
        WHERE sw.id = exercise_set_logs.scheduled_workout_id AND sw.user_id = auth.uid()
    )
);
CREATE POLICY "Exercise set logs modify" ON exercise_set_logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM workout_sessions ws
        WHERE ws.id = exercise_set_logs.workout_session_id AND ws.user_id = auth.uid()
    )
    OR EXISTS(
        SELECT 1 FROM scheduled_workouts sw
        WHERE sw.id = exercise_set_logs.scheduled_workout_id AND sw.user_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM workout_sessions ws
        WHERE ws.id = exercise_set_logs.workout_session_id AND ws.user_id = auth.uid()
    )
    OR EXISTS(
        SELECT 1 FROM scheduled_workouts sw
        WHERE sw.id = exercise_set_logs.scheduled_workout_id AND sw.user_id = auth.uid()
    )
);

COMMIT;

