import type { Context } from 'hono';

export type AuthUser = { id: string; email?: string | null };

/**
 * Safely retrieve the authenticated user from the Hono context.
 * Throws an error if no user is present (should be called after `auth` middleware).
 */
export function getUserFromCtx(c: Context): AuthUser {
  const user = c.get('user') as any;
  if (!user || !user.id) {
    throw new Error('Unauthorized: missing user in context');
  }
  return { id: user.id, email: user.email };
}
