import { defineConfig } from 'vitest/config';

// Test config kept separate from vite.config.js so build and test concerns don't mix.
// Recipes are pure (no DOM/Firebase), so the lightweight node environment is enough.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
