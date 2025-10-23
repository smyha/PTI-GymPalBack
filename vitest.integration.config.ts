import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load test environment variables
config({ path: 'tests/test.env' });

export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['tests/unit/**/*.test.ts', 'tests/**/*.unit.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    env: {
      NODE_ENV: 'test',
      PORT: '3001',
    },
  },
});
