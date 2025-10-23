// Export database types
export type { Database } from './database.js';

// Base API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage?: number;
    prevPage?: number;
  };
  metadata?: {
    requestId?: string;
    timestamp?: string;
    duration?: number;
    version?: string;
    [key: string]: any;
  };
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Pagination result
export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User related types
export interface User extends BaseEntity {
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  timezone: string;
  language: string;
  last_login?: string;
  is_active: boolean;
  email_verified: boolean;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  notification_preferences: NotificationPreferences;
  privacy_settings: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  workout_reminders: boolean;
  social_interactions: boolean;
  achievements: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  profile_public: boolean;
  workouts_public: boolean;
  posts_public: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_activity: boolean;
}

// Personal information types
export interface PersonalInfo extends BaseEntity {
  user_id: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  fitness_goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'general_fitness';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  medical_conditions: string[];
  dietary_preferences: string[];
  target_weight?: number;
  target_date?: string;
  notes?: string;
}

// Workout related types
export interface Workout extends BaseEntity {
  user_id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  muscle_groups: string[];
  equipment_needed: string[];
  is_template: boolean;
  tags: string[];
  calories_burned?: number;
  difficulty_score?: number;
  is_public: boolean;
  shared_count: number;
  likes_count: number;
}

export interface Exercise extends BaseEntity {
  workout_id: string;
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  order_index: number;
  target_muscles: string[];
  exercise_type: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'sports';
  instructions?: string;
  video_url?: string;
  image_url?: string;
}

export interface WorkoutSession extends BaseEntity {
  user_id: string;
  workout_id: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  notes?: string;
  exercises_completed: number;
  total_exercises: number;
  calories_burned?: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  perceived_exertion?: number;
  mood_before?: number;
  mood_after?: number;
}

// Workout plan types
export interface WorkoutPlan extends BaseEntity {
  user_id: string;
  name: string;
  description?: string;
  duration_weeks: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_public: boolean;
  tags: string[];
  likes_count: number;
  shared_count: number;
  completed_count: number;
}

export interface WorkoutPlanWorkout extends BaseEntity {
  workout_plan_id: string;
  workout_id: string;
  week_number: number;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  order_index: number;
}

// Social types
export interface SocialPost extends BaseEntity {
  user_id: string;
  content: string;
  image_urls?: string[];
  video_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_public: boolean;
  tags: string[];
  location?: string;
  mood?: number;
  workout_session_id?: string;
}

export interface Comment extends BaseEntity {
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string; // For nested comments
  likes_count: number;
  is_edited: boolean;
}

export interface Like extends BaseEntity {
  post_id?: string;
  comment_id?: string;
  user_id: string;
  type: 'post' | 'comment';
}

export interface UserFollow extends BaseEntity {
  follower_id: string;
  following_id: string;
}

// Goals and achievements
export interface UserGoal extends BaseEntity {
  user_id: string;
  goal_type: 'weight' | 'strength' | 'endurance' | 'flexibility' | 'custom';
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  target_date?: string;
  is_achieved: boolean;
  achieved_at?: string;
  progress_percentage: number;
}

export interface Achievement extends BaseEntity {
  user_id: string;
  achievement_type: string;
  title: string;
  description?: string;
  icon_url?: string;
  points: number;
  unlocked_at: string;
  category: 'workout' | 'social' | 'streak' | 'milestone' | 'special';
}

// Notifications
export interface Notification extends BaseEntity {
  user_id: string;
  type: 'workout' | 'social' | 'achievement' | 'system' | 'reminder';
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  priority: 'low' | 'medium' | 'high';
}

// Analytics and statistics
export interface UserStats {
  total_workouts: number;
  workouts_this_week: number;
  total_exercise_time: number; // in minutes
  current_streak: number;
  longest_streak: number;
  favorite_workout_type: string;
  total_posts: number;
  total_followers: number;
  total_following: number;
  achievements_unlocked: number;
  goals_achieved: number;
  goals_active: number;
  average_workout_duration: number;
  most_active_day: string;
  most_active_time: string;
  calories_burned_total: number;
  weight_lost: number;
  muscle_gained: number;
}

export interface WorkoutStats {
  total_sessions: number;
  total_duration: number;
  average_duration: number;
  completion_rate: number;
  favorite_exercises: string[];
  progress_over_time: Array<{
    date: string;
    duration: number;
    exercises_completed: number;
  }>;
}

// Dashboard data
export interface DashboardData {
  stats: UserStats;
  recent_workouts: WorkoutSession[];
  recent_posts: SocialPost[];
  upcoming_workouts: Workout[];
  active_goals: UserGoal[];
  recent_achievements: Achievement[];
  notifications: Notification[];
  social_feed: SocialPost[];
  recommended_workouts: Workout[];
  progress_charts: {
    weight: Array<{ date: string; value: number }>;
    workouts: Array<{ date: string; count: number }>;
    calories: Array<{ date: string; burned: number }>;
  };
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email_verified?: boolean;
  role?: string;
}

export interface JwtPayload {
  id?: string;
  sub: string;
  email: string;
  username?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// Search and filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface WorkoutSearchParams extends SearchParams {
  difficulty_level?: string[];
  muscle_groups?: string[];
  equipment?: string[];
  duration_min?: number;
  duration_max?: number;
  is_public?: boolean;
  user_id?: string;
  tags?: string[];
}

export interface PostSearchParams extends SearchParams {
  user_id?: string;
  is_public?: boolean;
  tags?: string[];
  mood?: number;
  has_workout?: boolean;
  date_from?: string;
  date_to?: string;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  url?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  file?: FileUpload;
}

// Cache types
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
}

export interface CacheEntry<T = any> {
  data: T;
  expires_at: number;
  tags: string[];
  created_at: number;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

export interface ApiError extends Error {
  statusCode: number;
  code: string;
  details?: ValidationError[];
  isOperational?: boolean;
}

// Database types are now imported from database.ts
