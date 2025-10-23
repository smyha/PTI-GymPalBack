import { Hono } from 'hono';
import { getAllExercises, getExerciseById, getExerciseCategories, getMuscleGroups, getEquipmentTypes } from '../services/exercises.service.js';
const exercises = new Hono();
// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
// Otherwise /:id will catch everything
// Get exercise categories
exercises.get('/categories', getExerciseCategories);
// Get muscle groups
exercises.get('/muscle-groups', getMuscleGroups);
// Get equipment types
exercises.get('/equipment', getEquipmentTypes);
// Get all exercises with optional filters
exercises.get('/', getAllExercises);
// Get exercise by ID (MUST be last to avoid catching /categories etc.)
exercises.get('/:id', getExerciseById);
export default exercises;
