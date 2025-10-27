import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError, sendNotFound } from '../shared/utils/response.js';
import { API_MESSAGES, ERROR_CODES } from '../shared/constants/index.js';
// Get dashboard overview
export async function getDashboardOverview(c) {
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
    }
    catch (error) {
        console.error('Get dashboard overview error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, error.message);
    }
}
// Get workout statistics
export async function getWorkoutStats(c, period = 'week') {
    try {
        const userId = c.get('userId');
        // Validate period
        const validPeriods = ['day', 'week', 'month', 'year'];
        if (!validPeriods.includes(period)) {
            return sendError(c, ERROR_CODES.VALIDATION_ERROR, 'Invalid period', 400);
        }
        // Calculate date range
        const now = new Date();
        let startDate;
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
        const workoutsData = (workouts || []);
        const totalWorkouts = workoutsData.length;
        const totalDuration = workoutsData.reduce((sum, workout) => sum + (workout.duration || 0), 0);
        const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
        // Group by difficulty
        const difficultyStats = workoutsData.reduce((acc, workout) => {
            const difficulty = workout.difficulty || 'unknown';
            acc[difficulty] = (acc[difficulty] || 0) + 1;
            return acc;
        }, {});
        // Group by day
        const dailyStats = workoutsData.reduce((acc, workout) => {
            const date = new Date(workout.created_at).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const stats = {
            period,
            totalWorkouts,
            totalDuration,
            avgDuration: Math.round(avgDuration * 100) / 100,
            difficultyStats,
            dailyStats
        };
        return sendSuccess(c, stats, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Get workout stats error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get social statistics
export async function getSocialStats(c) {
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
        const postsData = (posts || []);
        const postIds = postsData.map(p => p.id);
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Get social stats error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get activity feed
export async function getActivityFeed(c, query = {}) {
    try {
        const userId = c.get('userId');
        const { limit = 20, offset = 0 } = query;
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
        const postsData = (posts || []);
        const postsWithStats = await Promise.all(postsData.map(async (post) => {
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
        }));
        return sendSuccess(c, postsWithStats, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Get activity feed error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get user dashboard (alias for getDashboardOverview)
export async function getUserDashboard(c) {
    return getDashboardOverview(c);
}
// Get dashboard stats (alias for getWorkoutStats)
export async function getDashboardStats(c, query = {}) {
    const { period = 'week' } = query;
    return getWorkoutStats(c, period);
}
// Get recent activity (alias for getActivityFeed)
export async function getRecentActivity(c, query = {}) {
    return getActivityFeed(c, query);
}
// Get workout progress (alias for getWorkoutStats)
export async function getWorkoutProgress(c, query = {}) {
    const { period = 'month' } = query;
    return getWorkoutStats(c, period);
}
// Get analytics (combined stats)
export async function getAnalytics(c, query = {}) {
    const { period = 'week' } = query;
    try {
        const workoutStats = await getWorkoutStats(c, period);
        const socialStats = await getSocialStats(c);
        return sendSuccess(c, {
            workout: workoutStats.data,
            social: socialStats.data,
            period
        }, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Get analytics error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get leaderboard
export async function getLeaderboard(c, query = {}) {
    try {
        const { type = 'workouts', limit = 10 } = query;
        const { data: leaderboard, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) {
            return sendError(c, ERROR_CODES.DATABASE_ERROR, 'Failed to get leaderboard', 500, error.message);
        }
        return sendSuccess(c, leaderboard, API_MESSAGES.SUCCESS);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Get leaderboard error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
// Get calendar data
export async function getCalendarData(c, query) {
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Get calendar data error:', error);
        return sendError(c, ERROR_CODES.INTERNAL_ERROR, API_MESSAGES.INTERNAL_ERROR, 500, message);
    }
}
