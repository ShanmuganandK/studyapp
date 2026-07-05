// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CelebrationScreen from '../CelebrationScreen';

/**
 * Smoke test for the session-end celebration (Screen 2). Presentational only — this guards the
 * things a caller/child depends on: the mood-floor "Great job!", the score read-out, both CTAs,
 * and the optional mastery-up beat rendering ONLY when the hook surfaces it. The choreography
 * itself is CSS (animation-delay) and not asserted here.
 */

// Mascot preloads webp assets — irrelevant to structure; stub it.
vi.mock('../Mascot', () => ({ default: () => null }));

const baseProps = {
  score: 6,
  total: 8,
  masteryUp: null,
  onPlayAgain: () => {},
  onExit: () => {},
};

describe('CelebrationScreen', () => {
  afterEach(cleanup);

  it('always celebrates (mood floor) and shows the score read-out + both CTAs', () => {
    render(<CelebrationScreen {...baseProps} score={0} />);
    expect(screen.getByText('Great job!')).toBeTruthy();
    expect(screen.getByText('0 / 8 correct')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play again' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pick another skill' })).toBeTruthy();
  });

  it('renders no mastery-up beat when the hook surfaces none', () => {
    render(<CelebrationScreen {...baseProps} />);
    expect(screen.queryByText(/mastered|levelled up/i)).toBeNull();
  });

  it('celebrates a just-mastered skill by name', () => {
    render(<CelebrationScreen {...baseProps} masteryUp={{ justMastered: true, leveledUp: true, skillName: 'Add within 20' }} />);
    expect(screen.getByText('You mastered Add within 20! ⭐')).toBeTruthy();
  });

  it('celebrates a level-up (not yet mastered) by name', () => {
    render(<CelebrationScreen {...baseProps} masteryUp={{ justMastered: false, leveledUp: true, skillName: 'Count to 20' }} />);
    expect(screen.getByText('Count to 20 levelled up! ⭐')).toBeTruthy();
  });
});
