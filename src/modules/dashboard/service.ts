/**
 * Dashboard Service
 * Business logic layer for dashboard analytics and statistics
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { selectRows } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { RecentActivity } from './types.js';
import type { Database } from '../../core/types/index.js';

export const dashboardService = {
  /**
   * Gets dashboard overview for a user
   */
  async getOverview(userId: string, dbClient?: SupabaseClient<Database>, referenceDate?: string): Promise<any> {
    const client = dbClient || supabase;
    const now = referenceDate ? new Date(referenceDate) : new Date();
    const todayStr = referenceDate || now.toISOString().split('T')[0];

    // Get workout count (total workouts created)
    const { count: workoutCount } = await client
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Calculate start of current week (Monday) based on reference date
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7; // Make Sunday (0) the last day
    if (day !== 1) {
        startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    }
    startOfWeek.setHours(0, 0, 0, 0);
    // If reference date is provided, we use it as "Today".
    // startOfWeek is now Monday of that week.

    // Get completed scheduled workouts this week
    const { data: completedThisWeek } = await client
      .from('scheduled_workouts')
      .select('workout_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('scheduled_date', startOfWeek.toISOString().split('T')[0]);

    const completedWorkoutIds = (completedThisWeek || []).map((sw: any) => sw.workout_id);

    // Count total exercises from completed routines this week
    let totalExercisesFromCompleted = 0;
    if (completedWorkoutIds.length > 0) {
      const { count: exerciseCount } = await client
        .from('workout_exercises')
        .select('*', { count: 'exact', head: true })
        .in('workout_id', completedWorkoutIds);
      totalExercisesFromCompleted = exerciseCount || 0;
    }

    // Calculate Streak
    const { data: allCompletedDates } = await client
      .from('scheduled_workouts')
      .select('scheduled_date')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false });

    let streak = 0;
    if (allCompletedDates && allCompletedDates.length > 0) {
      const distinctDates = [...new Set(allCompletedDates.map((d: any) => d.scheduled_date))];
      
      // Check streak relative to "Today" (referenceDate)
      const today = todayStr;
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      const firstDate = distinctDates[0];
      if (firstDate === today || firstDate === yesterday) {
        streak = 1;
        let previousDate = new Date(firstDate);
        for (let i = 1; i < distinctDates.length; i++) {
          const currentDateStr = distinctDates[i];
          const expectedDate = new Date(previousDate);
          expectedDate.setDate(expectedDate.getDate() - 1);
          const expectedDateStr = expectedDate.toISOString().split('T')[0];

          if (currentDateStr === expectedDateStr) {
            streak++;
            previousDate = expectedDate;
          } else {
            break;
          }
        }
      }
    }

    // Get Today's Workout
    const { data: todayScheduled } = await client
      .from('scheduled_workouts')
      .select(`
        *,
        workout:workouts(*)
      `)
      .eq('user_id', userId)
      .eq('scheduled_date', todayStr)
      .maybeSingle();

    // Get recent workouts
    const { data: recentWorkouts } = await client
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      stats: {
        total_workouts: workoutCount || 0,
        total_exercises: totalExercisesFromCompleted, // Exercises from completed routines
        completed_routines_this_week: completedThisWeek?.length || 0,
        streak: streak,
      },
      recent_workouts: recentWorkouts || [],
      today_workout: todayScheduled?.workout || null,
    };
  },

  /**
   * Gets statistics for a specific period
   */
  async getStats(userId: string, period: string, dbClient?: SupabaseClient<Database>, referenceDate?: string): Promise<Unified.DashboardStats> {
    const client = dbClient || supabase;
    let startDate: Date;
    const now = referenceDate ? new Date(referenceDate) : new Date();

    switch (period) {
      case 'week':
        // Start of current week (Monday)
        startDate = new Date(now);
        const day = startDate.getDay() || 7;
        if (day !== 1) {
            startDate.setDate(startDate.getDate() - day + 1);
        }
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        startDate = new Date(0); // All time
        break;
      default:
        // Default to last 30 days if unknown period
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get completed scheduled workouts in period
    const { data: completedScheduled } = await client
      .from('scheduled_workouts')
      .select('workout_id, scheduled_date')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('scheduled_date', startDate.toISOString().split('T')[0]);

    const completedWorkoutIds = (completedScheduled || []).map((sw: any) => sw.workout_id);
    const totalWorkouts = completedScheduled?.length || 0;

    // Get workout details for duration calculation
    let totalDuration = 0;
    let totalExercises = 0;
    
    if (completedWorkoutIds.length > 0) {
      // Get workout details
      const { data: workouts } = await client
        .from('workouts')
        .select('id, duration_minutes')
        .in('id', completedWorkoutIds);

      // Calculate total duration
      const workoutsWithDuration = (workouts || []) as Array<{ duration_minutes?: number }>;
      totalDuration = workoutsWithDuration.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);

      // Count total exercises from completed workouts
      const { count: exerciseCount } = await client
        .from('workout_exercises')
        .select('*', { count: 'exact', head: true })
        .in('workout_id', completedWorkoutIds);
      
      totalExercises = exerciseCount || 0;
    }

    const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    return {
      total_workouts: totalWorkouts,
      total_exercises: totalExercises,
      total_duration: totalDuration,
      average_duration: Math.round(averageDuration),
    };
  },

  /**
   * Gets recent activity
   */
  async getRecentActivity(userId: string, limit: number = 10, dbClient?: SupabaseClient<Database>): Promise<RecentActivity[]> {
    const client = dbClient || supabase;
    const activities: RecentActivity[] = [];

    // Get recent workouts
    const { data: workouts } = await client
      .from('workouts')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    workouts?.forEach((workout: any) => {
      activities.push({
        type: 'workout',
        description: `Created workout: ${workout.name}`,
        created_at: workout.created_at,
      });
    });

    // Get recent posts
    const { data: posts } = await client
      .from('posts')
      .select('id, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    posts?.forEach((post: any) => {
      activities.push({
        type: 'post',
        description: `Posted: ${post.content.substring(0, 50)}...`,
        created_at: post.created_at,
      });
    });

    // Sort by date and limit
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },
};

