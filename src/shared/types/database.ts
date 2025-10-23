// Database types for GymPal application
// Generated from the new database schema

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
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
          preferences: Record<string, any>;
          social_links: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          bio?: string;
          date_of_birth?: string;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
          fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          timezone?: string;
          language?: string;
          is_active?: boolean;
          preferences?: Record<string, any>;
          social_links?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
          bio?: string;
          date_of_birth?: string;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
          fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          timezone?: string;
          language?: string;
          is_active?: boolean;
          preferences?: Record<string, any>;
          social_links?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_personal_info: {
        Row: {
          id: string;
          user_id: string;
          age?: number;
          weight_kg?: number;
          height_cm?: number;
          bmi?: number;
          body_fat_percentage?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          age?: number;
          weight_kg?: number;
          height_cm?: number;
          bmi?: number;
          body_fat_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          age?: number;
          weight_kg?: number;
          height_cm?: number;
          bmi?: number;
          body_fat_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_fitness_profile: {
        Row: {
          id: string;
          user_id: string;
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          primary_goal: string;
          secondary_goals: string[];
          workout_frequency?: number;
          preferred_workout_duration?: number;
          available_equipment: string[];
          workout_preferences: Record<string, any>;
          injury_history: string[];
          medical_restrictions: string[];
          fitness_goals_timeline?: string;
          motivation_level?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          primary_goal: string;
          secondary_goals?: string[];
          workout_frequency?: number;
          preferred_workout_duration?: number;
          available_equipment?: string[];
          workout_preferences?: Record<string, any>;
          injury_history?: string[];
          medical_restrictions?: string[];
          fitness_goals_timeline?: string;
          motivation_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          primary_goal?: string;
          secondary_goals?: string[];
          workout_frequency?: number;
          preferred_workout_duration?: number;
          available_equipment?: string[];
          workout_preferences?: Record<string, any>;
          injury_history?: string[];
          medical_restrictions?: string[];
          fitness_goals_timeline?: string;
          motivation_level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_dietary_preferences: {
        Row: {
          id: string;
          user_id: string;
          dietary_restrictions: string[];
          allergies: string[];
          preferred_cuisines: string[];
          disliked_foods: string[];
          daily_calorie_target?: number;
          protein_target_percentage?: number;
          carb_target_percentage?: number;
          fat_target_percentage?: number;
          meal_preferences?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dietary_restrictions?: string[];
          allergies?: string[];
          preferred_cuisines?: string[];
          disliked_foods?: string[];
          daily_calorie_target?: number;
          protein_target_percentage?: number;
          carb_target_percentage?: number;
          fat_target_percentage?: number;
          meal_preferences?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dietary_restrictions?: string[];
          allergies?: string[];
          preferred_cuisines?: string[];
          disliked_foods?: string[];
          daily_calorie_target?: number;
          protein_target_percentage?: number;
          carb_target_percentage?: number;
          fat_target_percentage?: number;
          meal_preferences?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          height_cm?: number;
          weight_kg?: number;
          body_fat_percentage?: number;
          target_weight_kg?: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          height_cm?: number;
          weight_kg?: number;
          body_fat_percentage?: number;
          target_weight_kg?: number;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          height_cm?: number;
          weight_kg?: number;
          body_fat_percentage?: number;
          target_weight_kg?: number;
          recorded_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean;
          push_notifications: boolean;
          workout_reminders: boolean;
          timezone: string;
          language: string;
          theme: 'light' | 'dark' | 'auto';
          profile_visibility: boolean;
          workout_visibility: boolean;
          progress_visibility: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          workout_reminders?: boolean;
          timezone?: string;
          language?: string;
          theme?: 'light' | 'dark' | 'auto';
          profile_visibility?: boolean;
          workout_visibility?: boolean;
          progress_visibility?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          workout_reminders?: boolean;
          timezone?: string;
          language?: string;
          theme?: 'light' | 'dark' | 'auto';
          profile_visibility?: boolean;
          workout_visibility?: boolean;
          progress_visibility?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          muscle_group: string;
          muscle_groups?: string[];
          equipment?: string[];
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          instructions?: string;
          video_url?: string;
          image_url?: string;
          tags?: string[];
          is_public?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          muscle_group?: string;
          muscle_groups?: string[];
          equipment?: string[];
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          instructions?: string;
          video_url?: string;
          image_url?: string;
          tags?: string[];
          is_public?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description?: string;
          type?: string;
          difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          duration_minutes?: number;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          type?: string;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          duration_minutes?: number;
          is_template?: boolean;
          is_public?: boolean;
          is_shared?: boolean;
          target_goal?: string;
          target_level?: string;
          days_per_week?: number;
          equipment_required?: string[];
          user_notes?: string;
          tags?: string[];
          share_count?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          type?: string;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          duration_minutes?: number;
          is_template?: boolean;
          is_public?: boolean;
          is_shared?: boolean;
          target_goal?: string;
          target_level?: string;
          days_per_week?: number;
          equipment_required?: string[];
          user_notes?: string;
          tags?: string[];
          share_count?: number;
          like_count?: number;
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
          sets?: number;
          reps?: number;
          weight_kg?: number;
          rest_seconds?: number;
          notes?: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          order_index?: number;
          sets?: number;
          reps?: number;
          weight_kg?: number;
          rest_seconds?: number;
          notes?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          order_index?: number;
          sets?: number;
          reps?: number;
          weight_kg?: number;
          rest_seconds?: number;
          notes?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          workout_id?: string;
          started_at: string;
          completed_at?: string;
          duration_minutes?: number;
          calories_burned?: number;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id?: string;
          started_at?: string;
          completed_at?: string;
          duration_minutes?: number;
          calories_burned?: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string;
          started_at?: string;
          completed_at?: string;
          duration_minutes?: number;
          calories_burned?: number;
          notes?: string;
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
          accepted_at?: string;
        };
        Insert: {
          id?: string;
          original_workout_id: string;
          shared_by_user_id: string;
          shared_with_user_id: string;
          shared_at?: string;
          is_accepted?: boolean;
          accepted_at?: string;
        };
        Update: {
          id?: string;
          original_workout_id?: string;
          shared_by_user_id?: string;
          shared_with_user_id?: string;
          shared_at?: string;
          is_accepted?: boolean;
          accepted_at?: string;
        };
      };
      posts: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          post_type?: 'achievement' | 'routine' | 'tip' | 'progress' | 'motivation' | 'question' | 'general';
          workout_id?: string;
          image_urls?: string[];
          video_url?: string;
          hashtags?: string[];
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          reposts_count?: number;
          is_public?: boolean;
          is_original?: boolean;
          original_post_id?: string;
          shared_from_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          post_type?: 'achievement' | 'routine' | 'tip' | 'progress' | 'motivation' | 'question' | 'general';
          workout_id?: string;
          image_urls?: string[];
          video_url?: string;
          hashtags?: string[];
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          reposts_count?: number;
          is_public?: boolean;
          is_original?: boolean;
          original_post_id?: string;
          shared_from_user_id?: string;
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
          parent_comment_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          content: string;
          parent_comment_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          content?: string;
          parent_comment_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_shares: {
        Row: {
          id: string;
          post_id: string;
          shared_by_user_id: string;
          shared_with_user_id?: string;
          share_type: 'share' | 'repost' | 'forward';
          shared_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          shared_by_user_id: string;
          shared_with_user_id?: string;
          share_type?: 'share' | 'repost' | 'forward';
          shared_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          shared_by_user_id?: string;
          shared_with_user_id?: string;
          share_type?: 'share' | 'repost' | 'forward';
          shared_at?: string;
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
  };
}
