// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SkillCard from '../SkillCard';

/**
 * Smoke test for the home skill card (Screen 3). Presentational only — asserts what a child/parent
 * sees for each state the ENGINE hands in (suggested vs review vs plain, pips, due-for-review),
 * plus the locked colour rule that review-due uses the `review` token, never amber.
 */

const skill = { id: 'g1.add.within20', icon: '➕', displayName: 'Add it up', subtitle: 'Addition within 20' };

const base = {
  skill,
  level: 2,
  isDue: false,
  isSuggested: false,
  isReviewSuggested: false,
  index: 0,
  onClick: () => {},
};

describe('SkillCard', () => {
  afterEach(cleanup);

  it('renders the skill name, subtitle and icon', () => {
    render(<SkillCard {...base} />);
    expect(screen.getByText('Add it up')).toBeTruthy();
    expect(screen.getByText('Addition within 20')).toBeTruthy();
    expect(screen.getByText('➕')).toBeTruthy();
  });

  it('shows the "Tinku suggests!" label when suggested (non-review)', () => {
    render(<SkillCard {...base} isSuggested />);
    expect(screen.getByText('Tinku suggests!')).toBeTruthy();
    expect(screen.queryByText(/Review time/)).toBeNull();
  });

  it('shows the review label and uses the review token (not amber) for a review recommendation', () => {
    const { container } = render(<SkillCard {...base} isSuggested isReviewSuggested />);
    expect(screen.getByText(/Review time!/)).toBeTruthy();
    // ↻ glyph carries the dedicated review token; amber is reserved for reward only.
    const reviewGlyph = container.querySelector('.text-review');
    expect(reviewGlyph).toBeTruthy();
    expect(container.querySelector('.text-amber-500')).toBeNull();
    // Border reflects the review state.
    expect(container.querySelector('.border-review')).toBeTruthy();
  });

  it('marks a due-for-review skill in the pips with the review token', () => {
    const { container } = render(<SkillCard {...base} isDue />);
    expect(screen.getByLabelText('due for review')).toBeTruthy();
    expect(container.querySelector('.text-review')).toBeTruthy();
  });
});
