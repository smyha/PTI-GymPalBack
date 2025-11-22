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
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          equipment: string[] | null
          id: string
          image_url: string | null
          instructions: string | null
          is_public: boolean | null
          muscle_group: string
          muscle_groups: string[] | null
          name: string
          tags: string[] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_public?: boolean | null
          muscle_group: string
          muscle_groups?: string[] | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_public?: boolean | null
          muscle_group?: string
          muscle_groups?: string[] | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          id: string
          original_post_id: string
          reposted_at: string | null
          reposted_by_user_id: string
        }
        Insert: {
          id?: string
          original_post_id: string
          reposted_at?: string | null
          reposted_by_user_id: string
        }
        Update: {
          id?: string
          original_post_id?: string
          reposted_at?: string | null
          reposted_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reposts_reposted_by_user_id_fkey"
            columns: ["reposted_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          id: string
          post_id: string
          share_type: string | null
          shared_at: string | null
          shared_by_user_id: string
          shared_with_user_id: string | null
        }
        Insert: {
          id?: string
          post_id: string
          share_type?: string | null
          shared_at?: string | null
          shared_by_user_id: string
          shared_with_user_id?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          share_type?: string | null
          shared_at?: string | null
          shared_by_user_id?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_urls: string[] | null
          is_original: boolean | null
          is_public: boolean | null
          likes_count: number | null
          original_post_id: string | null
          post_type: string | null
          reposts_count: number | null
          shared_from_user_id: string | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
          video_url: string | null
          workout_id: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_original?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          original_post_id?: string | null
          post_type?: string | null
          reposts_count?: number | null
          shared_from_user_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
          workout_id?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_original?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          original_post_id?: string | null
          post_type?: string | null
          reposts_count?: number | null
          shared_from_user_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_from_user_id_fkey"
            columns: ["shared_from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          fitness_level: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          language: string | null
          preferences: Json | null
          social_links: Json | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          fitness_level?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          language?: string | null
          preferences?: Json | null
          social_links?: Json | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          fitness_level?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          preferences?: Json | null
          social_links?: Json | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      scheduled_workouts: {
        Row: {
          created_at: string | null
          id: string
          scheduled_date: string
          status: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          scheduled_date: string
          status?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          scheduled_date?: string
          status?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_workouts: {
        Row: {
          accepted_at: string | null
          id: string
          is_accepted: boolean | null
          original_workout_id: string
          shared_at: string | null
          shared_by_user_id: string
          shared_with_user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          is_accepted?: boolean | null
          original_workout_id: string
          shared_at?: string | null
          shared_by_user_id: string
          shared_with_user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          is_accepted?: boolean | null
          original_workout_id?: string
          shared_at?: string | null
          shared_by_user_id?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_workouts_original_workout_id_fkey"
            columns: ["original_workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_workouts_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_workouts_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dietary_preferences: {
        Row: {
          allergies: string[] | null
          carb_target_percentage: number | null
          created_at: string | null
          daily_calorie_target: number | null
          dietary_restrictions: string[] | null
          disliked_foods: string[] | null
          fat_target_percentage: number | null
          id: string
          meal_preferences: string | null
          preferred_cuisines: string[] | null
          protein_target_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          carb_target_percentage?: number | null
          created_at?: string | null
          daily_calorie_target?: number | null
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          fat_target_percentage?: number | null
          id?: string
          meal_preferences?: string | null
          preferred_cuisines?: string[] | null
          protein_target_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          carb_target_percentage?: number | null
          created_at?: string | null
          daily_calorie_target?: number | null
          dietary_restrictions?: string[] | null
          disliked_foods?: string[] | null
          fat_target_percentage?: number | null
          id?: string
          meal_preferences?: string | null
          preferred_cuisines?: string[] | null
          protein_target_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dietary_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fitness_profile: {
        Row: {
          available_equipment: string[] | null
          created_at: string | null
          experience_level: string | null
          fitness_goals_timeline: string | null
          id: string
          injury_history: string[] | null
          medical_restrictions: string[] | null
          motivation_level: number | null
          preferred_workout_duration: number | null
          primary_goal: string
          secondary_goals: string[] | null
          updated_at: string | null
          user_id: string
          workout_frequency: number | null
          workout_preferences: Json | null
        }
        Insert: {
          available_equipment?: string[] | null
          created_at?: string | null
          experience_level?: string | null
          fitness_goals_timeline?: string | null
          id?: string
          injury_history?: string[] | null
          medical_restrictions?: string[] | null
          motivation_level?: number | null
          preferred_workout_duration?: number | null
          primary_goal: string
          secondary_goals?: string[] | null
          updated_at?: string | null
          user_id: string
          workout_frequency?: number | null
          workout_preferences?: Json | null
        }
        Update: {
          available_equipment?: string[] | null
          created_at?: string | null
          experience_level?: string | null
          fitness_goals_timeline?: string | null
          id?: string
          injury_history?: string[] | null
          medical_restrictions?: string[] | null
          motivation_level?: number | null
          preferred_workout_duration?: number | null
          primary_goal?: string
          secondary_goals?: string[] | null
          updated_at?: string | null
          user_id?: string
          workout_frequency?: number | null
          workout_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_fitness_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personal_info: {
        Row: {
          age: number | null
          bmi: number | null
          body_fat_percentage: number | null
          created_at: string | null
          height_cm: number | null
          id: string
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_personal_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          profile_visibility: boolean | null
          progress_visibility: boolean | null
          push_notifications: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          workout_reminders: boolean | null
          workout_visibility: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          profile_visibility?: boolean | null
          progress_visibility?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          workout_reminders?: boolean | null
          workout_visibility?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          profile_visibility?: boolean | null
          progress_visibility?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          workout_reminders?: boolean | null
          workout_visibility?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          body_fat_percentage: number | null
          height_cm: number | null
          id: string
          recorded_at: string | null
          target_weight_kg: number | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          height_cm?: number | null
          id?: string
          recorded_at?: string | null
          target_weight_kg?: number | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          height_cm?: number | null
          id?: string
          recorded_at?: string | null
          target_weight_kg?: number | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: number | null
          rest_seconds: number | null
          sets: number | null
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          calories_burned: number | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          started_at: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          calories_burned?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          started_at?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          calories_burned?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          started_at?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          days_per_week: number | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          equipment_required: string[] | null
          id: string
          is_public: boolean | null
          is_shared: boolean | null
          is_template: boolean | null
          like_count: number | null
          name: string
          share_count: number | null
          tags: string[] | null
          target_goal: string | null
          target_level: string | null
          type: string | null
          updated_at: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          created_at?: string | null
          days_per_week?: number | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          equipment_required?: string[] | null
          id?: string
          is_public?: boolean | null
          is_shared?: boolean | null
          is_template?: boolean | null
          like_count?: number | null
          name: string
          share_count?: number | null
          tags?: string[] | null
          target_goal?: string | null
          target_level?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          created_at?: string | null
          days_per_week?: number | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          equipment_required?: string[] | null
          id?: string
          is_public?: boolean | null
          is_shared?: boolean | null
          is_template?: boolean | null
          like_count?: number | null
          name?: string
          share_count?: number | null
          tags?: string[] | null
          target_goal?: string | null
          target_level?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      exercises_by_muscle_group: {
        Row: {
          exercise_count: number | null
          exercise_names: string[] | null
          muscle_group: string | null
        }
        Relationships: []
      }
      social_stats: {
        Row: {
          total_comments: number | null
          total_likes: number | null
          total_posts: number | null
          total_shares: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_stats: {
        Row: {
          avg_duration: number | null
          completed_sessions: number | null
          total_calories_burned: number | null
          total_workouts: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_interact_with_post: { Args: { post_id: string }; Returns: boolean }
      can_view_user_content: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      create_complete_user_profile: {
        Args: {
          user_bio?: string
          user_date_of_birth?: string
          user_email: string
          user_fitness_level?: string
          user_full_name: string
          user_gender?: string
          user_username: string
        }
        Returns: string
      }
      create_sample_posts: { Args: { user_id: string }; Returns: undefined }
      create_sample_workout: {
        Args: {
          workout_description: string
          workout_difficulty: string
          workout_duration: number
          workout_equipment: string[]
          workout_name: string
          workout_type: string
          workout_user_id: string
        }
        Returns: string
      }
      delete_own_account: { Args: never; Returns: undefined }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          date_of_birth: string
          email: string
          fitness_level: string
          full_name: string
          gender: string
          id: string
          is_active: boolean
          language: string
          last_sign_in_at: string
          preferences: Json
          social_links: Json
          timezone: string
          updated_at: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Helper types to extract Row types from tables
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
