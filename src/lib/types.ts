// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  muscle_groups: string[];
  equipment_needed: string[];
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  notes?: string;
  exercises_completed: number;
  total_exercises: number;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PersonalInfo {
  id: string;
  user_id: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  fitness_goal?: 'weight_loss' | 'muscle_gain' | 'endurance' | 'strength' | 'general_fitness';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  medical_conditions?: string[];
  dietary_preferences?: string[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_workouts: number;
  workouts_this_week: number;
  total_exercise_time: number;
  current_streak: number;
  longest_streak: number;
  favorite_workout_type: string;
  recent_achievements: string[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: ValidationError[];
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      workouts: {
        Row: Workout;
        Insert: Omit<Workout, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Workout, 'id' | 'created_at' | 'updated_at'>>;
      };
      exercises: {
        Row: Exercise;
        Insert: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Exercise, 'id' | 'created_at' | 'updated_at'>>;
      };
      workout_sessions: {
        Row: WorkoutSession;
        Insert: Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>>;
      };
      social_posts: {
        Row: SocialPost;
        Insert: Omit<SocialPost, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SocialPost, 'id' | 'created_at' | 'updated_at'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at' | 'updated_at'>>;
      };
      likes: {
        Row: Like;
        Insert: Omit<Like, 'id' | 'created_at'>;
        Update: Partial<Omit<Like, 'id' | 'created_at'>>;
      };
      personal_info: {
        Row: PersonalInfo;
        Insert: Omit<PersonalInfo, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PersonalInfo, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
