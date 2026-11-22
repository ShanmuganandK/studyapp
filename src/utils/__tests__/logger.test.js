import { describe, it, expect, vi, afterEach } from 'vitest';
import logger from '../logger';

describe('logger', () => {
  afterEach(() => vi.restoreAllMocks());

  it('prefixes warn and error logs with [tinku]', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.warn('storage warning', { code: 1 });
    logger.error('fatal error', new Error('boom'));

    expect(warn).toHaveBeenCalledWith('[tinku]', 'storage warning', { code: 1 });
    expect(error).toHaveBeenCalledWith('[tinku]', 'fatal error', expect.any(Error));
  });

  it('exposes debug and info methods that log in dev mode without throwing', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.debug('dbg', 1);
    logger.info('inf', 2);

    if (import.meta.env.DEV) {
      expect(debug).toHaveBeenCalledWith('[tinku]', 'dbg', 1);
      expect(info).toHaveBeenCalledWith('[tinku]', 'inf', 2);
    } else {
      expect(debug).not.toHaveBeenCalled();
      expect(info).not.toHaveBeenCalled();
    }
  });
});
