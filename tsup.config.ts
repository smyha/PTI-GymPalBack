import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2020',
  outDir: 'dist',
  clean: true,
  minify: false,
  sourcemap: true,
  dts: false,
  splitting: false,
  treeshake: true,
  external: ['@hono/node-server'],
});
