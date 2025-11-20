/**
 * Dashboard Service
 * Business logic layer for dashboard analytics and statistics
 */

import { selectRows } from '../../core/config/database-helpers.js';
import { supabase } from '../../core/config/database.js';
import { AppError, ErrorCode } from '../../core/utils/error-types.js';
import type * as Unified from '../../core/types/unified.types.js';
import type { RecentActivity } from './types.js';

export const dashboardService = {
  /**
   * Gets dashboard overview for a user
   */
  async getOverview(userId: string): Promise<any> {
    // Get workout count
    const { count: workoutCount } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get exercise count
    const { count: exerciseCount } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get recent workouts
    const { data: recentWorkouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      stats: {
        total_workouts: workoutCount || 0,
        total_exercises: exerciseCount || 0,
      },
      recent_workouts: recentWorkouts || [],
    };
  },

  /**
   * Gets statistics for a specific period
   */
  async getStats(userId: string, period: string): Promise<Unified.DashboardStats> {
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get workouts in period
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    const totalWorkouts = workouts?.length || 0;
    // Ensure proper typing for duration aggregation
    const workoutsWithDuration = (workouts || []) as Array<{ duration_minutes?: number }>;
    const totalDuration = workoutsWithDuration.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    // Get exercises count
    const { count: totalExercises } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      total_workouts: totalWorkouts,
      total_exercises: totalExercises || 0,
      total_duration: totalDuration,
      average_duration: Math.round(averageDuration),
    };
  },

  /**
   * Gets recent activity
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Get recent workouts
    const { data: workouts } = await supabase
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
    const { data: posts } = await supabase
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

