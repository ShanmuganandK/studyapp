// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SkillCard from '../SkillCard';
import SkillPathScreen from '../SkillPathScreen';
import { SKILLS } from '../../recipes/skillMap';

/**
 * Cross-view identity: cards and the path must encode the same skill state identically (they share
 * getSkillVisual). This pins the previously-drifted DUE-BUT-NOT-SUGGESTED state — neutral ring +
 * teal review cue, NEVER amber — in BOTH views.
 */

let mockStates = {};
vi.mock('../../services/progressStore', () => ({ loadAllSkillStates: () => mockStates }));
vi.mock('../Mascot', () => ({ default: () => null }));

const readySkills = Object.values(SKILLS).filter((s) => s.status === 'ready').sort((a, b) => a.order - b.order);
const mastered = (id, nextReview) => ({
  skillId: id, level: 5, difficulty: 3, maxDifficulty: 3, attempts: 20, correct: 18,
  lastSeen: '2000-01-01', nextReview, reviewInterval: 1, recentParams: [], misconceptions: {},
});

function assertDueNotSuggestedGrammar(container) {
  expect(container.querySelector('.border-primary-soft')).toBeTruthy(); // neutral ring
  expect(container.querySelector('.text-review')).toBeTruthy();         // teal ↻ cue
  expect(screen.getAllByText(/Review time!/).length).toBeGreaterThan(0);
  expect(container.querySelector('.border-accent')).toBeNull();         // never amber while due
}

describe('skill-state grammar — identical across card + path views', () => {
  beforeEach(() => { mockStates = {}; });
  afterEach(cleanup);

  it('due-but-not-suggested: card encodes neutral ring + teal cue, never amber', () => {
    const skill = { id: 'x', icon: '➕', displayName: 'Add it up', subtitle: 'Addition' };
    const { container } = render(
      <SkillCard skill={skill} level={5} isDue isSuggested={false} isReviewSuggested={false} onClick={() => {}} />
    );
    assertDueNotSuggestedGrammar(container);
  });

  it('due-but-not-suggested: path encodes the SAME (neutral ring + teal cue, never amber)', () => {
    const [a, b] = [readySkills[0].id, readySkills[1].id];
    // Two due → one suggested (teal), the other due-not-suggested (must be neutral, not amber).
    mockStates = { [a]: mastered(a, '2000-01-01'), [b]: mastered(b, '2000-06-01') };
    const { container } = render(<SkillPathScreen onSelectSkill={() => {}} />);
    assertDueNotSuggestedGrammar(container);
    // And the single loud element is present (the suggested review) — one call-to-action.
    expect(container.querySelector('.border-review')).toBeTruthy();
  });
});
