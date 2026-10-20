import { describe, it, expect } from 'vitest';
import { summarisePracticeDays } from '../practiceSummary.js';

describe('summarisePracticeDays', () => {
  it('no days → zeros, week 2 not started', () => {
    expect(summarisePracticeDays([], '2026-10-20')).toEqual({ total: 0, firstDay: null, week1: 0, week2: 0, week2Started: false });
  });

  it('counts weeks from the FIRST practice day, not the calendar week', () => {
    // first day Wed 14 Oct → week 1 = 14..20 Oct, week 2 = 21..27 Oct
    const days = ['2026-10-14', '2026-10-16', '2026-10-20', '2026-10-21', '2026-10-27', '2026-10-28'];
    const s = summarisePracticeDays(days, '2026-10-28');
    expect(s.total).toBe(6);
    expect(s.firstDay).toBe('2026-10-14');
    expect(s.week1).toBe(3); // 14, 16, 20
    expect(s.week2).toBe(2); // 21, 27  (28 is day 15: in neither week)
  });

  it('week 2 is only "started" once today is past the first 7 days', () => {
    const days = ['2026-10-14', '2026-10-15'];
    expect(summarisePracticeDays(days, '2026-10-20').week2Started).toBe(false); // day 7
    expect(summarisePracticeDays(days, '2026-10-21').week2Started).toBe(true);  // day 8
  });

  it('is exact across a month boundary and a daylight-saving-style date', () => {
    const days = ['2026-10-30', '2026-11-05', '2026-11-06'];
    const s = summarisePracticeDays(days, '2026-11-06');
    expect(s.week1).toBe(2); // 30 Oct (day 1), 5 Nov (day 7)
    expect(s.week2).toBe(1); // 6 Nov is day 8
  });
});
