/**
 * Dashboard Types
 *
 * Type definitions for dashboard-related operations
 */

// Query types
export interface NotificationsQuery {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export interface ActivityFeedQuery {
  limit?: number;
  offset?: number;
}

export interface PeriodQuery {
  period?: string;
}

export interface AchievementsQuery {
  page?: number;
  limit?: number;
}

export interface LeaderboardQuery {
  type?: string;
  limit?: number;
}

export interface CalendarQuery {
  month: string;
  year: string;
}

export interface RoutineSearchQuery {
  q: string;
}
