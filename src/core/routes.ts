/**
 * Centralized route constants
 * Single source of truth for all API routes
 */

// API Version prefix
export const API_VERSION = '/api/v1';

// ============================================================================
// SYSTEM ROUTES
// ============================================================================
export const SYSTEM_ROUTES = {
  ROOT: '/',
  HEALTH: '/api/health',
  REFERENCE: '/api/reference',
  OPENAPI: '/api/openapi.json',
} as const;

// ============================================================================
// BASE API ROUTES
// ============================================================================
export const BASE_ROUTES = {
  AUTH: `${API_VERSION}/auth`,
  USERS: `${API_VERSION}/users`,
  EXERCISES: `${API_VERSION}/exercises`,
  WORKOUTS: `${API_VERSION}/workouts`,
  SOCIAL: `${API_VERSION}/social`,
  PERSONAL: `${API_VERSION}/personal`,
  ROUTINES: `${API_VERSION}/routines`,
  DASHBOARD: `${API_VERSION}/dashboard`,
  SETTINGS: `${API_VERSION}/settings`,
} as const;

// ============================================================================
// AUTH ROUTES
// ============================================================================
export const AUTH_ROUTES = {
  REGISTER: '/register',
  LOGIN: '/login',
  ME: '/me',
  LOGOUT: '/logout',
  REFRESH: '/refresh',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password/:id',
  DELETE_ACCOUNT: '/delete-account/:id',
} as const;

// ============================================================================
// USER ROUTES
// ============================================================================
export const USER_ROUTES = {
  PROFILE: '/profile',
  BY_ID: '/:id',
  UPDATE: '/:id',
  DELETE: '/:id',
  AVATAR: '/avatar',
  SETTINGS: '/settings',
} as const;

// ============================================================================
// WORKOUT ROUTES
// ============================================================================
export const WORKOUT_ROUTES = {
  LIST: '/',
  CREATE: '/',
  BY_ID: '/:id',
  UPDATE: '/:id',
  DELETE: '/:id',
  EXERCISES: '/:id/exercises',
  SESSIONS: '/:id/sessions',
  START_SESSION: '/:id/sessions/start',
  COMPLETE_SESSION: '/:id/sessions/:sessionId/complete',
} as const;

// ============================================================================
// EXERCISE ROUTES
// ============================================================================
export const EXERCISE_ROUTES = {
  LIST: '/',
  CREATE: '/',
  BY_ID: '/:id',
  UPDATE: '/:id',
  DELETE: '/:id',
  CATEGORIES: '/categories',
  MUSCLE_GROUPS: '/muscle-groups',
  EQUIPMENT: '/equipment',
} as const;

// ============================================================================
// SOCIAL ROUTES
// ============================================================================
export const SOCIAL_ROUTES = {
  POSTS: '/posts',
  POST_CREATE: '/posts',
  POST_BY_ID: '/posts/:id',
  POST_UPDATE: '/posts/:id',
  POST_DELETE: '/posts/:id',
  POST_LIKE: '/posts/:id/like',
  POST_UNLIKE: '/posts/:id/unlike',
  POST_COMMENTS: '/posts/:id/comments',
  POST_COMMENT_CREATE: '/posts/:id/comments',
  POST_COMMENT_BY_ID: '/posts/:id/comments/:commentId',
  POST_COMMENT_UPDATE: '/posts/:id/comments/:commentId',
  POST_COMMENT_DELETE: '/posts/:id/comments/:commentId',
  FOLLOW: '/follow/:id',
  UNFOLLOW: '/unfollow/:id',
  FOLLOWERS: '/followers',
  FOLLOWING: '/following',
} as const;

// ============================================================================
// PERSONAL ROUTES
// ============================================================================
export const PERSONAL_ROUTES = {
  INFO: '/info',
  UPDATE_INFO: '/info',
  FITNESS_PROFILE: '/fitness',
  UPDATE_FITNESS_PROFILE: '/fitness',
} as const;

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================
export const DASHBOARD_ROUTES = {
  OVERVIEW: '/',
  STATS: '/stats',
  RECENT_ACTIVITY: '/activity',
  WORKOUT_PROGRESS: '/progress',
  ANALYTICS: '/analytics',
  LEADERBOARD: '/leaderboard',
  CALENDAR: '/calendar',
} as const;

// ============================================================================
// SETTINGS ROUTES
// ============================================================================
export const SETTINGS_ROUTES = {
  GET: '/',
  UPDATE: '/',
  PRIVACY: '/privacy',
  UPDATE_PRIVACY: '/privacy',
  NOTIFICATIONS: '/notifications',
  UPDATE_NOTIFICATIONS: '/notifications',
} as const;

// ============================================================================
// FULL ROUTE PATHS (for documentation and references)
// ============================================================================
export const FULL_ROUTES = {
  // System
  SYSTEM: {
    ...SYSTEM_ROUTES,
  },
  
  // Auth
  AUTH: {
    REGISTER: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.REGISTER}`,
    LOGIN: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.LOGIN}`,
    ME: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.ME}`,
    LOGOUT: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.LOGOUT}`,
    REFRESH: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.REFRESH}`,
    RESET_PASSWORD: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.RESET_PASSWORD}`,
    CHANGE_PASSWORD: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.CHANGE_PASSWORD}`,
    DELETE_ACCOUNT: `${BASE_ROUTES.AUTH}${AUTH_ROUTES.DELETE_ACCOUNT}`,
  },
  
  // Users
  USERS: {
    PROFILE: `${BASE_ROUTES.USERS}${USER_ROUTES.PROFILE}`,
    BY_ID: `${BASE_ROUTES.USERS}${USER_ROUTES.BY_ID}`,
    UPDATE: `${BASE_ROUTES.USERS}${USER_ROUTES.UPDATE}`,
    DELETE: `${BASE_ROUTES.USERS}${USER_ROUTES.DELETE}`,
    AVATAR: `${BASE_ROUTES.USERS}${USER_ROUTES.AVATAR}`,
    SETTINGS: `${BASE_ROUTES.USERS}${USER_ROUTES.SETTINGS}`,
  },
  
  // Workouts
  WORKOUTS: {
    LIST: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.LIST}`,
    CREATE: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.CREATE}`,
    BY_ID: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.BY_ID}`,
    UPDATE: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.UPDATE}`,
    DELETE: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.DELETE}`,
    EXERCISES: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.EXERCISES}`,
    SESSIONS: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.SESSIONS}`,
    START_SESSION: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.START_SESSION}`,
    COMPLETE_SESSION: `${BASE_ROUTES.WORKOUTS}${WORKOUT_ROUTES.COMPLETE_SESSION}`,
  },
  
  // Exercises
  EXERCISES: {
    LIST: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.LIST}`,
    CREATE: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.CREATE}`,
    BY_ID: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.BY_ID}`,
    UPDATE: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.UPDATE}`,
    DELETE: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.DELETE}`,
    CATEGORIES: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.CATEGORIES}`,
    MUSCLE_GROUPS: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.MUSCLE_GROUPS}`,
    EQUIPMENT: `${BASE_ROUTES.EXERCISES}${EXERCISE_ROUTES.EQUIPMENT}`,
  },
  
  // Social
  SOCIAL: {
    POSTS: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POSTS}`,
    POST_CREATE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_CREATE}`,
    POST_BY_ID: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_BY_ID}`,
    POST_UPDATE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_UPDATE}`,
    POST_DELETE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_DELETE}`,
    POST_LIKE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_LIKE}`,
    POST_UNLIKE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_UNLIKE}`,
    POST_COMMENTS: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_COMMENTS}`,
    POST_COMMENT_CREATE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_COMMENT_CREATE}`,
    POST_COMMENT_BY_ID: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_COMMENT_BY_ID}`,
    POST_COMMENT_UPDATE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_COMMENT_UPDATE}`,
    POST_COMMENT_DELETE: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.POST_COMMENT_DELETE}`,
    FOLLOW: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.FOLLOW}`,
    UNFOLLOW: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.UNFOLLOW}`,
    FOLLOWERS: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.FOLLOWERS}`,
    FOLLOWING: `${BASE_ROUTES.SOCIAL}${SOCIAL_ROUTES.FOLLOWING}`,
  },
  
  // Personal
  PERSONAL: {
    INFO: `${BASE_ROUTES.PERSONAL}${PERSONAL_ROUTES.INFO}`,
    UPDATE_INFO: `${BASE_ROUTES.PERSONAL}${PERSONAL_ROUTES.UPDATE_INFO}`,
    FITNESS_PROFILE: `${BASE_ROUTES.PERSONAL}${PERSONAL_ROUTES.FITNESS_PROFILE}`,
    UPDATE_FITNESS_PROFILE: `${BASE_ROUTES.PERSONAL}${PERSONAL_ROUTES.UPDATE_FITNESS_PROFILE}`,
  },
  
  // Dashboard
  DASHBOARD: {
    OVERVIEW: `${BASE_ROUTES.DASHBOARD}${DASHBOARD_ROUTES.OVERVIEW}`,
    STATS: `${BASE_ROUTES.DASHBOARD}${DASHBOARD_ROUTES.STATS}`,
    RECENT_ACTIVITY: `${BASE_ROUTES.DASHBOARD}${DASHBOARD_ROUTES.RECENT_ACTIVITY}`,
    WORKOUT_PROGRESS: `${BASE_ROUTES.DASHBOARD}${DASHBOARD_ROUTES.WORKOUT_PROGRESS}`,
    ANALYTICS: `${BASE_ROUTES.DASHBOARD}${DASHBOARD_ROUTES.ANALYTICS}`,
    LEADERBOARD: `${BASE_ROUTES.DASHBOARD}${DASHBOARD_ROUTES.LEADERBOARD}`,
    CALENDAR: `${BASE_ROUTES.DASHBOARD}${DASHBOARD_ROUTES.CALENDAR}`,
  },
  
  // Settings
  SETTINGS: {
    GET: `${BASE_ROUTES.SETTINGS}${SETTINGS_ROUTES.GET}`,
    UPDATE: `${BASE_ROUTES.SETTINGS}${SETTINGS_ROUTES.UPDATE}`,
    PRIVACY: `${BASE_ROUTES.SETTINGS}${SETTINGS_ROUTES.PRIVACY}`,
    UPDATE_PRIVACY: `${BASE_ROUTES.SETTINGS}${SETTINGS_ROUTES.UPDATE_PRIVACY}`,
    NOTIFICATIONS: `${BASE_ROUTES.SETTINGS}${SETTINGS_ROUTES.NOTIFICATIONS}`,
    UPDATE_NOTIFICATIONS: `${BASE_ROUTES.SETTINGS}${SETTINGS_ROUTES.UPDATE_NOTIFICATIONS}`,
  },
} as const;

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================
export const ROUTES = {
  ...SYSTEM_ROUTES,
  ...BASE_ROUTES,
} as const;

