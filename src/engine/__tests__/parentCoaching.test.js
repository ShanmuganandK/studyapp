import { describe, it, expect } from 'vitest';
import { REACHABLE_TAGS } from '../hints';
import {
  getParentCoaching,
  pickTinkuNoticed,
  NOTICED_MIN_OCCURRENCES,
  NOTICED_RECENT_DAYS,
} from '../parentCoaching';
import { MASTERY } from '../../config/masteryConfig';

describe('parentCoaching — tag parity & tone', () => {
  const diagnosticTags = REACHABLE_TAGS.filter((t) => t !== 'random-slip');

  it('covers every diagnostic tag in REACHABLE_TAGS (excluding random-slip)', () => {
    expect(diagnosticTags).toHaveLength(84);
    for (const tag of diagnosticTags) {
      const card = getParentCoaching(tag);
      expect(card, `missing coaching card for tag '${tag}'`).toBeTruthy();
      expect(card.title.trim().length).toBeGreaterThan(0);
      expect(card.observation.trim().length).toBeGreaterThan(0);
      expect(card.activity.trim().length).toBeGreaterThan(0);
    }
  });

  it('describes the pattern only: one wrong tap never proves what the child "knows" or did "accurately"', () => {
    for (const tag of diagnosticTags) {
      const { observation } = getParentCoaching(tag);
      expect(observation, `'${tag}' observation claims more than a wrong tap shows`).not.toMatch(
        /\b(accurately|correctly|knows|understands|solid|well)\b/i,
      );
    }
  });

  it('keeps copy region-neutral and non-judgmental (no CBSE, no rupee, no random-slip)', () => {
    expect(getParentCoaching('random-slip')).toBeNull();
    expect(getParentCoaching('unknown-tag')).toBeNull();

    for (const tag of diagnosticTags) {
      const { title, observation, activity } = getParentCoaching(tag);
      const joined = `${title} ${observation} ${activity}`;
      expect(joined, `region-specific word in '${tag}'`).not.toMatch(/cbse|rupee|₹/i);
    }
  });
});

describe('pickTinkuNoticed — selecting top recent diagnostic patterns', () => {
  it('returns empty array when there are no mistakes or only random-slip', () => {
    expect(pickTinkuNoticed({}, { grade: 1 })).toEqual([]);
    expect(
      pickTinkuNoticed(
        {
          'g1.add.within10': {
            skillId: 'g1.add.within10',
            lastSeen: '2026-11-20',
            misconceptions: { 'random-slip': 5 },
          },
        },
        { grade: 1 },
      ),
    ).toEqual([]);
  });

  it('prefers more recent skills first, then higher count, capped at 2', () => {
    const states = {
      'g1.count.1-9': {
        skillId: 'g1.count.1-9',
        lastSeen: '2026-11-10',
        misconceptions: { 'count-from-zero': 9 },
      },
      'g1.add.within20': {
        skillId: 'g1.add.within20',
        lastSeen: '2026-11-20',
        misconceptions: {
          'crossing-ten-misstep': 3,
          'add-tens-to-ones': 1,
          'operator-mixup': 2,
          'random-slip': 10,
        },
      },
    };

    const picked = pickTinkuNoticed(states, { grade: 1 });
    expect(picked).toHaveLength(2);
    expect(picked.map((p) => p.tag)).toEqual(['crossing-ten-misstep', 'operator-mixup']);
    expect(picked[0].skillName).toBe('Add it Up!');
  });

  it('scopes selections strictly to the active grade', () => {
    const states = {
      'g1.add.within20': {
        skillId: 'g1.add.within20',
        lastSeen: '2026-11-20',
        misconceptions: { 'crossing-ten-misstep': 4 },
      },
      'g2.add.2d-carry': {
        skillId: 'g2.add.2d-carry',
        lastSeen: '2026-11-19',
        misconceptions: { 'forgot-carry': 2 },
      },
    };

    expect(pickTinkuNoticed(states, { grade: 1 }).map((p) => p.tag)).toEqual(['crossing-ten-misstep']);
    expect(pickTinkuNoticed(states, { grade: 2 }).map((p) => p.tag)).toEqual(['forgot-carry']);
  });
});

describe('pickTinkuNoticed — only current, repeated patterns reach the parent', () => {
  const TODAY = '2026-11-23';

  it(`needs a pattern at least ${NOTICED_MIN_OCCURRENCES} times: a single wrong tap is a slip, not a pattern`, () => {
    const states = {
      'g1.add.within20': { skillId: 'g1.add.within20', lastSeen: TODAY, misconceptions: { 'off-by-one': 1 } },
    };
    expect(pickTinkuNoticed(states, { grade: 1, today: TODAY })).toEqual([]);
  });

  it('adds the same pattern up across the skills that count', () => {
    const states = {
      'g1.add.within10': { skillId: 'g1.add.within10', lastSeen: TODAY, misconceptions: { 'off-by-one': 1 } },
      'g1.add.within20': { skillId: 'g1.add.within20', lastSeen: TODAY, misconceptions: { 'off-by-one': 1 } },
    };
    expect(pickTinkuNoticed(states, { grade: 1, today: TODAY }).map((p) => p.tag)).toEqual(['off-by-one']);
  });

  it('skips mastered skills: a mistake the child has since overcome is not news', () => {
    const states = {
      'g1.count.1-9': {
        skillId: 'g1.count.1-9',
        level: MASTERY.MASTERED_LEVEL,
        lastSeen: TODAY, // reviewed today, which used to push its week-1 mistakes to the top
        misconceptions: { 'double-count-object': 4 },
      },
    };
    expect(pickTinkuNoticed(states, { grade: 1, today: TODAY })).toEqual([]);
  });

  it(`skips skills not practised in the last ${NOTICED_RECENT_DAYS} days`, () => {
    const states = {
      'g1.add.within10': { skillId: 'g1.add.within10', lastSeen: '2026-11-09', misconceptions: { 'operator-mixup': 3 } },
      'g1.add.within20': { skillId: 'g1.add.within20', lastSeen: '2026-11-08', misconceptions: { 'crossing-ten-misstep': 3 } },
    };
    // 14 days back is still recent; 15 days back is not.
    expect(pickTinkuNoticed(states, { grade: 1, today: TODAY }).map((p) => p.tag)).toEqual(['operator-mixup']);
  });
});
