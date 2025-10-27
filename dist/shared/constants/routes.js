/**
 * Centralized route constants
 * Single source of truth for all API routes
 */
// API Version prefix
export const API_VERSION = '/api/v1';
// Base routes
export const ROUTES = {
    // System routes
    ROOT: '/',
    HEALTH: '/health',
    REFERENCE: '/reference',
    OPENAPI: '/openapi.json',
    // API routes (with version prefix)
    AUTH: `${API_VERSION}/auth`,
    USERS: `${API_VERSION}/users`,
    EXERCISES: `${API_VERSION}/exercises`,
    WORKOUTS: `${API_VERSION}/workouts`,
    SOCIAL: `${API_VERSION}/social`,
    PERSONAL: `${API_VERSION}/personal`,
    ROUTINES: `${API_VERSION}/routines`,
    DASHBOARD: `${API_VERSION}/dashboard`,
    SETTINGS: `${API_VERSION}/settings`,
};
// Auth sub-routes
export const AUTH_ROUTES = {
    REGISTER: '/register',
    LOGIN: '/login',
    ME: '/me',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
    RESET_PASSWORD: '/reset-password',
    CHANGE_PASSWORD: '/change-password/:id',
    DELETE_ACCOUNT: '/delete-account/:id',
};
// User sub-routes
export const USER_ROUTES = {
    PROFILE: '/profile',
    BY_ID: '/:id',
    DELETE_ACCOUNT: '/account',
};
// Workout sub-routes
export const WORKOUT_ROUTES = {
    LIST: '/',
    CREATE: '/',
    BY_ID: '/:id',
    UPDATE: '/:id',
    DELETE: '/:id',
};
// Social sub-routes
export const SOCIAL_ROUTES = {
    POSTS: '/posts',
    POST_BY_ID: '/posts/:id',
    POST_LIKE: '/posts/:id/like',
    POST_COMMENTS: '/posts/:id/comments',
    POST_COMMENT_BY_ID: '/posts/:id/comments/:commentId',
};
// Full route paths (for documentation and references)
export const FULL_ROUTES = {
    AUTH: {
        REGISTER: `${ROUTES.AUTH}${AUTH_ROUTES.REGISTER}`,
        LOGIN: `${ROUTES.AUTH}${AUTH_ROUTES.LOGIN}`,
        ME: `${ROUTES.AUTH}${AUTH_ROUTES.ME}`,
        LOGOUT: `${ROUTES.AUTH}${AUTH_ROUTES.LOGOUT}`,
        REFRESH: `${ROUTES.AUTH}${AUTH_ROUTES.REFRESH}`,
        RESET_PASSWORD: `${ROUTES.AUTH}${AUTH_ROUTES.RESET_PASSWORD}`,
        CHANGE_PASSWORD: `${ROUTES.AUTH}${AUTH_ROUTES.CHANGE_PASSWORD}`,
        DELETE_ACCOUNT: `${ROUTES.AUTH}${AUTH_ROUTES.DELETE_ACCOUNT}`,
    },
    USER: {
        PROFILE: `${ROUTES.USERS}${USER_ROUTES.PROFILE}`,
        BY_ID: `${ROUTES.USERS}${USER_ROUTES.BY_ID}`,
        DELETE_ACCOUNT: `${ROUTES.USERS}${USER_ROUTES.DELETE_ACCOUNT}`,
    },
};
