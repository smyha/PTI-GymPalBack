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
