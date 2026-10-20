// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadPracticeDays, recordPracticeDay, replacePracticeDays, localDateString, normaliseDays, isValidDay, MAX_DAYS,
} from '../practiceDays';

const KEY = 'tinku:v1:practiceDays';

describe('practiceDays', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(loadPracticeDays()).toEqual([]);
  });

  it('records a day once, sorted, and is idempotent for the same day', () => {
    recordPracticeDay('2026-10-21');
    recordPracticeDay('2026-10-20');
    recordPracticeDay('2026-10-21');
    expect(loadPracticeDays()).toEqual(['2026-10-20', '2026-10-21']);
  });

  it('stores bare dates only: no skill, name, time or identifier', () => {
    recordPracticeDay('2026-10-20');
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({ version: 1, days: ['2026-10-20'] });
  });

  it('ignores a malformed date instead of storing it', () => {
    recordPracticeDay('tomorrow');
    recordPracticeDay('2026-1-5');
    recordPracticeDay(12345);
    expect(loadPracticeDays()).toEqual([]);
  });

  it('uses the LOCAL calendar date, not UTC (06:00 in India is still "today")', () => {
    // 20 Oct 2026, 00:30 local time. In any timezone east of UTC this instant is still 19 Oct in UTC.
    const d = new Date(2026, 9, 20, 0, 30, 0);
    expect(localDateString(d)).toBe('2026-10-20');
  });

  it('survives corrupt, wrong-version or hand-edited storage without throwing', () => {
    localStorage.setItem(KEY, '{not json');
    expect(loadPracticeDays()).toEqual([]);
    localStorage.setItem(KEY, JSON.stringify({ version: 99, days: ['2026-10-20'] }));
    expect(loadPracticeDays()).toEqual([]);
    localStorage.setItem(KEY, JSON.stringify({ version: 1, days: ['2026-10-20', 'junk', 5, '2026-10-20'] }));
    expect(loadPracticeDays()).toEqual(['2026-10-20']);
  });

  it('caps the list at MAX_DAYS, dropping the oldest', () => {
    const many = Array.from({ length: MAX_DAYS + 5 }, (_, i) => {
      const d = new Date(Date.UTC(2024, 0, 1 + i));
      return d.toISOString().slice(0, 10);
    });
    const kept = normaliseDays(many);
    expect(kept).toHaveLength(MAX_DAYS);
    expect(kept.at(-1)).toBe(many.at(-1));
    expect(kept[0]).toBe(many[5]);
  });

  it('replacePracticeDays restores a validated list (used by import)', () => {
    recordPracticeDay('2026-10-01');
    replacePracticeDays(['2026-10-05', '2026-10-06']);
    expect(loadPracticeDays()).toEqual(['2026-10-05', '2026-10-06']);
  });

  it('a failing storage write never throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => recordPracticeDay('2026-10-20')).not.toThrow();
    spy.mockRestore();
  });

  it('isValidDay accepts only YYYY-MM-DD strings', () => {
    expect(isValidDay('2026-10-20')).toBe(true);
    for (const bad of ['2026-1-20', '20-10-2026', '', null, 20261020]) expect(isValidDay(bad)).toBe(false);
  });
});
