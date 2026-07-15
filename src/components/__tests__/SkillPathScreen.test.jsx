// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SkillPathScreen from '../SkillPathScreen';
import { SKILLS } from '../../recipes/skillMap';

/**
 * Smoke test for the Journey Path experiment (Screen 3-B). Presentational only — asserts the path
 * renders one node per ready skill, the suggested node reads as suggested, and the locked colour
 * rules hold (review-due = teal `review` token, never amber). Data flow is identical to production;
 * we drive it by controlling the stored skill states (progressStore), letting the real pure engine
 * (recommendNext / isDueForReview) decide — no logic is mocked.
 */

let mockStates = {};
vi.mock('../../services/progressStore', () => ({
  loadAllSkillStates: () => mockStates,
}));
// Mascot preloads webp assets — irrelevant to structure; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

const readySkills = Object.values(SKILLS)
  .filter((s) => s.status === 'ready')
  .sort((a, b) => a.order - b.order);

describe('SkillPathScreen', () => {
  beforeEach(() => {
    mockStates = {};
  });
  afterEach(cleanup);

  it('renders one medallion per ready skill and draws the spine', () => {
    const { container } = render(<SkillPathScreen onSelectSkill={() => {}} />);
    // One tappable medallion button per ready skill.
    expect(screen.getAllByRole('button').length).toBe(readySkills.length);
    // The winding spine is drawn as an SVG path.
    expect(container.querySelector('svg path')).toBeTruthy();
  });

  it('marks the recommended skill as suggested (fresh child → first skill, "new")', () => {
    render(<SkillPathScreen onSelectSkill={() => {}} />);
    expect(screen.getByText('Tinku suggests!')).toBeTruthy();
    expect(screen.queryByText(/Review time!/)).toBeNull();
  });

  // Skill-state builder for the mastery/review cases.
  const mastered = (id, nextReview) => ({
    skillId: id, level: 5, difficulty: 3, maxDifficulty: 3, attempts: 20, correct: 18,
    lastSeen: '2000-01-01', nextReview, reviewInterval: 1, recentParams: [], misconceptions: {},
  });

  it('shows a review-due skill in the teal review token, never amber', () => {
    const firstId = readySkills[0].id;
    mockStates = { [firstId]: mastered(firstId, '2000-01-01') }; // in the past → due (and the only rec)
    const { container } = render(<SkillPathScreen onSelectSkill={() => {}} />);
    expect(screen.getByText(/Review time!/)).toBeTruthy();
    expect(container.querySelector('.text-review')).toBeTruthy();
    expect(container.querySelector('.border-review')).toBeTruthy();
    // Amber is reward-only; it must not carry the review meaning.
    expect(container.querySelector('.border-accent')).toBeNull();
  });

  it('TWO reviews due: suggested one is teal; the other is NEUTRAL, never amber (the fix)', () => {
    const [a, b] = [readySkills[0].id, readySkills[1].id];
    mockStates = {
      [a]: mastered(a, '2000-01-01'), // most overdue → suggested-review (teal)
      [b]: mastered(b, '2000-06-01'), // also due, not suggested → neutral ring, muted cue
    };
    const { container } = render(<SkillPathScreen onSelectSkill={() => {}} />);
    // Both due nodes show the review cue.
    expect(screen.getAllByText(/Review time!/).length).toBe(2);
    // Exactly one loud (teal) ring; the due-not-suggested node does NOT wear amber.
    expect(container.querySelector('.border-review')).toBeTruthy();
    expect(container.querySelectorAll('.border-accent').length).toBe(0);
  });

  it('mastered-not-due shows the amber ring; a separate frontier skill is the suggestion', () => {
    const [a, b] = [readySkills[0].id, readySkills[1].id];
    mockStates = {
      [a]: mastered(a, '2999-12-31'), // mastered, review far in the future → NOT due → amber ring
      [b]: { ...mastered(b, null), level: 2, correct: 6 }, // started, not mastered → frontier suggestion
    };
    const { container } = render(<SkillPathScreen onSelectSkill={() => {}} />);
    expect(container.querySelector('.border-accent')).toBeTruthy(); // amber only when not due
    expect(container.querySelector('.border-learn')).toBeTruthy();  // sky suggestion
    expect(screen.getByText('Tinku suggests!')).toBeTruthy();
    expect(screen.queryByText(/Review time!/)).toBeNull();          // nothing is due
  });
});
