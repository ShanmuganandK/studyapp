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

/**
 * Registers the Capacitor Android hardware Back button listener on native builds and returns a
 * cleanup function. A no-op on the web.
 *
 * @param {(exitApp: () => void) => void} onBack
 * @returns {() => void}
 */
export function registerBackButtonListener(onBack) {
  if (!isNativeApp()) return () => {};
  let handle = null;
  let cancelled = false;

  (async () => {
    const { App } = await import('@capacitor/app');
    if (cancelled) return;
    const h = await App.addListener('backButton', () => onBack(() => App.exitApp()));
    if (cancelled) h.remove();
    else handle = h;
  })().catch(() => {
    // Plugin failed to load: Back falls back to the OS default. Never crash the app over it.
  });

  return () => {
    cancelled = true;
    handle?.remove();
  };
}
