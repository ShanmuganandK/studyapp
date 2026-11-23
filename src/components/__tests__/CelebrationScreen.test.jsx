// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
  skillName: 'Add within 10',
  masteryUp: null,
  onPlayAgain: () => {},
  onExit: () => {},
};

describe('CelebrationScreen', () => {
  afterEach(cleanup);

  it('always celebrates (mood floor), shows skill name, SVG stars, and both CTAs', () => {
    const { container } = render(<CelebrationScreen {...baseProps} score={0} />);
    expect(screen.getByText('Great job!')).toBeTruthy();
    expect(screen.getByText('Add within 10')).toBeTruthy();
    expect(screen.getByText('0 / 8 correct')).toBeTruthy();
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(8);
    expect(container.textContent).not.toContain('⭐');
    expect(container.textContent).not.toContain('☆');
    expect(screen.getByRole('button', { name: 'Play again' }).className).toContain('bg-primary');
    expect(screen.getByRole('button', { name: 'Pick another skill' })).toBeTruthy();
  });

  it('renders no mastery-up beat when the hook surfaces none', () => {
    render(<CelebrationScreen {...baseProps} />);
    expect(screen.queryByText(/mastered|levelled up/i)).toBeNull();
  });

  const NEXT = { skillId: 'g1.num.compare20', skillName: 'Big or Small?' };

  it('celebrates a just-mastered skill, shows level pips, and Next with Tinku → opens the next skill', () => {
    const onNext = vi.fn();
    const onExit = vi.fn();
    render(
      <CelebrationScreen
        {...baseProps}
        onNext={onNext}
        onExit={onExit}
        skillName="Add within 20"
        masteryUp={{ justMastered: true, leveledUp: true, level: 5, skillName: 'Add within 20', next: NEXT }}
      />,
    );
    expect(screen.getByText('You mastered Add within 20!')).toBeTruthy();
    expect(screen.getByLabelText('Level 5 of 5')).toBeTruthy();
    const nextBtn = screen.getByRole('button', { name: 'Next with Tinku: Big or Small?' });
    expect(nextBtn.textContent).toBe('Next with Tinku →');
    expect(nextBtn.className).toContain('bg-primary');
    expect(screen.getByRole('button', { name: 'Play again' }).className).not.toContain('bg-primary');
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledWith('g1.num.compare20');
    expect(onExit).not.toHaveBeenCalled(); // it starts the next skill, it does not just go home
  });

  it('celebrates a level-up (not yet mastered) and promotes Next with Tinku → when a new skill is recommended', () => {
    render(
      <CelebrationScreen
        {...baseProps}
        onNext={() => {}}
        skillName="Count to 20"
        masteryUp={{ justMastered: false, leveledUp: true, level: 2, skillName: 'Count to 20', next: NEXT }}
      />,
    );
    expect(screen.getByText('Count to 20 levelled up!')).toBeTruthy();
    expect(screen.getByLabelText('Level 2 of 5')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Next with Tinku/ }).className).toContain('bg-primary');
  });

  it('keeps Play again as the main button after a level-up when there is no different skill to go to', () => {
    render(
      <CelebrationScreen
        {...baseProps}
        onNext={() => {}}
        masteryUp={{ justMastered: false, leveledUp: true, level: 2, skillName: 'Count to 20', next: null }}
      />,
    );
    expect(screen.getByText('Count to 20 levelled up!')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Next with Tinku/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Play again' }).className).toContain('bg-primary');
    expect(screen.getByRole('button', { name: 'Pick another skill' })).toBeTruthy();
  });
});
