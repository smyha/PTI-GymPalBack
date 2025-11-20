/**
 * @fileoverview Handlers for the personal information module
 * 
 * This file contains all HTTP request handlers related to personal information
 * and fitness profile management. Handlers allow users to manage their personal
 * details and fitness-specific information.
 * 
 * @module modules/personal/handlers
 */

import { Context } from 'hono';
import { personalService } from './service.js';
import { logger } from '../../core/config/logger.js';
import { sendSuccess, sendUpdated } from '../../core/utils/response.js';
import type { UpdatePersonalInfoData, UpdateFitnessProfileData } from './types.js';
import { getUserFromCtx } from '../../core/utils/context.js';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../core/types/index.js';

/**
 * Object containing all handlers for the personal information module.
 * Handlers manage both general personal info and fitness-specific profiles.
 */
export const personalHandlers = {
  /**
   * Gets personal information for the authenticated user
   */
  async getInfo(c: Context) {
    const user = getUserFromCtx(c);
    const supabase = c.get('supabase') as SupabaseClient<Database>;

    try {
      const info = await personalService.getPersonalInfo(user.id, supabase);
      logger.info({ userId: user.id }, 'Personal info retrieved');
      return sendSuccess(c, info);
    } catch (error: any) {
      logger.error({
        error: error?.message || String(error),
        errorStack: error?.stack,
        userId: user.id
      }, 'Failed to get personal info');
      throw error;
    }
  },

  /**
   * Updates personal information for the authenticated user
   */
  async updateInfo(c: Context) {
    const user = getUserFromCtx(c);
    const data = c.get('validated') as UpdatePersonalInfoData;
    const supabase = c.get('supabase') as SupabaseClient<Database>;

    try {
      const info = await personalService.updatePersonalInfo(user.id, data, supabase);
      logger.info({ userId: user.id }, 'Personal info updated');
      return sendUpdated(c, info);
    } catch (error: any) {
      logger.error({ error, userId: user.id }, 'Failed to update personal info');
      throw error;
    }
  },

  /**
   * Gets fitness profile for the authenticated user
   */
  async getFitnessProfile(c: Context) {
    const user = getUserFromCtx(c);
    const supabase = c.get('supabase') as SupabaseClient<Database>;

    try {
      const profile = await personalService.getFitnessProfile(user.id, supabase);
      logger.info({ userId: user.id }, 'Fitness profile retrieved');
      return sendSuccess(c, profile);
    } catch (error: any) {
      logger.error({
        error: error?.message || String(error),
        errorStack: error?.stack,
        userId: user.id
      }, 'Failed to get fitness profile');
      throw error;
    }
  },

  /**
   * Updates fitness profile for the authenticated user
   */
  async updateFitnessProfile(c: Context) {
    const user = getUserFromCtx(c);
    const data = c.get('validated') as UpdateFitnessProfileData;
    const supabase = c.get('supabase') as SupabaseClient<Database>;

    try {
      const profile = await personalService.updateFitnessProfile(user.id, data, supabase);
      logger.info({ userId: user.id }, 'Fitness profile updated');
      return sendUpdated(c, profile);
    } catch (error: any) {
      logger.error({
        error: error?.message || String(error),
        errorStack: error?.stack,
        userId: user.id,
        data: data
      }, 'Failed to update fitness profile');
      throw error;
    }
  },
};
