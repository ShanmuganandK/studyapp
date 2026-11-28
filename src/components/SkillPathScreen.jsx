import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { PRODUCT_NAME } from '../config/brand';
import { SKILLS } from '../recipes/skillMap';
import { readySkills } from '../engine/sessionLite';
import { loadAllSkillStates } from '../services/progressStore';
import { isDueForReview } from '../engine/mastery';
import { MASTERY } from '../config/masteryConfig';
import { recommendNext } from '../engine/composer';
import { getSkillVisual } from './skillStateVisual';
import { SkillStateCue } from './SkillStateCue';
import Mascot from './Mascot';
import WonderBackdrop from './WonderBackdrop';
import PrivacyNotice from './PrivacyNotice';
import SkillIcon from './SkillIcon';

/**
 * SkillPathScreen — the Home / Journey Path screen, displaying every `status:'ready'` skill
 * from the skill map (for the active grade) as a vertical winding path of medallions.
 *
 * Ages 6–8 Hero & Motion Cadence (ROADMAP F6, 2026-11-28):
 *   1. Cold-open Hero (`intro === true`, motion allowed): full-screen Wonder World scene
 *      (`WonderBackdrop` + animated vector `Tinku_Wave.svg`, bottom bar hidden) holds `900 ms`,
 *      then cross-fades (`320 ms`) directly onto Tinku already centred on his recommended stop
 *      with a `tinku-land` hop (`260 ms`).
 *   2. Smart return visits (`intro === false`):
 *      - Same stop: opens immediately centred on Tinku's stop with a quick `260 ms` hop (no
 *        repetitive top-to-bottom glide).
 *      - New stop (`fromSkillId → recommendation.skillId`): Tinku hops along a parabolic arc
 *        from his previous stop to the new stop (`600–1100 ms`) while the path scrolls smoothly.
 *   3. Any tap, scroll, or key (`SKIP_EVENTS`) skips immediately to the settled stop;
 *      `prefers-reduced-motion: reduce` disables all hero/hop motion.
 */

// Layout constants — the path geometry. Nodes sit on two lanes (% of width) at fixed row heights;
// the SVG spine weaves between the same lanes, so HTML nodes and the drawn thread always align.
const LANE_LEFT = 30; // %
const LANE_RIGHT = 70; // %
const ROW_H = 128; // px per skill row

const HEADER_TINKU = 104; // px — header Tinku when all skills are caught up (no stop holds Tinku)
const STOP_TINKU = 58; // px — Tinku beside the suggested medallion
const HERO_HOLD_MS = 900;
const HERO_FADE_MS = 320;
const HOP_HOLD_MS = 180;
const HOP_ARC_PX = 28;

// Bounding box of the waving elephant in `Tinku_Wave.svg` (2000×2000 viewBox):
// elephant fills 68% × 81% of the canvas, visually centred at (54%, 53%).
const HERO_ART = { w: 0.68, h: 0.81, cx: 0.54, cy: 0.53 };

const heroSize = () => {
  const appWidth = Math.min(window.innerWidth, 448); // the app is max-w-md on tablets and desktop
  return Math.round(Math.min((appWidth * 0.8) / HERO_ART.w, (window.innerHeight * 0.55) / HERO_ART.h));
};
const hopMs = (dy) => Math.min(1100, Math.max(600, 480 + Math.abs(dy) * 0.45));
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const SKIP_EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown'];

/** Nearest scrolling ancestor (Layout's content area). */
function scrollParentOf(el) {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === 'auto' || overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

/** Centre `row` inside `scroller` (or fall back to `scrollIntoView` in jsdom). */
function centreRowInScroller(row, scroller) {
  if (!row) return;
  if (scroller) {
    const s = scroller.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    const target = scroller.scrollTop + r.top - s.top + r.height / 2 - scroller.clientHeight / 2;
    scroller.scrollTop = Math.min(scroller.scrollHeight - scroller.clientHeight, Math.max(0, target));
  } else {
    row.scrollIntoView?.({ block: 'center' });
  }
}

/** Build the winding spine path (SVG user units: x in 0–100, y in px). */
function buildSpine(count) {
  if (count < 2) return '';
  const laneX = (i) => (i % 2 === 0 ? LANE_LEFT : LANE_RIGHT);
  const rowY = (i) => i * ROW_H + ROW_H / 2;
  let d = `M ${laneX(0)} ${rowY(0)}`;
  for (let i = 1; i < count; i++) {
    const y0 = rowY(i - 1);
    const y1 = rowY(i);
    const midY = (y0 + y1) / 2;
    d += ` C ${laneX(i - 1)} ${midY}, ${laneX(i)} ${midY}, ${laneX(i)} ${rowY(i)}`;
  }
  return d;
}

export default function SkillPathScreen({
  grade = 1,
  onSelectSkill,
  intro = false,
  fromSkillId = null,
  onStopChange,
  onHeroChange,
}) {
  const [{ allStates, recommendation }] = useState(() => {
    const states = loadAllSkillStates();
    const nowDate = new Date().toISOString().slice(0, 10);
    return { allStates: states, recommendation: recommendNext(states, SKILLS, nowDate, undefined, { grade }) };
  });
  const today = new Date().toISOString().slice(0, 10);

  const skills = readySkills(grade).sort((a, b) => a.order - b.order);
  const suggestedIdx =
    recommendation.reason !== 'all_caught_up' ? skills.findIndex((s) => s.id === recommendation.skillId) : -1;
  const hasPathMascot = suggestedIdx >= 0;

  const fromIdx =
    hasPathMascot && !intro && fromSkillId && fromSkillId !== recommendation.skillId
      ? skills.findIndex((s) => s.id === fromSkillId)
      : -1;

  const spine = buildSpine(skills.length);
  const pathHeight = skills.length * ROW_H;

  const rootRef = useRef(null);
  const suggestedRef = useRef(null);
  const fromRowRef = useRef(null);
  const backdropRef = useRef(null);
  const walkerRef = useRef(null);
  const hopAnchorRef = useRef(null);
  const backAnchorRef = useRef(null);
  const [tinkuAway, setTinkuAway] = useState(null);

  const [allowMotion] = useState(
    () =>
      hasPathMascot &&
      typeof requestAnimationFrame === 'function' &&
      typeof window.matchMedia === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Motion mode decided once on mount: 'hero' (cold open) | 'hop' (stop advanced) | 'settled' (same stop / reduced).
  const [phase, setPhase] = useState(() => {
    if (!allowMotion) return 'settled';
    if (intro) return 'hero';
    if (fromIdx >= 0) return 'hop';
    return 'settled';
  });
  const [heroPx] = useState(() => (phase === 'hero' ? heroSize() : STOP_TINKU));

  // Report the current recommended stop so AppRouter can detect future stop advances.
  useEffect(() => {
    onStopChange?.(hasPathMascot ? recommendation.skillId : null);
  }, [hasPathMascot, recommendation.skillId, onStopChange]);

  // Before first paint in Hero mode: hide the bottom nav, pre-centre the path underneath the opaque
  // Wonder cover so revealing Home needs zero layout jump, and size the full-bleed cover + centred hero Tinku.
  useLayoutEffect(() => {
    const row = suggestedRef.current;
    if (phase === 'hero') {
      onHeroChange?.(true);
      const scroller = scrollParentOf(row);
      centreRowInScroller(row, scroller);

      const backdrop = backdropRef.current;
      const walker = walkerRef.current;
      const root = rootRef.current?.getBoundingClientRect();
      const app =
        backdrop?.closest('.app-frame')?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      if (backdrop && root) {
        Object.assign(backdrop.style, {
          top: `${app.top - root.top - 40}px`,
          left: `${app.left - root.left}px`,
          width: `${app.width}px`,
          height: `${app.height + 80}px`,
          opacity: '1',
        });
      }
      if (walker) {
        // Inside the backdrop (width = app.width, top shifted -40px for view-enter slack), place heroPx
        // so HERO_ART.(cx, cy) sits at the exact centre of `.app-frame`.
        const left = app.width / 2 - heroPx * HERO_ART.cx;
        const top = 40 + app.height / 2 - heroPx * HERO_ART.cy;
        Object.assign(walker.style, {
          left: `${left}px`,
          top: `${top}px`,
        });
      }
      return;
    }

    if (phase === 'hop') {
      const startRow = fromRowRef.current ?? row;
      centreRowInScroller(startRow, scrollParentOf(startRow));
      return;
    }

    // 'settled' from mount (same stop or reduced motion): centre immediately on Tinku's stop.
    if (row) {
      centreRowInScroller(row, scrollParentOf(row));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Drive 'hero' (hold + cross-fade) or 'hop' (parabolic stop-to-stop arc), with instant skip on any input.
  useEffect(() => {
    if (phase !== 'hero' && phase !== 'hop') return undefined;
    const row = suggestedRef.current;
    if (!row) return undefined;

    const scroller = scrollParentOf(row);
    let frame = 0;
    let start = null;
    let finished = false;
    let barBack = phase !== 'hero';
    const bringBarBack = () => {
      if (!barBack) {
        barBack = true;
        onHeroChange?.(false);
      }
    };

    let hopGeo = null;
    const measureHop = () => {
      const anchor = hopAnchorRef.current;
      const targetStop = row.querySelector('[data-tinku="stop"]');
      if (!anchor || !targetStop) return { dx: 0, dy: 0, scrollFrom: 0, scrollTo: 0, ms: 650 };
      const a = anchor.getBoundingClientRect();
      const b = targetStop.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      let scrollTo = 0;
      const scrollFrom = scroller ? scroller.scrollTop : 0;
      if (scroller) {
        const s = scroller.getBoundingClientRect();
        const centred = scrollFrom + r.top - s.top + r.height / 2 - scroller.clientHeight / 2;
        scrollTo = Math.min(scroller.scrollHeight - scroller.clientHeight, Math.max(0, centred));
      }
      const dy = b.top - a.top;
      return { dx: b.left - a.left, dy, scrollFrom, scrollTo, ms: hopMs(dy) };
    };

    const land = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, land));
      bringBarBack();
      centreRowInScroller(row, scroller);
      setPhase('landed');
    };

    const step = (now) => {
      if (start === null) start = now;
      const elapsed = now - start;

      if (phase === 'hero') {
        const backdrop = backdropRef.current;
        const walker = walkerRef.current;
        if (elapsed >= HERO_HOLD_MS) {
          bringBarBack();
          const t = Math.min(1, (elapsed - HERO_HOLD_MS) / HERO_FADE_MS);
          const k = easeInOut(t);
          if (backdrop) backdrop.style.opacity = String(1 - k);
          if (walker) walker.style.transform = `scale(${1 - 0.06 * k})`;
          if (t >= 1) return land();
        }
      } else {
        const walker = walkerRef.current;
        const t = elapsed - HOP_HOLD_MS;
        if (t >= 0) {
          if (!hopGeo) hopGeo = measureHop();
          const p = Math.min(1, t / hopGeo.ms);
          const e = easeInOut(p);
          const arcY = -HOP_ARC_PX * Math.sin(Math.PI * p);
          if (walker) walker.style.transform = `translate(${hopGeo.dx * e}px, ${hopGeo.dy * e + arcY}px)`;
          if (scroller) scroller.scrollTop = hopGeo.scrollFrom + (hopGeo.scrollTo - hopGeo.scrollFrom) * e;
          if (p >= 1) return land();
        }
      }

      frame = requestAnimationFrame(step);
      return undefined;
    };

    SKIP_EVENTS.forEach((type) => window.addEventListener(type, land, { passive: true }));
    frame = requestAnimationFrame(step);
    return () => {
      finished = true;
      cancelAnimationFrame(frame);
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, land));
      bringBarBack();
    };
  }, [phase, onHeroChange]);

  // Offer "Back to Tinku" while Tinku's stop is scrolled mostly out of view.
  useEffect(() => {
    const row = suggestedRef.current;
    if (!row || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) return setTinkuAway(null);
        const anchorTop = backAnchorRef.current?.getBoundingClientRect().top ?? 0;
        return setTinkuAway(entry.boundingClientRect.top < anchorTop ? 'up' : 'down');
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const backToTinku = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    suggestedRef.current?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const inFlight = phase === 'hero' || phase === 'hop';
  const stopTinkuState = inFlight ? 'hidden' : allowMotion ? 'land' : 'still';
  const staggerAnchor = Math.max(phase === 'hop' && fromIdx >= 0 ? fromIdx : suggestedIdx, 0);

  return (
    <div ref={rootRef} className="relative flex flex-col items-center min-h-full bg-bg px-4 py-6 text-center">
      {!hasPathMascot && <Mascot emotion="waving" size={HEADER_TINKU} vector />}

      {/* Cold-open 1-beat Wonder World Hero Scene (first Home of an app open only). */}
      {phase === 'hero' && (
        <div
          ref={backdropRef}
          data-tinku="hero-backdrop"
          aria-hidden="true"
          className="absolute z-40 overflow-hidden bg-primary-soft pointer-events-none"
        >
          <WonderBackdrop />
          <span className="absolute inset-x-0 top-16 z-10 font-display text-title font-extrabold text-primary-ink text-center">
            {PRODUCT_NAME}
          </span>
          <div
            ref={walkerRef}
            data-tinku="travel"
            className="absolute will-change-transform"
            style={{ width: heroPx, height: heroPx }}
          >
            <Mascot emotion="waving" size={heroPx} vector breathe={false} />
          </div>
        </div>
      )}

      <h2 className="font-display text-2xl font-extrabold text-primary-ink mt-2">What shall we practise?</h2>
      <p className="text-muted text-sm mb-4">Follow the path with Tinku!</p>

      {/* The journey. Relative wrapper: the spine SVG sits behind the flow-positioned node rows. */}
      <div className="relative w-full max-w-sm" style={{ height: pathHeight }}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 100 ${pathHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={spine}
            fill="none"
            stroke="var(--color-primary-soft)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <ol className="relative list-none m-0 p-0">
          {skills.map((skill, i) => {
            const skillState = allStates[skill.id];
            const level = skillState?.level ?? 0;
            const isDue = skillState ? isDueForReview(skillState, today) : false;
            const isSuggested = i === suggestedIdx;
            const isFromStop = phase === 'hop' && i === fromIdx;
            const isReviewSuggested = isSuggested && recommendation.reason === 'review';
            const isLeft = i % 2 === 0;

            return (
              <li
                key={skill.id}
                ref={(el) => {
                  if (isSuggested) suggestedRef.current = el;
                  if (i === fromIdx) fromRowRef.current = el;
                }}
                className="relative animate-opt-in"
                // Ripple outward from the visible stop (capped at 280 ms so nearby nodes never sit blank).
                style={{
                  height: ROW_H,
                  animationDelay: `${Math.min(280, Math.abs(i - staggerAnchor) * 35)}ms`,
                }}
              >
                <PathNode
                  skill={skill}
                  level={level}
                  isDue={isDue}
                  isSuggested={isSuggested}
                  isReviewSuggested={isReviewSuggested}
                  isLeft={isLeft}
                  tinku={stopTinkuState}
                  onClick={() => onSelectSkill(skill.id)}
                />
                {isFromStop && (
                  <div
                    ref={hopAnchorRef}
                    className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none"
                    style={{ ...(isLeft ? { left: '-2px' } : { right: '-2px' }), width: STOP_TINKU, height: STOP_TINKU }}
                  >
                    <div ref={walkerRef} data-tinku="travel" className="will-change-transform" style={{ width: STOP_TINKU, height: STOP_TINKU }}>
                      <Mascot emotion="waving" size={STOP_TINKU} breathe={false} />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* "Back to Tinku" — shown only while Tinku's stop is scrolled out of view. */}
      {hasPathMascot && (
        <div ref={backAnchorRef} className="sticky bottom-4 z-30 h-0 w-full max-w-sm">
          {tinkuAway && !inFlight && (
            <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none">
              <button
                type="button"
                onClick={backToTinku}
                aria-label="Back to Tinku"
                className="pointer-events-auto animate-opt-in min-h-[48px] flex items-center gap-2 pl-2 pr-4 rounded-full bg-bg-card border-2 border-primary-soft shadow-card font-display font-extrabold text-primary-ink active:scale-95 transition-transform"
              >
                <Mascot emotion="waving" size={36} breathe={false} />
                Back to Tinku
                <span data-direction={tinkuAway} aria-hidden="true">
                  {tinkuAway === 'up' ? <ArrowUp size={20} strokeWidth={2.5} /> : <ArrowDown size={20} strokeWidth={2.5} />}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <PrivacyNotice variant="footer" />
    </div>
  );
}

// ── One stop on the path: medallion + label + (when suggested) the Tinku "go here" marker ──

function PathNode({ skill, level, isDue, isSuggested, isReviewSuggested, isLeft, tinku = 'still', onClick }) {
  const visual = getSkillVisual({ level, isDue, isSuggested, isReviewSuggested });

  const lanePct = isLeft ? LANE_LEFT : LANE_RIGHT;
  const labelSide = isLeft
    ? { left: `calc(${LANE_LEFT}% + 46px)`, right: '8px', textAlign: 'left' }
    : { right: `calc(${100 - LANE_RIGHT}% + 46px)`, left: '8px', textAlign: 'right' };

  return (
    <>
      <button
        onClick={onClick}
        aria-label={skill.displayName ?? skill.name}
        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[76px] h-[76px] rounded-full bg-bg-card border-[5px] ${visual.ring} shadow-card flex items-center justify-center active:scale-95 hover:scale-105 transition-transform`}
        style={{ left: `${lanePct}%` }}
      >
        {visual.loud && (
          <span aria-hidden="true" className={`path-pulse absolute inset-[-5px] rounded-full border-[3px] ${visual.ring}`} />
        )}
        <span className="flex items-center justify-center leading-none" aria-hidden="true">
          <SkillIcon skillId={skill.id} fallback={skill.icon} size={46} />
        </span>
      </button>

      {visual.loud && (
        <div
          data-tinku="stop"
          className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none ${tinku === 'land' ? 'animate-tinku-land' : ''}`}
          style={{ ...(isLeft ? { left: '-2px' } : { right: '-2px' }), opacity: tinku === 'hidden' ? 0 : 1 }}
        >
          <Mascot emotion="waving" size={STOP_TINKU} />
        </div>
      )}

      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col min-w-0" style={labelSide}>
        <span className="font-display text-primary-ink font-extrabold text-base leading-tight truncate">
          {skill.displayName ?? skill.name}
        </span>
        {skill.subtitle && <span className="text-muted text-xs font-medium truncate">{skill.subtitle}</span>}

        <SkillStateCue cue={visual.cue} className={`mt-0.5 ${isLeft ? '' : 'self-end'}`} />

        <PathPips level={level} isLeft={isLeft} />
      </div>
    </>
  );
}

/** Mastery pips — amber dots (NOT stars). */
function PathPips({ level, isLeft }) {
  return (
    <span
      className={`flex gap-1 items-center mt-1 ${isLeft ? '' : 'justify-end'}`}
      aria-label={`Level ${level} of ${MASTERY.MAX_LEVEL}`}
    >
      {Array.from({ length: MASTERY.MAX_LEVEL }).map((_, i) => {
        const filled = i < level;
        const colour = filled
          ? level >= MASTERY.MASTERED_LEVEL
            ? 'bg-accent'
            : level >= MASTERY.UNLOCK_LEVEL
            ? 'bg-primary'
            : 'bg-learn'
          : 'bg-primary-soft';
        return <span key={i} className={`w-2 h-2 rounded-full ${colour}`} />;
      })}
    </span>
  );
}
