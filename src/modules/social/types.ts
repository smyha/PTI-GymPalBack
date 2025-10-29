import { z } from 'zod';
import { socialSchemas } from './schemas.js';

export type CreatePostData = z.infer<typeof socialSchemas.createPost>;
export type UpdatePostData = z.infer<typeof socialSchemas.updatePost>;
export type CreateCommentData = z.infer<typeof socialSchemas.createComment>;
export type PostFilters = z.infer<typeof socialSchemas.listPosts>;

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_urls?: string[];
  workout_id?: string;
  hashtags?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

