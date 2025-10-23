import { Hono } from 'hono';
import { authMiddleware } from '../shared/middleware/auth.middleware.js';
import { validationMiddleware } from '../shared/middleware/validation.middleware.js';
import * as PersonalService from '../services/personal.service.js';
import { z } from 'zod';

const personal = new Hono();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PersonalInfoSchema = z.object({
  age: z.number().int().min(13).max(120).optional(),
  weight_kg: z.number().positive().max(500).optional(),
  height_cm: z.number().int().positive().max(300).optional(),
  body_fat_percentage: z.number().min(0).max(100).optional(),
});

const FitnessProfileSchema = z.object({
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  primary_goal: z.string().min(1).max(100),
  secondary_goals: z.array(z.string()).optional(),
  workout_frequency: z.number().int().min(1).max(7).optional(),
  preferred_workout_duration: z.number().int().positive().max(300).optional(),
  available_equipment: z.array(z.string()).optional(),
  workout_preferences: z.record(z.any()).optional(),
  injury_history: z.array(z.string()).optional(),
  medical_restrictions: z.array(z.string()).optional(),
  fitness_goals_timeline: z.string().optional(),
  motivation_level: z.number().int().min(1).max(10).optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @openapi
 * /api/v1/personal:
 *   get:
 *     summary: Get complete personal data (physical info + fitness profile)
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete personal data
 *       401:
 *         description: Unauthorized
 */
personal.get('/', authMiddleware, async (c) => {
  return PersonalService.getCompletePersonalData(c);
});

/**
 * @openapi
 * /api/v1/personal/info:
 *   get:
 *     summary: Get personal physical information
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal physical information
 */
personal.get('/info', authMiddleware, async (c) => {
  return PersonalService.getPersonalInfo(c);
});

/**
 * @openapi
 * /api/v1/personal/info:
 *   put:
 *     summary: Update personal physical information
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               age:
 *                 type: integer
 *                 minimum: 13
 *                 maximum: 120
 *               weight_kg:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 500
 *               height_cm:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 300
 *               body_fat_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Personal information updated
 */
personal.put(
  '/info',
  authMiddleware,
  validationMiddleware({ body: PersonalInfoSchema }),
  async (c) => {
    const body = c.get('validatedBody');
    return PersonalService.upsertPersonalInfo(c, body);
  }
);

/**
 * @openapi
 * /api/v1/personal/fitness:
 *   get:
 *     summary: Get fitness profile
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fitness profile data
 */
personal.get('/fitness', authMiddleware, async (c) => {
  return PersonalService.getFitnessProfile(c);
});

/**
 * @openapi
 * /api/v1/personal/fitness:
 *   put:
 *     summary: Create or update fitness profile
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - primary_goal
 *             properties:
 *               experience_level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *               primary_goal:
 *                 type: string
 *               secondary_goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               workout_frequency:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7
 *               preferred_workout_duration:
 *                 type: integer
 *               available_equipment:
 *                 type: array
 *                 items:
 *                   type: string
 *               workout_preferences:
 *                 type: object
 *               injury_history:
 *                 type: array
 *                 items:
 *                   type: string
 *               medical_restrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               fitness_goals_timeline:
 *                 type: string
 *               motivation_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Fitness profile updated
 */
personal.put(
  '/fitness',
  authMiddleware,
  validationMiddleware({ body: FitnessProfileSchema }),
  async (c) => {
    const body = c.get('validatedBody');
    return PersonalService.upsertFitnessProfile(c, body);
  }
);

export default personal;
