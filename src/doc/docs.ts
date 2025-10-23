import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { readFileSync } from 'fs';
import { join } from 'path';

const docs = new Hono();

// Load OpenAPI specification from external file
let openAPIDocument: any;

try {
  const openAPIPath = join(process.cwd(), 'openapi.json');
  const openAPIContent = readFileSync(openAPIPath, 'utf-8');
  openAPIDocument = JSON.parse(openAPIContent);
} catch (error) {
  console.error('Failed to load openapi.json:', error);
  // Fallback to minimal specification if file not found
  openAPIDocument = {
    openapi: '3.0.3',
    info: {
      title: 'GymPal Backend API',
      version: '1.0.0',
      description: 'Backend API for the GymPal application',
    },
    paths: {},
  };
}

// Serve Swagger UI
docs.get(
  '/',
  swaggerUI({
    url: '/api/v1/docs/openapi.json',
  })
);

// Serve OpenAPI JSON
docs.get('/openapi.json', (c) => {
  return c.json(openAPIDocument);
});

export default docs;
