import { createMiddleware } from 'hono/factory';
import { apiReference } from '@scalar/hono-api-reference';
import { readFile } from 'fs/promises';

/**
 * OpenAPI documentation plugin
 */
export const openapiPlugin = createMiddleware(async (c, next) => {
  if (c.req.path === '/api/reference') {
    try {
      const openapi = JSON.parse(
        await readFile(new URL('../../openapi.json', import.meta.url), 'utf-8')
      );

      return apiReference({
        spec: {
          content: openapi,
        },
      })(c, async () => {});
    } catch (error) {
      return c.json({ error: 'Failed to load OpenAPI spec' }, 500);
    }
  }

  if (c.req.path === '/api/openapi.json') {
    try {
      const openapi = JSON.parse(
        await readFile(new URL('../../openapi.json', import.meta.url), 'utf-8')
      );
      return c.json(openapi);
    } catch (error) {
      return c.json({ error: 'Failed to load OpenAPI spec' }, 500);
    }
  }

  await next();
});

