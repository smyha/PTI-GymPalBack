import { z } from 'zod';
import { userSchemas } from './schemas.js';

export type UpdateProfileData = z.infer<typeof userSchemas.updateProfile>;
export type SearchUsersFilters = z.infer<typeof userSchemas.search>;

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  fitness_level?: string;
  created_at: string;
  updated_at: string;
}

