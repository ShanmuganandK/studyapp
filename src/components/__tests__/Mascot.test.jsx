// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import Mascot from '../Mascot';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Mascot — rapid emotion change regression', () => {
  it('stays visible (opacity 1) when emotion changes away and back within FADE_MS (120ms)', () => {
    vi.useFakeTimers();

    const { container, rerender } = render(<Mascot emotion="encourage" size={120} />);
    const img = container.querySelector('img');

    // Initial load completes -> Tinku is visible (opacity 1)
    fireEvent.load(img);
    expect(img.style.opacity).toBe('1');

    // Question advances: emotion changes from 'encourage' -> 'thinking'
    // This sets opacity to 0 and schedules a 120ms timer to swap activeSrc.
    rerender(<Mascot emotion="thinking" size={120} />);
    expect(img.style.opacity).toBe('0');

    // Within 50ms (< 120ms FADE_MS), user taps a wrong answer on the next question:
    // emotion switches back to 'encourage' while activeSrc is still encourageWebp.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender(<Mascot emotion="encourage" size={120} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Tinku must NOT stay invisible at opacity 0!
    expect(img.style.opacity).toBe('1');
  });
});
