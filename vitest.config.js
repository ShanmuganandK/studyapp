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
    // `scripts/` is included so tooling with real logic (e.g. the mastery simulation) is under CI.
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.{js,jsx}'],
    // Generous budgets for a COLD first run (fresh `npm ci`, empty transform cache, a busy CI runner or a slow
    // laptop). The default 5 s per test is too tight there: the ParentGate integration test took 8.6 s for its first
    // stage under CPU starvation, timed out, and its three dependent stages failed after it (2026-10-21). A
    // timeout only changes how long a HANGING test takes to fail; a passing test is not slower for it.
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
