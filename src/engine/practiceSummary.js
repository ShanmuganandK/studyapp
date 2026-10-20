/**
 * practiceSummary — pure read-out of the practice-day list for the parent dashboard.
 *
 * "Week 1" / "Week 2" are counted from the child's FIRST practice day (day 1), not from the calendar week,
 * because the closed-test bar (DECISIONS 2026-10-20) is "N days in week 1 and M days in week 2" of each child's own
 * test. No clock here: `today` is passed in, same convention as the rest of `engine/`.
 */

function dayNumber(isoDay) {
  const [y, m, d] = isoDay.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * @param {string[]} days - sorted/unique 'YYYY-MM-DD' (as `loadPracticeDays` returns)
 * @param {string} today - 'YYYY-MM-DD', local
 * @returns {{ total: number, firstDay: string|null, week1: number, week2: number, week2Started: boolean }}
 *   `week1` / `week2` = days practised within the first / second 7 days counted from `firstDay`;
 *   `week2Started` = today is already past the first 7 days (so showing a week-2 figure makes sense).
 */
export function summarisePracticeDays(days, today) {
  if (!days || days.length === 0) {
    return { total: 0, firstDay: null, week1: 0, week2: 0, week2Started: false };
  }
  const firstDay = days[0];
  const first = dayNumber(firstDay);
  let week1 = 0;
  let week2 = 0;
  for (const day of days) {
    const offset = dayNumber(day) - first;
    if (offset >= 0 && offset <= 6) week1 += 1;
    else if (offset >= 7 && offset <= 13) week2 += 1;
  }
  return {
    total: days.length,
    firstDay,
    week1,
    week2,
    week2Started: dayNumber(today) - first >= 7,
  };
}
