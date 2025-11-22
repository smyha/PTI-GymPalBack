-- Function to get a workout by ID bypassing RLS
CREATE OR REPLACE FUNCTION get_workout_by_id(p_id UUID)
RETURNS SETOF workouts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM workouts WHERE id = p_id;
$$;

-- Function to get workout exercises by workout ID bypassing RLS
CREATE OR REPLACE FUNCTION get_workout_exercises_by_workout_id(p_workout_id UUID)
RETURNS SETOF workout_exercises
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM workout_exercises WHERE workout_id = p_workout_id;
$$;

-- Function to count user workouts bypassing RLS
CREATE OR REPLACE FUNCTION count_user_workouts(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::INTEGER FROM workouts WHERE user_id = p_user_id;
$$;

