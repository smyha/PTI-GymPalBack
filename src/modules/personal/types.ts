import { z } from 'zod';
import { personalSchemas } from './schemas.js';

export type UpdatePersonalInfoData = z.infer<typeof personalSchemas.updateInfo>;
export type UpdateFitnessProfileData = z.infer<typeof personalSchemas.updateFitnessProfile>;

