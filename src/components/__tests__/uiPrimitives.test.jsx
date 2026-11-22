// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import HintBubble from '../HintBubble';
import Confetti from '../Confetti';
import MasteryPips from '../MasteryPips';
import QuizPips from '../QuizPips';
import PrivacyNotice from '../PrivacyNotice';

describe('UI primitives (HintBubble, Confetti, MasteryPips, QuizPips, PrivacyNotice)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('HintBubble renders nothing when hint is empty, renders status + Listen button when provided', () => {
    const { container, rerender } = render(<HintBubble hint={null} />);
    expect(container.firstChild).toBeNull();

    const onListen = vi.fn();
    rerender(<HintBubble hint="Count on from the bigger number!" emotion="encourage" onListen={onListen} />);
    expect(screen.getByRole('status').textContent).toBe('Count on from the bigger number!');
    fireEvent.click(screen.getByRole('button', { name: 'Listen to hint' }));
    expect(onListen).toHaveBeenCalledOnce();
  });

  it('Confetti renders decorative pieces by default and returns null when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    const { container, rerender } = render(<Confetti count={8} palette="amber" />);
    expect(container.querySelectorAll('.confetti-piece')).toHaveLength(8);

    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    rerender(<Confetti count={8} palette="party" />);
    expect(container.querySelectorAll('.confetti-piece')).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('MasteryPips displays level out of max and switches token tier by level', () => {
    const { rerender } = render(<MasteryPips level={1} />);
    const low = screen.getByLabelText('Level 1 of 5');
    expect(low.children[0].className).toContain('bg-learn');
    expect(low.children[1].className).toContain('bg-primary-soft');

    rerender(<MasteryPips level={3} />);
    expect(screen.getByLabelText('Level 3 of 5').children[0].className).toContain('bg-primary');

    rerender(<MasteryPips level={5} />);
    expect(screen.getByLabelText('Level 5 of 5').children[4].className).toContain('bg-accent');
  });

  it('QuizPips marks done, now, and todo dots and renders null when total <= 0', () => {
    const { container, rerender } = render(<QuizPips total={0} current={1} />);
    expect(container.firstChild).toBeNull();

    rerender(<QuizPips total={4} current={2} />);
    const pips = screen.getByTestId('quiz-pips').children;
    expect(pips).toHaveLength(4);
    expect(pips[0].dataset.pip).toBe('done');
    expect(pips[1].dataset.pip).toBe('now');
    expect(pips[2].dataset.pip).toBe('todo');
  });

  it('PrivacyNotice renders footer and card variants with optional onReadPolicy link', () => {
    const { rerender } = render(<PrivacyNotice variant="footer" />);
    expect(screen.getByText(/Safe & private by design\./)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Read the full privacy policy/ })).toBeNull();

    const onReadPolicy = vi.fn();
    rerender(<PrivacyNotice variant="card" onReadPolicy={onReadPolicy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Read the full privacy policy' }));
    expect(onReadPolicy).toHaveBeenCalledOnce();
  });
});
