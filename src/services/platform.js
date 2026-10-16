import { Capacitor } from '@capacitor/core';

/**
 * platform — the ONE place that knows whether the app is running inside the Capacitor Android
 * wrap (DECISIONS 2026-10-15) or as the web PWA. Everything platform-specific (file export,
 * hardware back button) branches on this; screens and hooks never import Capacitor directly.
 *
 * `Capacitor.isNativePlatform()` is false in any browser, so the web build behaves exactly as
 * before. Native plugin packages are loaded with a dynamic `import()` only on the native branch,
 * so the web path never executes plugin code.
 */
export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
