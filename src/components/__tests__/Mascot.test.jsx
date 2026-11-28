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

describe('Mascot — vector art (F6 hero)', () => {
  afterEach(cleanup);
  const src = (c) => c.querySelector('img').getAttribute('src');

  it('waving + vector uses the SVG art; without vector it stays the WebP', () => {
    const vector = render(<Mascot emotion="waving" size={300} vector />);
    expect(src(vector.container)).toMatch(/Tinku_Wave\.svg/);
    cleanup();
    const plain = render(<Mascot emotion="waving" size={300} />);
    expect(src(plain.container)).toMatch(/Tinku_Bye\.webp/);
  });

  it('a pose with no vector art falls back to its WebP', () => {
    const { container } = render(<Mascot emotion="happy" size={120} vector />);
    expect(src(container)).toMatch(/Tinku_Mascot\.webp/);
  });

  it('breathes by default with emotion-specific choreography and omits motion classes when breathe={false}', () => {
    const waving = render(<Mascot emotion="waving" size={58} />);
    expect(waving.container.querySelector('img').className).toContain('mascot-breathe');
    cleanup();
    const celebrate = render(<Mascot emotion="celebrate" size={120} />);
    expect(celebrate.container.querySelector('img').className).toContain('mascot-celebrate');
    expect(celebrate.container.querySelectorAll('[data-mascot-prop="true"]')).toHaveLength(2);
    cleanup();
    const thinking = render(<Mascot emotion="thinking" size={120} />);
    expect(thinking.container.querySelector('img').className).toContain('mascot-thinking');
    expect(thinking.container.querySelectorAll('[data-mascot-prop="true"]')).toHaveLength(2);
    cleanup();
    const encourage = render(<Mascot emotion="encourage" size={120} />);
    expect(encourage.container.querySelector('img').className).toContain('mascot-encourage');
    expect(encourage.container.querySelectorAll('[data-mascot-prop="true"]')).toHaveLength(1);
    cleanup();
    const still = render(<Mascot emotion="waving" size={36} breathe={false} />);
    expect(still.container.querySelector('img').className).not.toContain('mascot-breathe');
  });

  it('Tinku_Wave.svg preserves the original vector trace with GPU-safe arm-wave, ear-wiggle, blink & glow rig', async () => {
    const { readFileSync, statSync } = await import('node:fs');
    const path = 'src/assets/mascot/svg/Tinku_Wave.svg';
    expect(statSync(path).size).toBeLessThan(150 * 1024);
    const svg = readFileSync(path, 'utf8');
    expect(svg).toContain('tinku-wave');
    expect(svg).toContain('tinku-arm');
    expect(svg).toContain('tinku-ear-r');
    expect(svg).toContain('tinku-ear-l');
    expect(svg).toContain('tinku-blink');
    expect(svg).toContain('tinku-glow');
    expect(svg).toContain('prefers-reduced-motion: reduce');
  });
});
