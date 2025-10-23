import { Context } from 'hono';
import { supabase } from '../config/supabase.js';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../shared/utils/response.js';

// Get user notifications
export async function getNotifications(c: Context) {
  try {
    const userId = c.get('userId');
    const { page = '1', limit = '20', type, unread_only = 'false' } = c.req.query();

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('notifications')
      .select(`
        *,
        from_user:profiles!notifications_from_user_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error, count } = await query
      .range(offset, offset + limitNum - 1);

    if (error) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to fetch notifications', 500, error.message);
    }

    const totalPages = count ? Math.ceil(count / limitNum) : 0;
    const hasNext = pageNum * limitNum < (count || 0);
    const hasPrev = pageNum > 1;

    return sendSuccess(c, notifications, 'Notifications retrieved successfully', 200, {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? pageNum + 1 : undefined,
      prevPage: hasPrev ? pageNum - 1 : undefined,
    });

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Mark notification as read
export async function markNotificationAsRead(c: Context) {
  try {
    const userId = c.get('userId');
    const notificationId = c.req.param('id');

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId) // Ensure user owns the notification
      .select()
      .single();

    if (error || !notification) {
      return sendNotFound(c, 'Notification');
    }

    return sendSuccess(c, notification, 'Notification marked as read');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(c: Context) {
  try {
    const userId = c.get('userId');

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to mark notifications as read', 500, error.message);
    }

    return sendSuccess(c, { message: 'All notifications marked as read' }, 'All notifications marked as read');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Delete notification
export async function deleteNotification(c: Context) {
  try {
    const userId = c.get('userId');
    const notificationId = c.req.param('id');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId); // Ensure user owns the notification

    if (error) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to delete notification', 500, error.message);
    }

    return sendSuccess(c, { message: 'Notification deleted successfully' }, 'Notification deleted successfully');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Get notification settings
export async function getNotificationSettings(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('notifications')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return sendError(c, 'DATABASE_ERROR', 'Failed to fetch notification settings', 500, error.message);
    }

    // Return default settings if none exist
    const defaultSettings = {
      email: true,
      push: false,
      sms: false,
      workout_reminders: true,
      social_updates: true,
      achievement_unlocks: true,
      weekly_reports: true,
      new_follower: true,
      new_like: true,
      new_comment: true,
      new_share: true,
      workout_reminder_time: '09:00',
      weekly_report_day: 'monday'
    };

    return sendSuccess(c, settings?.notifications || defaultSettings, 'Notification settings retrieved successfully');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Update notification settings
export async function updateNotificationSettings(c: Context, body: any) {
  try {
    const userId = c.get('userId');
    const {
      email,
      push,
      sms,
      workout_reminders,
      social_updates,
      achievement_unlocks,
      weekly_reports,
      new_follower,
      new_like,
      new_comment,
      new_share,
      workout_reminder_time,
      weekly_report_day
    } = body;

    // Check if settings exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('user_settings')
      .select('id, notifications')
      .eq('user_id', userId)
      .single();

    const notificationSettings = {
      email,
      push,
      sms,
      workout_reminders,
      social_updates,
      achievement_unlocks,
      weekly_reports,
      new_follower,
      new_like,
      new_comment,
      new_share,
      workout_reminder_time,
      weekly_report_day
    };

    let settings;

    if (checkError && checkError.code === 'PGRST116') {
      // Create new settings
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          notifications: notificationSettings
        })
        .select()
        .single();

      if (error) {
        return sendError(c, 'DATABASE_ERROR', 'Failed to create notification settings', 500, error.message);
      }

      settings = data;
    } else if (checkError) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to check existing settings', 500, checkError.message);
    } else {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          notifications: notificationSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return sendError(c, 'DATABASE_ERROR', 'Failed to update notification settings', 500, error.message);
      }

      settings = data;
    }

    return sendSuccess(c, settings.notifications, 'Notification settings updated successfully');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Create notification
export async function createNotification(notificationData: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  fromUserId?: string;
}) {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        from_user_id: notificationData.fromUserId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Send workout reminder
export async function sendWorkoutReminder(c: Context) {
  try {
    const userId = c.get('userId');
    const { workoutId, reminderTime } = await c.req.json();

    // Get user's notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('notifications')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.notifications?.workout_reminders) {
      return sendError(c, 'SETTINGS_ERROR', 'Workout reminders are disabled', 400);
    }

    // Create workout reminder
    const { data: reminder, error } = await supabase
      .from('workout_reminders')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        reminder_time: reminderTime,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to create workout reminder', 500, error.message);
    }

    return sendCreated(c, reminder, 'Workout reminder created successfully');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Get workout reminders
export async function getWorkoutReminders(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: reminders, error } = await supabase
      .from('workout_reminders')
      .select(`
        *,
        workout:workouts(
          id,
          name,
          type,
          difficulty
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('reminder_time', { ascending: true });

    if (error) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to fetch workout reminders', 500, error.message);
    }

    return sendSuccess(c, reminders, 'Workout reminders retrieved successfully');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Delete workout reminder
export async function deleteWorkoutReminder(c: Context) {
  try {
    const userId = c.get('userId');
    const reminderId = c.req.param('id');

    const { error } = await supabase
      .from('workout_reminders')
      .update({ is_active: false })
      .eq('id', reminderId)
      .eq('user_id', userId);

    if (error) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to delete workout reminder', 500, error.message);
    }

    return sendSuccess(c, { message: 'Workout reminder deleted successfully' }, 'Workout reminder deleted successfully');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}

// Notification types and templates
export const NOTIFICATION_TYPES = {
  WORKOUT_REMINDER: 'workout_reminder',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  NEW_FOLLOWER: 'new_follower',
  NEW_LIKE: 'new_like',
  NEW_COMMENT: 'new_comment',
  NEW_SHARE: 'new_share',
  WORKOUT_COMPLETED: 'workout_completed',
  GOAL_ACHIEVED: 'goal_achieved',
  WEEKLY_REPORT: 'weekly_report',
  SOCIAL_UPDATE: 'social_update',
  SYSTEM_UPDATE: 'system_update'
} as const;

export const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.WORKOUT_REMINDER]: {
    title: 'Workout Reminder',
    message: 'Time for your {workout_name} workout!'
  },
  [NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED]: {
    title: 'Achievement Unlocked!',
    message: 'Congratulations! You\'ve unlocked the "{achievement_name}" achievement.'
  },
  [NOTIFICATION_TYPES.NEW_FOLLOWER]: {
    title: 'New Follower',
    message: '{username} started following you!'
  },
  [NOTIFICATION_TYPES.NEW_LIKE]: {
    title: 'New Like',
    message: '{username} liked your {content_type}!'
  },
  [NOTIFICATION_TYPES.NEW_COMMENT]: {
    title: 'New Comment',
    message: '{username} commented on your {content_type}!'
  },
  [NOTIFICATION_TYPES.NEW_SHARE]: {
    title: 'New Share',
    message: '{username} shared your {content_type}!'
  },
  [NOTIFICATION_TYPES.WORKOUT_COMPLETED]: {
    title: 'Workout Completed!',
    message: 'Great job! You completed your {workout_name} workout.'
  },
  [NOTIFICATION_TYPES.GOAL_ACHIEVED]: {
    title: 'Goal Achieved!',
    message: 'Congratulations! You\'ve achieved your "{goal_name}" goal!'
  },
  [NOTIFICATION_TYPES.WEEKLY_REPORT]: {
    title: 'Weekly Report',
    message: 'Your weekly fitness report is ready!'
  },
  [NOTIFICATION_TYPES.SOCIAL_UPDATE]: {
    title: 'Social Update',
    message: '{message}'
  },
  [NOTIFICATION_TYPES.SYSTEM_UPDATE]: {
    title: 'System Update',
    message: '{message}'
  }
} as const;

// Helper function to format notification message
export function formatNotificationMessage(template: string, variables: Record<string, string>): string {
  let message = template;
  
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  return message;
}

// Batch notification creation
export async function createBatchNotifications(notifications: Array<{
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  fromUserId?: string;
}>) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications.map(notification => ({
        ...notification,
        created_at: new Date().toISOString()
      })))
      .select();

    if (error) {
      console.error('Failed to create batch notifications:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating batch notifications:', error);
    return null;
  }
}

// Get notification statistics
export async function getNotificationStats(c: Context) {
  try {
    const userId = c.get('userId');

    const { data: stats, error } = await supabase
      .from('notifications')
      .select('type, is_read, created_at')
      .eq('user_id', userId);

    if (error) {
      return sendError(c, 'DATABASE_ERROR', 'Failed to fetch notification stats', 500, error.message);
    }

    const totalNotifications = stats?.length || 0;
    const unreadNotifications = stats?.filter(n => !n.is_read).length || 0;
    const readNotifications = totalNotifications - unreadNotifications;

    const typeStats = stats?.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return sendSuccess(c, {
      total: totalNotifications,
      unread: unreadNotifications,
      read: readNotifications,
      byType: typeStats
    }, 'Notification statistics retrieved successfully');

  } catch (error: any) {
    return sendError(c, 'INTERNAL_ERROR', 'Internal server error', 500, error.message);
  }
}
