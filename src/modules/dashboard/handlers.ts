/**
 * @fileoverview Handlers for the dashboard module
 * 
 * This file contains all HTTP request handlers related to dashboard data.
 * Handlers provide overview statistics, detailed analytics, and recent activity
 * information for the authenticated user's dashboard.
 * 
 * @module modules/dashboard/handlers
 */

import { Context } from 'hono';
import { dashboardService } from './service.js';
import { logger } from '../../core/config/logger.js';
import { sendSuccess } from '../../core/utils/response.js';
import { getUserFromCtx } from '../../core/utils/context.js';

/**
 * Object containing all handlers for the dashboard module.
 * Each handler retrieves different types of dashboard analytics and statistics.
 */
export const dashboardHandlers = {
  /**
   * Gets dashboard overview for the authenticated user
   * 
   * Retrieves a comprehensive overview of the user's fitness journey, including
   * key metrics, recent achievements, upcoming goals, quick stats, etc.
   * This is the main data source for the dashboard landing page.
   * 
   * @param {Context} c - Context with authenticated user
   * @returns {Promise<Response>} JSON response with dashboard overview
   * 
   * @example
   * // Request: GET /api/v1/dashboard/overview
   * // Response: { success: true, data: { stats: {...}, achievements: [...], ... } }
   */
  async getOverview(c: Context) {
    // Get authenticated user
    const user = getUserFromCtx(c);
    const supabase = c.get('supabase'); // Get authenticated client
    
    try {
      // Get dashboard overview from service
      const overview = await dashboardService.getOverview(user.id, supabase);
      
      // Log success with key metrics present
      logger.info({ userId: user.id }, 'Dashboard overview retrieved');

      // Return overview data
      return sendSuccess(c, overview);
    } catch (error: any) {
      // Log error for analysis
      logger.error({ error, userId: user.id }, 'Failed to get dashboard overview');
      throw error;
    }
  },

  /**
   * Gets detailed statistics for a specific time period
   * 
   * Retrieves detailed analytics and statistics for the user's workouts
   * over a specified period (e.g., last week, last month, last year).
   * Includes metrics like total volume, average intensity, progress trends, etc.
   * 
   * @param {Context} c - Context with authenticated user and validated period
   * @returns {Promise<Response>} JSON response with detailed statistics
   * 
   * @example
   * // Request: GET /api/v1/dashboard/stats?period=month
   * // Response: { success: true, data: { volume: 15000, workouts: 12, ... } }
   */
  async getStats(c: Context) {
    // Get authenticated user and time period
    const user = getUserFromCtx(c);
    const { period } = c.get('validated') as { period: string };
    const supabase = c.get('supabase'); // Get authenticated client
    
    try {
      // Get statistics for the specified period
      const stats = await dashboardService.getStats(user.id, period, supabase);
      
      // Log success with requested period
      logger.info({ userId: user.id, period }, 'Dashboard stats retrieved');

      // Return statistics
      return sendSuccess(c, stats);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get stats');
      throw error;
    }
  },

  /**
   * Gets recent activity feed
   * 
   * Retrieves a list of recent activities performed by the user, such as
   * completed workouts, achieved goals, earned badges, social interactions, etc.
   * Useful for activity timelines and feed displays.
   * 
   * @param {Context} c - Context with authenticated user and validated limit
   * @returns {Promise<Response>} JSON response with recent activity list
   * 
   * @example
   * // Request: GET /api/v1/dashboard/recent-activity?limit=10
   * // Response: { success: true, data: [{ type: "workout", date: "...", ... }, ...] }
   */
  async getRecentActivity(c: Context) {
    // Get authenticated user and activity limit
    const user = getUserFromCtx(c);
    const { limit } = c.get('validated') as { limit: number };
    const supabase = c.get('supabase'); // Get authenticated client
    
    try {
      // Get recent activity from service
      const activity = await dashboardService.getRecentActivity(user.id, limit, supabase);
      
      // Log success with item count
      logger.info({ userId: user.id, count: Array.isArray(activity) ? activity.length : 0 }, 'Recent activity retrieved');

      // Return activity list
      return sendSuccess(c, activity);
    } catch (error: any) {
      // Log error
      logger.error({ error, userId: user.id }, 'Failed to get recent activity');
      throw error;
    }
  },
};

