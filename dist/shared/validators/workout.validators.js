import { z } from 'zod';
// ============================================================================
// WORKOUT VALIDATION SCHEMAS
// ============================================================================
export const CreateWorkoutSchema = z.object({
    name: z.string()
        .min(1, 'Workout name is required')
        .max(100, 'Workout name too long'),
    description: z.string()
        .max(500, 'Description too long')
        .optional(),
    type: z.string()
        .max(50, 'Type too long')
        .optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
        .default('beginner'),
    duration_minutes: z.number()
        .int('Duration must be an integer')
        .min(1, 'Duration must be at least 1 minute')
        .max(300, 'Duration cannot exceed 300 minutes')
        .optional(),
    is_template: z.boolean().default(false),
    is_public: z.boolean().default(false),
    is_shared: z.boolean().default(false),
    target_goal: z.string()
        .max(100, 'Target goal too long')
        .optional(),
    target_level: z.string()
        .max(50, 'Target level too long')
        .optional(),
    days_per_week: z.number()
        .int('Days per week must be an integer')
        .min(1, 'Must be at least 1 day per week')
        .max(7, 'Cannot exceed 7 days per week')
        .optional(),
    equipment_required: z.array(z.string())
        .max(20, 'Too many equipment items')
        .default([]),
    user_notes: z.string()
        .max(1000, 'User notes too long')
        .optional(),
    tags: z.array(z.string())
        .max(10, 'Too many tags')
        .default([]),
    exercises: z.array(z.object({
        exercise_id: z.string().min(1, 'Exercise ID is required'),
        order_index: z.number().int().min(0),
        sets: z.number().int().min(1).max(50).optional(),
        reps: z.number().int().min(1).max(1000).optional(),
        weight_kg: z.number().min(0).max(1000).optional(),
        rest_seconds: z.number().int().min(0).max(3600).optional(),
        notes: z.string().max(500).optional()
    }))
        .min(1, 'At least one exercise is required')
        .max(50, 'Too many exercises')
});
export const UpdateWorkoutSchema = CreateWorkoutSchema.partial();
export const CreateWorkoutSessionSchema = z.object({
    workout_id: z.string().min(1, 'Workout ID is required').optional(),
    started_at: z.string().datetime('Invalid start time format').optional(),
    completed_at: z.string().datetime('Invalid completion time format').optional(),
    duration_minutes: z.number()
        .int('Duration must be an integer')
        .min(1, 'Duration must be at least 1 minute')
        .max(300, 'Duration cannot exceed 300 minutes')
        .optional(),
    calories_burned: z.number()
        .min(0, 'Calories burned cannot be negative')
        .max(10000, 'Calories burned too high')
        .optional(),
    notes: z.string()
        .max(1000, 'Notes too long')
        .optional()
});
export const UpdateWorkoutSessionSchema = CreateWorkoutSessionSchema.partial();
export const ShareWorkoutSchema = z.object({
    workout_id: z.string().min(1, 'Workout ID is required'),
    shared_with_user_id: z.string().min(1, 'User ID is required')
});
export const LikeWorkoutSchema = z.object({
    workout_id: z.string().min(1, 'Workout ID is required')
});
export const GetWorkoutsSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    type: z.string().max(50).optional(),
    tags: z.array(z.string()).max(10).optional(),
    is_public: z.boolean().optional(),
    sort_by: z.enum(['created_at', 'name', 'difficulty', 'duration_minutes', 'like_count']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc')
});
// ============================================================================
// EXERCISE VALIDATION SCHEMAS
// ============================================================================
export const CreateExerciseSchema = z.object({
    name: z.string()
        .min(1, 'Exercise name is required')
        .max(100, 'Exercise name too long'),
    description: z.string()
        .max(1000, 'Description too long')
        .optional(),
    muscle_group: z.string()
        .min(1, 'Muscle group is required')
        .max(50, 'Muscle group too long'),
    muscle_groups: z.array(z.string())
        .max(10, 'Too many muscle groups')
        .default([]),
    equipment: z.array(z.string())
        .max(20, 'Too many equipment items')
        .default([]),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
        .default('beginner'),
    instructions: z.string()
        .max(2000, 'Instructions too long')
        .optional(),
    video_url: z.string()
        .url('Invalid video URL')
        .optional(),
    image_url: z.string()
        .url('Invalid image URL')
        .optional(),
    tags: z.array(z.string())
        .max(10, 'Too many tags')
        .default([]),
    is_public: z.boolean().default(true)
});
export const UpdateExerciseSchema = CreateExerciseSchema.partial();
export const GetExercisesSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    muscle_group: z.string().max(50).optional(),
    equipment: z.array(z.string()).max(10).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    tags: z.array(z.string()).max(10).optional(),
    is_public: z.boolean().optional(),
    sort_by: z.enum(['name', 'difficulty', 'created_at']).default('name'),
    sort_order: z.enum(['asc', 'desc']).default('asc')
});
// ============================================================================
// HELPER FUNCTIONS FOR VALIDATION
// ============================================================================
export const validateWorkoutName = (name) => {
    const errors = [];
    if (!name || name.trim().length === 0) {
        errors.push('Workout name is required');
    }
    else if (name.length > 100) {
        errors.push('Workout name too long');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
export const validateExerciseName = (name) => {
    const errors = [];
    if (!name || name.trim().length === 0) {
        errors.push('Exercise name is required');
    }
    else if (name.length > 100) {
        errors.push('Exercise name too long');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
export const validateDuration = (duration) => {
    const errors = [];
    if (duration < 1) {
        errors.push('Duration must be at least 1 minute');
    }
    else if (duration > 300) {
        errors.push('Duration cannot exceed 300 minutes');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
export const validateDifficulty = (difficulty) => {
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    const errors = [];
    if (!validDifficulties.includes(difficulty)) {
        errors.push('Invalid difficulty level');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
// ============================================================================
// CUSTOM VALIDATION MESSAGES
// ============================================================================
export const WORKOUT_VALIDATION_MESSAGES = {
    NAME_REQUIRED: 'Workout name is required',
    NAME_TOO_LONG: 'Workout name too long',
    DESCRIPTION_TOO_LONG: 'Description too long',
    TYPE_TOO_LONG: 'Type too long',
    INVALID_DIFFICULTY: 'Invalid difficulty level',
    DURATION_TOO_SHORT: 'Duration must be at least 1 minute',
    DURATION_TOO_LONG: 'Duration cannot exceed 300 minutes',
    TARGET_GOAL_TOO_LONG: 'Target goal too long',
    TARGET_LEVEL_TOO_LONG: 'Target level too long',
    DAYS_TOO_FEW: 'Must be at least 1 day per week',
    DAYS_TOO_MANY: 'Cannot exceed 7 days per week',
    EQUIPMENT_TOO_MANY: 'Too many equipment items',
    NOTES_TOO_LONG: 'User notes too long',
    TAGS_TOO_MANY: 'Too many tags',
    EXERCISES_REQUIRED: 'At least one exercise is required',
    EXERCISES_TOO_MANY: 'Too many exercises',
    INVALID_EXERCISE_ID: 'Exercise ID is required',
    INVALID_ORDER_INDEX: 'Invalid order index',
    SETS_TOO_FEW: 'Sets must be at least 1',
    SETS_TOO_MANY: 'Sets cannot exceed 50',
    REPS_TOO_FEW: 'Reps must be at least 1',
    REPS_TOO_MANY: 'Reps cannot exceed 1000',
    WEIGHT_TOO_LOW: 'Weight cannot be negative',
    WEIGHT_TOO_HIGH: 'Weight cannot exceed 1000kg',
    REST_TOO_LOW: 'Rest time cannot be negative',
    REST_TOO_HIGH: 'Rest time cannot exceed 1 hour',
    EXERCISE_NOTES_TOO_LONG: 'Exercise notes too long'
};
