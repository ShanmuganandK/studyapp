/**
 * logger — the single logging path for all new code (STANDARDS §8).
 * debug/info are dev-only so they vanish from production builds.
 * warn/error always log (non-PII only — children's app, §6).
 * Raw console.* calls are banned in committed code; import this instead.
 */
const isDev = import.meta.env.DEV;

const logger = {
  debug: (...args) => isDev && console.debug('[tinku]', ...args),
  info:  (...args) => isDev && console.info('[tinku]', ...args),
  warn:  (...args) => console.warn('[tinku]', ...args),
  error: (...args) => console.error('[tinku]', ...args),
};

export default logger;
