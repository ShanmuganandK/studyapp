import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test config kept separate from vite.config.js so build and test concerns don't mix.
// The react plugin lets component render tests (RTL) transform JSX; pure logic tests
// (recipes/engine/hooks) don't need it but it's harmless for them.
//
// Environment: `node` by default — recipes/engine are pure (no DOM), so the lightweight
// node env is enough and fast. Component render tests opt into jsdom per-file with a
// `// @vitest-environment jsdom` docblock at the top of the file.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
