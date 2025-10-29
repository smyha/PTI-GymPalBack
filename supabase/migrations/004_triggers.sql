-- ============================================================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================================================
-- This migration adds a trigger to automatically create a profile entry
-- when a new user is created in auth.users

-- 1. Create a function to automatically insert a new profile
--    when a new user signs up in auth.users
--    IMPORTANT: Only insert minimal data, NO defaults that user didn't provide
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into the public.profiles table with ONLY user-provided data
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    bio,
    date_of_birth,
    gender,
    fitness_level,
    timezone,
    language,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',  -- NULL if not provided
    NEW.raw_user_meta_data->>'full_name',  -- NULL if not provided
    NEW.raw_user_meta_data->>'avatar_url',  -- NULL if not provided
    NEW.raw_user_meta_data->>'bio',  -- NULL if not provided
    (NEW.raw_user_meta_data->>'date_of_birth')::date,  -- NULL if not provided
    NEW.raw_user_meta_data->>'gender',  -- NULL if not provided
    NEW.raw_user_meta_data->>'fitness_level',  -- NULL if not provided
    NEW.raw_user_meta_data->>'timezone',  -- NULL if not provided
    NEW.raw_user_meta_data->>'language',  -- NULL if not provided
    COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate inserts

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that calls the function
--    AFTER a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- USER SELF-DELETE FUNCTION
-- ============================================================================
-- This function allows authenticated users to delete their own account
-- without requiring the service role key in the application code.
-- The function uses SECURITY DEFINER to execute with elevated privileges.
-- 
-- Benefits:
-- - Users can delete their own accounts without SUPABASE_SERVICE_ROLE_KEY
-- - Security: Only authenticated users can delete their own account (via auth.uid())
-- - Automatic cascade deletion of related data (profiles, workouts, posts, etc.)
-- - Safe: Function executes with admin privileges but validates user identity
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;

  -- Delete user from auth.users (this will cascade to profiles and other tables)
  -- Note: This requires superuser privileges, so we use SECURITY DEFINER
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- The CASCADE will automatically handle:
  -- - profiles table (via ON DELETE CASCADE)
  -- - All other related tables (via their CASCADE relationships)
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_own_account() IS 
  'Allows authenticated users to delete their own account. Requires authentication. Uses SECURITY DEFINER for elevated privileges.';