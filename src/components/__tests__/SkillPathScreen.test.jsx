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

  it('shows a review-due skill in the teal review token, never amber', () => {
    const firstId = readySkills[0].id;
    mockStates = {
      [firstId]: {
        skillId: firstId,
        level: 5,
        difficulty: 3,
        maxDifficulty: 3,
        attempts: 20,
        correct: 18,
        lastSeen: '2000-01-01',
        nextReview: '2000-01-01', // safely in the past → due
        reviewInterval: 1,
        recentParams: [],
        misconceptions: {},
      },
    };
    const { container } = render(<SkillPathScreen onSelectSkill={() => {}} />);
    expect(screen.getByText(/Review time!/)).toBeTruthy();
    expect(container.querySelector('.text-review')).toBeTruthy();
    expect(container.querySelector('.border-review')).toBeTruthy();
    // Amber is reward-only; it must not carry the review meaning.
    expect(container.querySelector('.text-amber-500')).toBeNull();
    expect(container.querySelector('.border-amber-400')).toBeNull();
  });
});
