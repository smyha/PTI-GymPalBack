/**
 * Personal Data Routes Module
 * 
 * This module defines routes for personal user information:
 * - Physical information (age, weight, height, body fat)
 * - Fitness profile (experience level, goals, preferences)
 * - Workout preferences and equipment availability
 * - Injury history and medical restrictions
 * 
 * All routes require authentication as they contain sensitive personal data.
 */

import { Hono } from 'hono';
import { Context } from 'hono';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validation.js';
import { personalSchemas } from './schemas.js';
import { personalHandlers } from './handlers.js';
import { PERSONAL_ROUTES } from '../../core/routes.js';

// Hono router instance for personal data routes
const personalRoutes = new Hono();

// Apply authentication to all routes
personalRoutes.use('*', auth);

/**
 * @openapi
 * /api/v1/personal:
 *   get:
 *     tags: [Personal]
 *     summary: Get complete personal data
 *     description: Get complete personal data (physical info + fitness profile)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete personal data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonalDataResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get complete personal data
 * 
 * Endpoint: GET /api/v1/personal
 * 
 * Process:
 * 1. Validates authentication
 * 2. Retrieves both physical information and fitness profile
 * 3. Returns combined personal data
 * 
 * Includes:
 * - Physical information (age, weight, height, body fat)
 * - Fitness profile (experience, goals, preferences)
 * - Equipment availability
 * - Injury history and medical restrictions
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Complete personal data retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
personalRoutes.get('/', async (c: Context) => {
  const user = c.get('user') as { id: string; email?: string };
  try {
    const [info, fitness] = await Promise.all([
      personalHandlers.getInfo(c),
      personalHandlers.getFitnessProfile(c),
    ]);
    // Combine both responses
    const infoData = await info.json();
    const fitnessData = await fitness.json();
    return c.json({
      success: true,
      data: {
        personalInfo: infoData.data || infoData,
        fitnessProfile: fitnessData.data || fitnessData,
      },
    }, 200);
  } catch (error: any) {
    throw error;
  }
});

/**
 * Handler: Get personal physical information
 * 
 * Endpoint: GET /api/v1/personal/info
 */
personalRoutes.get(PERSONAL_ROUTES.INFO, personalHandlers.getInfo);

/**
 * @openapi
 * /api/v1/personal/info:
 *   get:
 *     tags: [Personal]
 *     summary: Get personal physical information
 *     description: Get personal physical information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal physical information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonalInfoResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Personal]
 *     summary: Update personal physical information
 *     description: Update personal physical information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePersonalInfoRequest'
 *     responses:
 *       200:
 *         description: Personal information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonalInfoResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Update personal physical information
 * 
 * Endpoint: PUT /api/v1/personal/info
 * 
 * Process:
 * 1. Validates authentication and request body
 * 2. Updates physical information fields (allows partial updates)
 * 3. Returns updated personal info
 * 
 * Updatable fields:
 * - Age (13-120)
 * - Weight in kg (positive, max 500)
 * - Height in cm (positive integer, max 300)
 * - Body fat percentage (0-100)
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Personal information updated successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
personalRoutes.put(PERSONAL_ROUTES.UPDATE_INFO, validate(personalSchemas.updateInfo, 'body'), personalHandlers.updateInfo);

/**
 * @openapi
 * /api/v1/personal/fitness:
 *   get:
 *     tags: [Personal]
 *     summary: Get fitness profile
 *     description: Get fitness profile data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fitness profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FitnessProfileResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags: [Personal]
 *     summary: Create or update fitness profile
 *     description: Create or update fitness profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FitnessProfileRequest'
 *     responses:
 *       200:
 *         description: Fitness profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FitnessProfileResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Handler: Get fitness profile
 * 
 * Endpoint: GET /api/v1/personal/fitness
 * 
 * Process:
 * 1. Validates authentication
 * 2. Retrieves fitness profile data for authenticated user
 * 3. Returns fitness profile information
 * 
 * Includes:
 * - Experience level (beginner, intermediate, advanced, expert)
 * - Primary and secondary fitness goals
 * - Workout frequency and duration preferences
 * - Available equipment
 * - Workout preferences
 * - Injury history
 * - Medical restrictions
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Fitness profile retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
personalRoutes.get(PERSONAL_ROUTES.FITNESS_PROFILE, personalHandlers.getFitnessProfile);

/**
 * Handler: Create or update fitness profile
 * 
 * Endpoint: PUT /api/v1/personal/fitness
 * 
 * Process:
 * 1. Validates authentication and request body
 * 2. Creates or updates fitness profile (upsert operation)
 * 3. Returns updated fitness profile
 * 
 * Required fields:
 * - primary_goal: Main fitness objective
 * 
 * Optional fields:
 * - experience_level: User's fitness experience
 * - secondary_goals: Additional fitness objectives
 * - workout_frequency: Days per week (1-7)
 * - preferred_workout_duration: Minutes per session
 * - available_equipment: List of available equipment
 * - workout_preferences: Custom preferences object
 * - injury_history: List of past injuries
 * - medical_restrictions: Medical limitations
 * - fitness_goals_timeline: Timeframe for goals
 * - motivation_level: 1-10 scale
 * 
 * Requires: Valid authentication token
 * 
 * Responses:
 * - 200: Fitness profile updated successfully
 * - 400: Validation error in provided data
 * - 401: User not authenticated
 * - 500: Internal server error
 */
personalRoutes.put(PERSONAL_ROUTES.UPDATE_FITNESS_PROFILE, validate(personalSchemas.updateFitnessProfile, 'body'), personalHandlers.updateFitnessProfile);

export default personalRoutes;

