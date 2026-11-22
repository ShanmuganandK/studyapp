import { describe, it, expect } from 'vitest';
import { flags } from '../flags';

describe('flags', () => {
  it('exposes only active build-time feature flags (no retired migration switches)', () => {
    expect(Object.keys(flags)).toEqual(['testerTools']);
    expect(typeof flags.testerTools).toBe('boolean');
  });
});
