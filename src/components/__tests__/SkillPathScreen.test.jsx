// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
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
// Mascot preloads webp assets — irrelevant to structure; stub with a testable marker so we can
// verify at most one Tinku renders on Home at a time.
vi.mock('../Mascot', () => ({
  default: ({ emotion, size, vector, breathe = true }) => (
    <span
      data-testid="mascot"
      data-emotion={emotion}
      data-size={String(size)}
      data-vector={String(!!vector)}
      data-breathe={String(!!breathe)}
    />
  ),
}));

// SkillPathScreen defaults to grade 1 (no grade prop passed below), so this must match the
// same grade filter the component applies via readySkills(1) — not every ready skill overall.
const readySkills = Object.values(SKILLS)
  .filter((s) => s.status === 'ready' && s.grade === 1)
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
    // Exactly one Tinku on Home when a suggested node is shown (not one in header + one on path).
    expect(screen.getAllByTestId('mascot')).toHaveLength(1);
  });

  it('shows exactly one Tinku in the header when all skills are caught up (no suggested node)', () => {
    mockStates = Object.fromEntries(readySkills.map((s) => [s.id, mastered(s.id, '2999-12-31')]));
    render(<SkillPathScreen onSelectSkill={() => {}} />);
    expect(screen.queryByText('Tinku suggests!')).toBeNull();
    expect(screen.getAllByTestId('mascot')).toHaveLength(1);
  });

  it('grade 2 (fresh): Tinku suggests a Class 2 skill, not Class 1 counting (DECISIONS 2026-10-20)', () => {
    render(<SkillPathScreen grade={2} onSelectSkill={() => {}} />);
    const suggestedRow = screen.getByText('Tinku suggests!').parentElement;
    // the row holding the suggestion also holds the Class 2 "Hundreds Club" (g2.num.3digit) medallion
    expect(suggestedRow.parentElement.querySelector('[aria-label="Hundreds Club"]')).toBeTruthy();
    expect(screen.queryByLabelText('Number Party')).toBeNull(); // Class 1 skills are not on this screen at all
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

  // ── TD-15: Tinku's stop must be on screen when Home opens ───────────────────────────────────────
  describe("keeps Tinku's stop in view (TD-15)", () => {
    // jsdom has no layout, so scrolling and IntersectionObserver are stubbed: we assert WHICH element
    // the screen asks to scroll / watch, and that "Back to Tinku" follows what the observer reports.
    let scrolled; // [{ el, opts }] — `this` and options of every scrollIntoView call
    let observer; // the single IntersectionObserver the screen creates
    beforeEach(() => {
      scrolled = [];
      Element.prototype.scrollIntoView = vi.fn(function scrollIntoView(opts) { scrolled.push({ el: this, opts }); });
      observer = null;
      globalThis.IntersectionObserver = class {
        constructor(cb) { this.cb = cb; this.targets = []; observer = this; }
        observe(el) { this.targets.push(el); }
        disconnect() { this.targets = []; }
      };
    });
    afterEach(() => {
      delete Element.prototype.scrollIntoView;
      delete globalThis.IntersectionObserver;
    });

    // Counting 1–9 at the unlock level, 2D shapes just started → Tinku sits far down the path (stop 15).
    const farSuggestion = () => {
      mockStates = {
        'g1.count.1-9': { ...mastered('g1.count.1-9', null), level: 3 },
        'g1.shapes.2d': { ...mastered('g1.shapes.2d', null), level: 1 },
      };
      return SKILLS['g1.shapes.2d'].displayName ?? SKILLS['g1.shapes.2d'].name;
    };
    const suggestedRow = () => screen.getByText('Tinku suggests!').closest('li');
    const report = (entry) => act(() => observer.cb([entry]));

    it('scrolls the suggested stop to the middle of the screen on load', () => {
      const label = farSuggestion();
      render(<SkillPathScreen onSelectSkill={() => {}} />);
      expect(suggestedRow().querySelector(`[aria-label="${label}"]`)).toBeTruthy(); // the far stop is the suggestion
      expect(scrolled).toHaveLength(1);
      expect(scrolled[0].el).toBe(suggestedRow());
      expect(scrolled[0].opts).toEqual({ block: 'center' }); // instant: no smooth scroll on load
    });

    it('does not scroll when all caught up (no stop holds Tinku; the header Tinku shows)', () => {
      mockStates = Object.fromEntries(readySkills.map((s) => [s.id, mastered(s.id, '2999-12-31')]));
      render(<SkillPathScreen onSelectSkill={() => {}} />);
      expect(screen.getAllByRole('button')).toHaveLength(readySkills.length); // path rendered
      expect(scrolled).toHaveLength(0);
    });

    it('"Back to Tinku" appears only while the stop is out of view, points the right way, and scrolls back', () => {
      farSuggestion();
      render(<SkillPathScreen onSelectSkill={() => {}} />);
      expect(observer.targets).toEqual([suggestedRow()]);
      expect(screen.queryByRole('button', { name: 'Back to Tinku' })).toBeNull(); // in view (or unknown) → hidden

      // The child scrolls back to the top: Tinku's stop is now BELOW the visible area.
      report({ intersectionRatio: 0, boundingClientRect: { top: 5000 } });
      const back = screen.getByRole('button', { name: 'Back to Tinku' });
      expect(back.querySelector('[data-direction="down"]')).toBeTruthy();
      expect(back.querySelector('[data-testid="mascot"]').dataset.breathe).toBe('false');

      fireEvent.click(back);
      expect(scrolled.at(-1).el).toBe(suggestedRow());
      expect(scrolled.at(-1).opts).toEqual({ block: 'center', behavior: 'smooth' });

      // Stop back in view → button goes away. Scrolled past it → button points up.
      report({ intersectionRatio: 1, boundingClientRect: { top: 200 } });
      expect(screen.queryByRole('button', { name: 'Back to Tinku' })).toBeNull();
      report({ intersectionRatio: 0, boundingClientRect: { top: -5000 } });
      expect(screen.getByRole('button', { name: 'Back to Tinku' }).querySelector('[data-direction="up"]')).toBeTruthy();
    });
  });

  // ── F6: 1-beat Wonder Hero on cold open + stop-to-stop hop only when Tinku advances ──────────────
  describe('Wonder Hero intro & stop-advance hop (F6)', () => {
    let frames;
    let scrolled;
    const motion = (reduce) => vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduce })));
    const runFrames = (times) => times.forEach((t) => act(() => frames.splice(0).forEach((cb) => cb(t))));
    beforeEach(() => {
      frames = [];
      vi.stubGlobal('requestAnimationFrame', (cb) => frames.push(cb));
      vi.stubGlobal('cancelAnimationFrame', () => {});
      scrolled = [];
      Element.prototype.scrollIntoView = vi.fn(function scrollIntoView(opts) { scrolled.push({ el: this, opts }); });
      mockStates = {
        'g1.count.1-9': { ...mastered('g1.count.1-9', null), level: 3 },
        'g1.shapes.2d': { ...mastered('g1.shapes.2d', null), level: 1 }, // → Tinku's stop is 15 of 19
      };
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      delete Element.prototype.scrollIntoView;
    });
    const traveller = (c) => c.querySelector('[data-tinku="travel"]');
    const stopTinku = (c) => c.querySelector('[data-tinku="stop"]');
    const backdrop = (c) => c.querySelector('[data-tinku="hero-backdrop"]');
    const travelSize = (c) => Number(traveller(c).querySelector('[data-testid="mascot"]').dataset.size);

    it('intro: shows WonderBackdrop + vector Hero Tinku, hides bottom bar, then cross-fades to the stop with a hop', () => {
      motion(false);
      const onHeroChange = vi.fn();
      const { container } = render(<SkillPathScreen onSelectSkill={() => {}} intro onHeroChange={onHeroChange} />);

      expect(backdrop(container)).toBeTruthy();
      expect(backdrop(container).querySelector('[data-testid="wonder-backdrop"]')).toBeTruthy();
      expect(travelSize(container)).toBeGreaterThan(104);
      expect(traveller(container).querySelector('[data-testid="mascot"]').dataset.vector).toBe('true');
      expect(traveller(container).querySelector('[data-testid="mascot"]').dataset.breathe).toBe('false');
      expect(stopTinku(container).style.opacity).toBe('0');
      expect(onHeroChange).toHaveBeenLastCalledWith(true);

      // Hold phase (< 1500 ms): cover stays opaque and bar stays hidden so Tinku's ~0.68 s blink plays cleanly.
      runFrames([0, 700, 1450]);
      expect(backdrop(container).style.opacity).toBe('1');
      expect(onHeroChange).toHaveBeenLastCalledWith(true);

      // Fade phase (1500..1820 ms): bar returns as hero cross-fades out, then Tinku lands on the stop.
      runFrames([1560]);
      expect(onHeroChange).toHaveBeenLastCalledWith(false);
      runFrames([1700, 1900]);
      expect(traveller(container)).toBeNull();
      expect(backdrop(container)).toBeNull();
      expect(stopTinku(container).style.opacity).toBe('1');
      expect(stopTinku(container).className).toContain('animate-tinku-land');
      expect(screen.getAllByTestId('mascot')).toHaveLength(1);
    });

    it('intro: sizes the hero elephant crisply at Grade-Picker proportions (412×915)', () => {
      motion(false);
      vi.stubGlobal('innerWidth', 412);
      vi.stubGlobal('innerHeight', 915);
      const { container } = render(<SkillPathScreen onSelectSkill={() => {}} intro />);
      expect(travelSize(container)).toBeGreaterThanOrEqual(300);
      expect(travelSize(container)).toBeLessThanOrEqual(360);
    });

    it('intro: any tap during the hero skips straight to the settled stop and restores the bar', () => {
      motion(false);
      const onHeroChange = vi.fn();
      const { container } = render(<SkillPathScreen onSelectSkill={() => {}} intro onHeroChange={onHeroChange} />);
      runFrames([0, 300]);
      expect(backdrop(container)).toBeTruthy();
      fireEvent.pointerDown(window);
      expect(onHeroChange).toHaveBeenLastCalledWith(false);
      expect(traveller(container)).toBeNull();
      expect(backdrop(container)).toBeNull();
      expect(stopTinku(container).style.opacity).toBe('1');
    });

    it('return visit to the SAME stop (intro=false): opens immediately on the stop with a hop — no top-to-bottom glide', () => {
      motion(false);
      const onStopChange = vi.fn();
      const { container } = render(
        <SkillPathScreen onSelectSkill={() => {}} fromSkillId="g1.shapes.2d" onStopChange={onStopChange} />,
      );
      expect(backdrop(container)).toBeNull();
      expect(traveller(container)).toBeNull();
      expect(stopTinku(container).style.opacity).toBe('1');
      expect(stopTinku(container).className).toContain('animate-tinku-land');
      expect(scrolled).toHaveLength(1);
      expect(onStopChange).toHaveBeenCalledWith('g1.shapes.2d');
    });

    it('stop advance (fromSkillId !== new stop): hops along an arc from the old stop to the new stop, skippable on tap', () => {
      motion(false);
      const { container } = render(<SkillPathScreen onSelectSkill={() => {}} fromSkillId="g1.count.1-9" />);
      expect(backdrop(container)).toBeNull();
      expect(traveller(container)).toBeTruthy();
      expect(travelSize(container)).toBe(58);
      expect(stopTinku(container).style.opacity).toBe('0');

      runFrames([0, 250, 600, 1000, 1400]);
      expect(traveller(container)).toBeNull();
      expect(stopTinku(container).style.opacity).toBe('1');
      expect(stopTinku(container).className).toContain('animate-tinku-land');
      expect(screen.getAllByTestId('mascot')).toHaveLength(1);
    });

    it('reduced motion: no hero, no hop, no land bounce — instant TD-15 jump', () => {
      motion(true);
      const { container } = render(<SkillPathScreen onSelectSkill={() => {}} intro fromSkillId="g1.count.1-9" />);
      expect(backdrop(container)).toBeNull();
      expect(traveller(container)).toBeNull();
      expect(stopTinku(container).className).not.toContain('animate-tinku-land');
      expect(scrolled.map((s) => s.opts)).toEqual([{ block: 'center' }]);
    });

    it('all caught up: header Tinku stays put in vector art and reports null stop', () => {
      motion(false);
      const onStopChange = vi.fn();
      mockStates = Object.fromEntries(readySkills.map((s) => [s.id, mastered(s.id, '2999-12-31')]));
      const { container } = render(<SkillPathScreen onSelectSkill={() => {}} intro onStopChange={onStopChange} />);
      expect(screen.getAllByRole('button')).toHaveLength(readySkills.length);
      expect(traveller(container)).toBeNull();
      expect(screen.getAllByTestId('mascot')).toHaveLength(1);
      expect(screen.getByTestId('mascot').dataset.vector).toBe('true');
      expect(onStopChange).toHaveBeenCalledWith(null);
    });
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
