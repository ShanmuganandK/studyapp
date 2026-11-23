// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import logger from '../../utils/logger';
import {
  loadParentSettings,
  saveParentSettings,
  loadProfiles,
  saveProfiles,
  loadLastProfileId,
  saveLastProfileId,
  clearLastProfileId,
} from '../authSettingsStore';

describe('authSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to { passcodeHash: null } when missing or corrupt', () => {
    expect(loadParentSettings('anon')).toEqual({ passcodeHash: null });
    localStorage.setItem('math_kids_settings_anon', '{bad-json');
    expect(loadParentSettings('anon')).toEqual({ passcodeHash: null });
  });

  it('persists and loads parent settings under math_kids_settings_<uid>', () => {
    saveParentSettings('anon', { passcodeHash: 'abc123' });
    expect(JSON.parse(localStorage.getItem('math_kids_settings_anon'))).toEqual({ passcodeHash: 'abc123' });
    expect(loadParentSettings('anon')).toEqual({ passcodeHash: 'abc123' });
  });

  it('persists profiles and last profile id when uid is provided', () => {
    expect(loadProfiles()).toEqual([]);
    expect(loadLastProfileId()).toBeNull();

    saveProfiles('u1', [{ id: 'p1', name: 'Kid', grade: 1 }]);
    expect(loadProfiles('u1')).toEqual([{ id: 'p1', name: 'Kid', grade: 1 }]);

    saveLastProfileId('u1', 'p1');
    expect(loadLastProfileId('u1')).toBe('p1');

    clearLastProfileId('u1');
    expect(loadLastProfileId('u1')).toBeNull();
  });

  it('degrades gracefully when localStorage throws', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });

    expect(() => saveParentSettings('anon', { passcodeHash: 'x' })).not.toThrow();
    expect(loadParentSettings('anon')).toEqual({ passcodeHash: null });
    expect(loadLastProfileId('u1')).toBeNull();
    expect(() => saveLastProfileId('u1', 'p1')).not.toThrow();
    expect(() => clearLastProfileId('u1')).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(5);
  });
});
