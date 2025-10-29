/**
 * Database Types for Supabase
 *
 * This file contains all the type definitions for the Supabase database schema.
 * It follows the Supabase generated types format and provides type-safety for
 * database operations.
 *
 * To regenerate these types, run:
 * npx supabase gen types typescript --local > src/core/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          date_of_birth: string | null;
          gender: string | null;
          fitness_level: string | null;
          timezone: string | null;
          language: string | null;
          is_active: boolean;
          preferences: unknown | null;
          social_links: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          fitness_level?: string | null;
          timezone?: string | null;
          language?: string | null;
          is_active?: boolean;
          preferences?: unknown | null;
          social_links?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          fitness_level?: string | null;
          timezone?: string | null;
          language?: string | null;
          is_active?: boolean;
          preferences?: unknown | null;
          social_links?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_personal_info: {
        Row: {
          id: string;
          user_id: string;
          age: number | null;
          weight_kg: number | null;
          height_cm: number | null;
          body_fat_percentage: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          body_fat_percentage?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          body_fat_percentage?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_fitness_profile: {
        Row: {
          id: string;
          user_id: string;
          experience_level: string | null;
          primary_goal: string | null;
          secondary_goals: string[] | null;
          workout_frequency: number | null;
          preferred_workout_duration: number | null;
          available_equipment: string[] | null;
          workout_preferences: unknown | null;
          fitness_goals: unknown | null;
          training_history: unknown | null;
          injuries_limitations: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          experience_level?: string | null;
          primary_goal?: string | null;
          secondary_goals?: string[] | null;
          workout_frequency?: number | null;
          preferred_workout_duration?: number | null;
          available_equipment?: string[] | null;
          workout_preferences?: unknown | null;
          fitness_goals?: unknown | null;
          training_history?: unknown | null;
          injuries_limitations?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          experience_level?: string | null;
          primary_goal?: string | null;
          secondary_goals?: string[] | null;
          workout_frequency?: number | null;
          preferred_workout_duration?: number | null;
          available_equipment?: string[] | null;
          workout_preferences?: unknown | null;
          fitness_goals?: unknown | null;
          training_history?: unknown | null;
          injuries_limitations?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean | null;
          push_notifications: boolean | null;
          workout_reminders: boolean | null;
          timezone: string | null;
          language: string | null;
          theme: string | null;
          profile_visibility: boolean | null;
          workout_visibility: boolean | null;
          progress_visibility: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: boolean | null;
          push_notifications?: boolean | null;
          workout_reminders?: boolean | null;
          timezone?: string | null;
          language?: string | null;
          theme?: string | null;
          profile_visibility?: boolean | null;
          workout_visibility?: boolean | null;
          progress_visibility?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_notifications?: boolean | null;
          push_notifications?: boolean | null;
          workout_reminders?: boolean | null;
          timezone?: string | null;
          language?: string | null;
          theme?: string | null;
          profile_visibility?: boolean | null;
          workout_visibility?: boolean | null;
          progress_visibility?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          type: string | null;
          difficulty: string | null;
          duration_minutes: number | null;
          is_template: boolean;
          is_public: boolean;
          is_shared: boolean;
          target_goal: string | null;
          target_level: string | null;
          days_per_week: number | null;
          equipment_required: string[] | null;
          user_notes: string | null;
          tags: string[] | null;
          share_count: number;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          type?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          is_template?: boolean;
          is_public?: boolean;
          is_shared?: boolean;
          target_goal?: string | null;
          target_level?: string | null;
          days_per_week?: number | null;
          equipment_required?: string[] | null;
          user_notes?: string | null;
          tags?: string[] | null;
          share_count?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          type?: string | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          is_template?: boolean;
          is_public?: boolean;
          is_shared?: boolean;
          target_goal?: string | null;
          target_level?: string | null;
          days_per_week?: number | null;
          equipment_required?: string[] | null;
          user_notes?: string | null;
          tags?: string[] | null;
          share_count?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string | null;
          started_at: string;
          completed_at: string | null;
          duration_minutes: number | null;
          calories_burned: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_minutes?: number | null;
          calories_burned?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_minutes?: number | null;
          calories_burned?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          created_by: string | null;
          user_id?: string;
          name: string;
          description: string | null;
          muscle_group: string;
          muscle_groups: string[] | null;
          equipment: string[] | null;
          difficulty: string | null;
          instructions: string | null;
          video_url: string | null;
          image_url: string | null;
          tags: string[] | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by?: string | null;
          user_id?: string;
          name: string;
          description?: string | null;
          muscle_group: string;
          muscle_groups?: string[] | null;
          equipment?: string[] | null;
          difficulty?: string | null;
          instructions?: string | null;
          video_url?: string | null;
          image_url?: string | null;
          tags?: string[] | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string | null;
          user_id?: string;
          name?: string;
          description?: string | null;
          muscle_group?: string;
          muscle_groups?: string[] | null;
          equipment?: string[] | null;
          difficulty?: string | null;
          instructions?: string | null;
          video_url?: string | null;
          image_url?: string | null;
          tags?: string[] | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          order_index: number;
          sets: number | null;
          reps: number | null;
          weight_kg: number | null;
          rest_seconds: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          order_index?: number;
          sets?: number | null;
          reps?: number | null;
          weight_kg?: number | null;
          rest_seconds?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          order_index?: number;
          sets?: number | null;
          reps?: number | null;
          weight_kg?: number | null;
          rest_seconds?: number | null;
          notes?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          post_type: string | null;
          workout_id: string | null;
          image_urls: string[] | null;
          video_url: string | null;
          hashtags: string[] | null;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          reposts_count: number;
          is_public: boolean;
          is_original: boolean;
          original_post_id: string | null;
          shared_from_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          post_type?: string | null;
          workout_id?: string | null;
          image_urls?: string[] | null;
          video_url?: string | null;
          hashtags?: string[] | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          reposts_count?: number;
          is_public?: boolean;
          is_original?: boolean;
          original_post_id?: string | null;
          shared_from_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          post_type?: string;
          workout_id?: string | null;
          image_urls?: string[] | null;
          video_url?: string | null;
          hashtags?: string[] | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          reposts_count?: number;
          is_public?: boolean;
          is_original?: boolean;
          original_post_id?: string | null;
          shared_from_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          content: string;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          content: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_shares: {
        Row: {
          id: string;
          post_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string | null;
          share_type: string;
          shared_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          shared_by_user_id: string;
          shared_with_user_id?: string | null;
          share_type?: string;
          shared_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          shared_by_user_id?: string;
          shared_with_user_id?: string | null;
          share_type?: string;
          shared_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      shared_workouts: {
        Row: {
          id: string;
          original_workout_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string;
          shared_at: string;
          is_accepted: boolean;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          original_workout_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string;
          shared_at?: string;
          is_accepted?: boolean;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          original_workout_id?: string;
          shared_by_user_id?: string;
          shared_with_user_id?: string;
          shared_at?: string;
          is_accepted?: boolean;
          accepted_at?: string | null;
        };
      };
      post_reposts: {
        Row: {
          id: string;
          original_post_id: string;
          reposted_by_user_id: string;
          reposted_at: string;
        };
        Insert: {
          id?: string;
          original_post_id: string;
          reposted_by_user_id: string;
          reposted_at?: string;
        };
        Update: {
          id?: string;
          original_post_id?: string;
          reposted_by_user_id?: string;
          reposted_at?: string;
        };
      };
      user_dietary_preferences: {
        Row: {
          id: string;
          user_id: string;
          dietary_restrictions: string[] | null;
          allergies: string[] | null;
          preferred_cuisines: string[] | null;
          disliked_foods: string[] | null;
          daily_calorie_target: number | null;
          protein_target_percentage: number | null;
          carb_target_percentage: number | null;
          fat_target_percentage: number | null;
          meal_preferences: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dietary_restrictions?: string[] | null;
          allergies?: string[] | null;
          preferred_cuisines?: string[] | null;
          disliked_foods?: string[] | null;
          daily_calorie_target?: number | null;
          protein_target_percentage?: number | null;
          carb_target_percentage?: number | null;
          fat_target_percentage?: number | null;
          meal_preferences?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dietary_restrictions?: string[] | null;
          allergies?: string[] | null;
          preferred_cuisines?: string[] | null;
          disliked_foods?: string[] | null;
          daily_calorie_target?: number | null;
          protein_target_percentage?: number | null;
          carb_target_percentage?: number | null;
          fat_target_percentage?: number | null;
          meal_preferences?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          height_cm: number | null;
          weight_kg: number | null;
          body_fat_percentage: number | null;
          target_weight_kg: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          body_fat_percentage?: number | null;
          target_weight_kg?: number | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          body_fat_percentage?: number | null;
          target_weight_kg?: number | null;
          recorded_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types to extract Row types from tables
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];