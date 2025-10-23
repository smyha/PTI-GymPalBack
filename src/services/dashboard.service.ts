import { Context } from 'hono';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';

// Get dashboard overview
export async function getDashboardOverview(c: Context) {
  try {
    const userId = c.get('userId');

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, fitness_level, created_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return sendNotFound(c, API_MESSAGES.USER_NOT_FOUND);
    }

    // Get workout count
    const { count: workoutCount } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get workout session count
    const { count: sessionCount } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get routine count
    const { count: routineCount } = await supabase
      .from('routines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get post count
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Get recent workouts
    const { data: recentWorkouts } = await supabase
      .from('workouts')
      .select('id, name, duration, difficulty, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent posts
    const { data: recentPosts } = await supabase
      .from('posts')
      .select(`
        id, content, created_at,
        profiles!posts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent followers
    const { data: recentFollowers } = await supabase
      .from('follows')
      .select(`
        created_at,
        profiles!follows_follower_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const overview = {
      profile,
      stats: {
        workouts: workoutCount || 0,
        routines: routineCount || 0,
        posts: postCount || 0,
        followers: followerCount || 0,
        following: followingCount || 0
      },
      recent: {
        workouts: recentWorkouts || [],
        posts: recentPosts || [],
        followers: recentFollowers || []
      }
    };

    return sendSuccess(c, overview, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get dashboard overview error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get workout statistics
export async function getWorkoutStats(c: Context, period: string = 'week') {
  try {
    const userId = c.get('userId');

    // Validate period
    const validPeriods = ['day', 'week', 'month', 'year'];
    if (!validPeriods.includes(period)) {
      return sendError(c, ERROR_CODES.VALIDATION_ERROR, 'Invalid period', 400);
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get workouts in period
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, name, duration, difficulty, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (workoutsError) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get workout stats', 500, workoutsError.message);
    }

    // Calculate statistics
    const totalWorkouts = workouts?.length || 0;
    const totalDuration = workouts?.reduce((sum, workout) => sum + (workout.duration || 0), 0) || 0;
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    // Group by difficulty
    const difficultyStats = workouts?.reduce((acc, workout) => {
      const difficulty = workout.difficulty || 'unknown';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Group by day
    const dailyStats = workouts?.reduce((acc, workout) => {
      const date = new Date(workout.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const stats = {
      period,
      totalWorkouts,
      totalDuration,
      avgDuration: Math.round(avgDuration * 100) / 100,
      difficultyStats,
      dailyStats
    };

    return sendSuccess(c, stats, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get workout stats error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get social statistics
export async function getSocialStats(c: Context) {
  try {
    const userId = c.get('userId');

    // Get follower count
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Get post count
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total likes received
    const { data: posts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    const postIds = posts?.map(p => p.id) || [];

    let totalLikes = 0;
    if (postIds.length > 0) {
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);
      totalLikes = likesCount || 0;
    }

    // Get total comments received
    let totalComments = 0;
    if (postIds.length > 0) {
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);
      totalComments = commentsCount || 0;
    }

    // Get recent followers
    const { data: recentFollowers } = await supabase
      .from('follows')
      .select(`
        created_at,
        profiles!follows_follower_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const stats = {
      followers: followerCount || 0,
      following: followingCount || 0,
      posts: postCount || 0,
      totalLikes,
      totalComments,
      recentFollowers: recentFollowers || []
    };

    return sendSuccess(c, stats, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get social stats error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get activity feed
export async function getActivityFeed(c: Context, limit: number = 20, offset: number = 0) {
  try {
    const userId = c.get('userId');

    // Get posts from users that the current user follows
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id, content, images, created_at, workout_id, routine_id,
        profiles!posts_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('is_public', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (postsError) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get activity feed', 500, postsError.message);
    }

    // Get likes and comments for each post
    const postsWithStats = await Promise.all(
      (posts || []).map(async (post) => {
        // Get like count
        const { count: likeCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Get comment count
        const { count: commentCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Check if current user liked this post
        const { data: userLike } = await supabase
          .from('post_likes')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', post.id)
          .single();

        return {
          ...post,
          stats: {
            likes: likeCount || 0,
            comments: commentCount || 0
          },
          userLiked: !!userLike
        };
      })
    );

    return sendSuccess(c, postsWithStats, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get activity feed error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get notifications
export async function getNotifications(c: Context, limit: number = 20, offset: number = 0) {
  try {
    const userId = c.get('userId');

    // Get notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        id, type, title, message, data, read, created_at,
        profiles!notifications_from_user_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get notifications', 500, error.message);
    }

    return sendSuccess(c, notifications, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Mark notification as read
export async function markNotificationAsRead(c: Context, notificationId: string) {
  try {
    const userId = c.get('userId');

    // Check if notification exists and belongs to user
    const { data: notification, error: checkError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single();

    if (checkError || !notification) {
      return sendNotFound(c, 'Notification not found');
    }

    if (notification.user_id !== userId) {
      return sendError(c, ERROR_CODES.FORBIDDEN, 'Not authorized to update this notification', 403);
    }

    // Mark as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to mark notification as read', 500, error.message);
    }

    return sendSuccess(c, null, 'Notification marked as read');

  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(c: Context) {
  try {
    const userId = c.get('userId');

    // Mark all notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to mark all notifications as read', 500, error.message);
    }

    return sendSuccess(c, null, 'All notifications marked as read');

  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(c: Context) {
  try {
    const userId = c.get('userId');

    // Get unread notification count
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      return sendError(c, ERROR_CODES.INTERNAL_ERROR, 'Failed to get unread notification count', 500, error.message);
    }

    return sendSuccess(c, { count: count || 0 }, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get unread notification count error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user dashboard (alias for getDashboardOverview)
export async function getUserDashboard(c: Context) {
  return getDashboardOverview(c);
}

// Get dashboard stats (alias for getWorkoutStats)
export async function getDashboardStats(c: Context, query: any = {}) {
  const { period = 'week' } = query;
  return getWorkoutStats(c, period);
}

// Get recent activity (alias for getActivityFeed)
export async function getRecentActivity(c: Context, query: any = {}) {
  const { limit = 20, offset = 0 } = query;
  return getActivityFeed(c, parseInt(limit), parseInt(offset));
}

// Get workout progress (alias for getWorkoutStats)
export async function getWorkoutProgress(c: Context, query: any = {}) {
  const { period = 'month' } = query;
  return getWorkoutStats(c, period);
}

// Get user achievements
export async function getUserAchievements(c: Context, query: any = {}) {
  try {
    const userId = c.get('userId');
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: achievements, error, count } = await supabase
      .from('achievements')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch achievements', 500, error.message);
    }

    return sendSuccess(c, achievements, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user achievements error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get user goals
export async function getUserGoals(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: goals, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to fetch goals', 500, error.message);
    }

    return sendSuccess(c, goals, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get user goals error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Create goal
export async function createGoal(c: Context, body: any) {
  try {
    const userId = c.get('userId');

    const { data: goal, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        ...body,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to create goal', 500, error.message);
    }

    return sendSuccess(c, goal, API_MESSAGES.GOAL_CREATED, 201);

  } catch (error: any) {
    console.error('Create goal error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Update goal
export async function updateGoal(c: Context, goalId: string, body: any) {
  try {
    const { data: goal, error } = await supabase
      .from('user_goals')
      .update(body)
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to update goal', 500, error.message);
    }

    return sendSuccess(c, goal, API_MESSAGES.GOAL_UPDATED);

  } catch (error: any) {
    console.error('Update goal error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Delete goal
export async function deleteGoal(c: Context, goalId: string) {
  try {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to delete goal', 500, error.message);
    }

    return sendSuccess(c, null, API_MESSAGES.GOAL_DELETED);

  } catch (error: any) {
    console.error('Delete goal error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get analytics (combined stats)
export async function getAnalytics(c: Context, query: any = {}) {
  const { period = 'week' } = query;
  
  try {
    const workoutStats = await getWorkoutStats(c, period);
    const socialStats = await getSocialStats(c);
    
    return sendSuccess(c, {
      workout: (workoutStats as any).data,
      social: (socialStats as any).data,
      period
    }, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get analytics error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get leaderboard
export async function getLeaderboard(c: Context, query: any = {}) {
  try {
    const { type = 'workouts', limit = 10 } = query;

    const { data: leaderboard, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .order('total_workouts', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to get leaderboard', 500, error.message);
    }

    return sendSuccess(c, leaderboard, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}

// Get calendar data
export async function getCalendarData(c: Context, query: any = {}) {
  try {
    const userId = c.get('userId');
    const { month, year } = query;

    const { data: workouts, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', `${year}-${month}-01`)
      .lt('started_at', `${year}-${parseInt(month) + 1}-01`)
      .order('started_at', { ascending: true });

    if (error) {
      return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to get calendar data', 500, error.message);
    }

    return sendSuccess(c, workouts, API_MESSAGES.SUCCESS);

  } catch (error: any) {
    console.error('Get calendar data error:', error);
    return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
  }
}