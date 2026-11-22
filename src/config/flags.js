/**
 * Feature flags — build-time toggles for non-public / experimental UI.
 *
 * Single source of truth for runtime feature flags.
 */
export const flags = {
  /** Tester-only controls in the parent zone (the warm-up experiment). Off in every public build;
   *  on only where the build is made with VITE_TESTER_TOOLS=true (the CI debug APK, a local run). */
  testerTools: import.meta.env.VITE_TESTER_TOOLS === 'true',
};
