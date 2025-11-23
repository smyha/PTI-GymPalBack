/**
 * UNIFIED API TYPES
 *
 * These types define the canonical shapes for all API requests and responses.
 * All data flowing between backend and frontend should conform to these types.
 *
 * Naming Convention: All fields use snake_case to match database schema.
 * Frontend will transform to camelCase if needed via the transformation layer.
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timezone?: string;
  language?: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ============================================================================
// USER/PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timezone: string;
  language: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPersonalInfo {
  id: string;
  user_id: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  body_fat_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timezone?: string;
  language?: string;
}

// ============================================================================
// EXERCISE TYPES
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_group: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  instructions?: string;
  video_url?: string;
  image_url?: string;
  tags: string[];
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  muscle_group: string;
  equipment?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  instructions?: string;
  video_url?: string;
  image_url?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateExerciseRequest extends Partial<CreateExerciseRequest> { }

// ============================================================================
// WORKOUT TYPES
// ============================================================================

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: number;
  weight_kg?: number;
  rest_seconds: number;
  notes?: string;
  exercise?: Exercise; // Nested when needed
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_minutes: number;
  is_template: boolean;
  is_public: boolean;
  is_shared: boolean;
  target_goal?: string;
  target_level?: string;
  days_per_week?: number;
  equipment_required: string[];
  user_notes?: string;
  tags: string[];
  share_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  exercises?: WorkoutExercise[]; // Nested when needed
}

export interface CreateWorkoutRequest {
  name: string;
  description?: string;
  type?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_minutes: number;
  is_template?: boolean;
  is_public?: boolean;
  target_goal?: string;
  target_level?: string;
  days_per_week?: number;
  equipment_required?: string[];
  user_notes?: string;
  tags?: string[];
}

export interface UpdateWorkoutRequest extends Partial<CreateWorkoutRequest> { }

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id?: string;
  started_at: string;
  completed_at?: string;
  duration_minutes: number;
  calories_burned: number;
  notes?: string;
  created_at: string;
}

// ============================================================================
// SOCIAL/POST TYPES
// ============================================================================

export interface PostAuthor {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: 'achievement' | 'routine' | 'tip' | 'progress' | 'motivation' | 'question' | 'general';
  workout_id?: string;
  image_urls: string[];
  video_url?: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reposts_count: number;
  is_public: boolean;
  is_original: boolean;
  original_post_id?: string;
  shared_from_user_id?: string;
  created_at: string;
  updated_at: string;
  author?: PostAuthor; // Nested when needed
  is_liked?: boolean;  // User-specific field
  workout?: {
    id: string;
    name: string;
    description?: string;
    difficulty?: string;
    duration_minutes?: number;
  };
}

export interface CreatePostRequest {
  content: string;
  post_type?: 'achievement' | 'routine' | 'tip' | 'progress' | 'motivation' | 'question' | 'general';
  workout_id?: string;
  image_urls?: string[];
  video_url?: string;
  hashtags?: string[];
  is_public?: boolean;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> { }

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  author?: PostAuthor; // Nested when needed
  replies?: PostComment[]; // For threaded comments
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
}

export interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

// ============================================================================
// SOCIAL/FOLLOW TYPES
// ============================================================================

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: UserProfile; // Nested
  following?: UserProfile; // Nested
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

// ============================================================================
// DASHBOARD/STATS TYPES
// ============================================================================

export interface DashboardStats {
  total_workouts: number;
  total_exercises: number;
  total_duration: number;
  average_duration: number;
}

export interface WorkoutStats {
  total_workouts: number;
  total_exercises: number;
  total_duration: number;
  average_duration: number;
  weekly_count?: number;
  monthly_count?: number;
}

export interface UserStats {
  user_id: string;
  height_cm?: number;
  weight_kg?: number;
  body_fat_percentage?: number;
  target_weight_kg?: number;
  recorded_at: string;
}

// ============================================================================
// PAGINATION & LIST TYPES
// ============================================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedList<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  details: Record<string, string[]>; // Field name -> error messages
}

// ============================================================================
// GENERIC API RESPONSE
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  metadata?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: ApiError;
  metadata?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
