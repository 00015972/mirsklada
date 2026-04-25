import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/types/**',
        'src/index.ts',
        'src/config/env.ts', // reads process.env at import time
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
