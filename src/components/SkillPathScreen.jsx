import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { SKILLS } from '../recipes/skillMap';
import { readySkills } from '../engine/sessionLite';
import { loadAllSkillStates } from '../services/progressStore';
import { isDueForReview } from '../engine/mastery';
import { MASTERY } from '../config/masteryConfig';
import { recommendNext } from '../engine/composer';
import { getSkillVisual } from './skillStateVisual';
import { SkillStateCue } from './SkillStateCue';
import Mascot from './Mascot';
import PrivacyNotice from './PrivacyNotice';
import SkillIcon from './SkillIcon';

/**
 * SkillPathScreen — the Home / Journey Path screen, displaying every `status:'ready'` skill
 * from the skill map (for the active grade) as a vertical winding path of medallions.
 *
 * Reads loadAllSkillStates + recommendNext + isDueForReview on mount (thin delegation to the pure
 * engine). Tokens only; the LOCKED colour rules hold: review-due = `review` (teal), mastered =
 * `accent` (amber, reward-only).
 * (Archived `?home=cards` variant `SkillSelectScreen` / `SkillCard` lives in `archive/legacy-code/`.)
 */

// Layout constants — the path geometry. Nodes sit on two lanes (% of width) at fixed row heights;
// the SVG spine weaves between the same lanes, so HTML nodes and the drawn thread always align.
const LANE_LEFT = 30; // %
const LANE_RIGHT = 70; // %
const ROW_H = 128; // px per skill row

// ROADMAP F6 "Tinku walks to the stop" (prototype for owner review): the big header Tinku waves for
// WALK_HOLD_MS, then glides onto the stop while the page scrolls under it. Longer trips take longer, within
// bounds. Any tap, scroll or key (SKIP_EVENTS) jumps straight to the end.
const HEADER_TINKU = 104; // px — the header Tinku (all-caught-up header, and where the walk starts)
const WALK_HOLD_MS = 350;
// Hero intro (F6, owner request 2026-11-27): on the first Home of an app open Tinku starts big in the middle on
// the splash colour, holds, shrinks into the header slot, then walks. Drawn at hero size and only ever scaled
// down, so the big Tinku stays sharp.
const HERO_HOLD_MS = 700;
const HERO_SHRINK_MS = 400;
// The waving art (Tinku_Bye.webp, measured): the elephant fills 68% x 81% of the image, centred at (54%, 53%).
// The hero is sized so the elephant spans ~80% of the app's width, but at most ~55% of its height (short screens);
// the image's transparent margin may run past the screen edges (the scroll area clips it).
const WAVE_ART = { w: 0.68, h: 0.81, cx: 0.54, cy: 0.53 };
const heroSize = () => {
  const appWidth = Math.min(window.innerWidth, 448); // the app is max-w-md on tablets and desktop
  return Math.round(Math.min((appWidth * 0.8) / WAVE_ART.w, (window.innerHeight * 0.55) / WAVE_ART.h));
};
const walkMs = (dy) => Math.min(1500, Math.max(700, 500 + Math.abs(dy) * 0.5));
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const SKIP_EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown'];

/** Nearest scrolling ancestor (Layout's content area): the walk drives its scrollTop frame by frame. */
function scrollParentOf(el) {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === 'auto' || overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

/** Build the winding spine path (SVG user units: x in 0–100, y in px). Smooth S-curves between
 *  alternating lane centres. Stroke stays even via vector-effect (see the <path> below). */
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

export default function SkillPathScreen({ grade = 1, onSelectSkill, intro = false, onHeroChange }) {
  // IDENTICAL to SkillSelectScreen (copied, not refactored — see file header). Thin delegation to
  // the pure engine; no new calls or logic in this experiment.
  const [{ allStates, recommendation }] = useState(() => {
    const states = loadAllSkillStates();
    const nowDate = new Date().toISOString().slice(0, 10);
    return { allStates: states, recommendation: recommendNext(states, SKILLS, nowDate, undefined, { grade }) };
  });
  const today = new Date().toISOString().slice(0, 10);

  // Grade filter via the shared readySkills() — parent test-panel grade (TRACKER #10), with its
  // built-in fallback to all ready skills so a grade with none yet (Grade 3 today) is never empty.
  const skills = readySkills(grade).sort((a, b) => a.order - b.order);
  // Index of the stop Tinku stands on, or -1 when no stop holds Tinku (all caught up → header Tinku).
  const suggestedIdx =
    recommendation.reason !== 'all_caught_up' ? skills.findIndex((s) => s.id === recommendation.skillId) : -1;
  const hasPathMascot = suggestedIdx >= 0;

  const spine = buildSpine(skills.length);
  const pathHeight = skills.length * ROW_H;

  // TD-15: Home must open with Tinku's stop on screen. Layout remounts the scroll area at the top and the
  // header Tinku is hidden while the path has one, so a suggestion past the first few stops used to leave
  // no Tinku on screen at all. With motion allowed, Tinku walks there (F6); otherwise an instant jump.
  const suggestedRef = useRef(null);
  const backAnchorRef = useRef(null);
  const walkerRef = useRef(null);
  const rootRef = useRef(null);
  const landingRef = useRef(null); // { top, scroller }: the stop's screen position the moment Tinku lands
  const [tinkuAway, setTinkuAway] = useState(null); // null (in view / not yet known) | 'up' | 'down'
  // Decided once per visit (Home remounts on every visit, so the walk plays every time — owner's call).
  const [walks] = useState(
    () =>
      hasPathMascot &&
      typeof requestAnimationFrame === 'function' &&
      typeof window.matchMedia === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [walk, setWalk] = useState(walks ? 'walking' : 'off'); // 'walking' → 'landed'; 'off' = no walk
  // Hero intro: AppRouter passes `intro` for the first Home of an app open; it needs the walk (motion allowed).
  const [hero] = useState(() => walks && intro);
  const [travelSize] = useState(() => (hero ? heroSize() : HEADER_TINKU)); // the walking Tinku's drawn size
  const backdropRef = useRef(null);
  const heroRef = useRef(null); // { x, y }: offset from the header slot that centres the big Tinku on the app

  // Hero, before the first paint: hide the bottom bar (full-screen Tinku, owner review 2026-11-27), put the
  // elephant itself in the middle of the app, and cover the whole app with the splash colour, so the first frame
  // is the hero (no flash of Home). The cover has slack for the view-enter rise.
  useLayoutEffect(() => {
    if (!hero) return;
    onHeroChange?.(true);
    const walker = walkerRef.current;
    const slot = walker.parentElement.getBoundingClientRect();
    const app = walker.closest('.app-frame')?.getBoundingClientRect()
      ?? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    heroRef.current = {
      x: app.left + app.width / 2 - travelSize * WAVE_ART.cx - slot.left,
      y: app.top + app.height / 2 - travelSize * WAVE_ART.cy - slot.top,
    };
    walker.style.transform = `translate(${heroRef.current.x}px, ${heroRef.current.y}px)`;
    const root = rootRef.current.getBoundingClientRect();
    Object.assign(backdropRef.current.style, {
      top: `${app.top - root.top - 40}px`,
      left: `${app.left - root.left}px`,
      width: `${app.width}px`,
      height: `${app.height + 80}px`,
    });
  }, [hero, travelSize, onHeroChange]);

  useEffect(() => {
    const row = suggestedRef.current;
    if (!row) return undefined;
    if (!walks) {
      row.scrollIntoView?.({ block: 'center' });
      return undefined;
    }
    // F6: frame by frame, move the walker from the header slot onto the stop's (hidden) Tinku and scroll the
    // page by the same eased amount. Both sit in the same scrolling content, so their offset is measured once.
    const walker = walkerRef.current;
    const slot = walker.parentElement; // the header slot: never transformed, so it is the walk's fixed start
    const backdrop = backdropRef.current;
    const base = HEADER_TINKU / travelSize; // the scale that fits the walking Tinku in the header slot
    const place = (x, y, scale) => { walker.style.transform = `translate(${x}px, ${y}px) scale(${scale})`; };
    let barBack = !hero;
    const bringBarBack = () => { if (!barBack) { barBack = true; onHeroChange?.(false); } };
    const marker = row.querySelector('[data-tinku="stop"]');
    const scroller = scrollParentOf(row);
    let frame = 0;
    let start = null;
    let geo = null;
    let finished = false;
    const measure = () => {
      const a = slot.getBoundingClientRect();
      const b = marker.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      let scrollTo = 0;
      if (scroller) {
        const s = scroller.getBoundingClientRect();
        const centred = scroller.scrollTop + r.top - s.top + r.height / 2 - scroller.clientHeight / 2;
        scrollTo = Math.min(scroller.scrollHeight - scroller.clientHeight, Math.max(0, centred));
      }
      const dy = b.top - a.top;
      return {
        dx: b.left - a.left,
        dy,
        scale: b.width / travelSize,
        scrollFrom: scroller ? scroller.scrollTop : 0,
        scrollTo,
        ms: walkMs(dy),
      };
    };
    const land = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, land));
      bringBarBack();
      if (scroller) scroller.scrollTop = (geo || measure()).scrollTo;
      else row.scrollIntoView?.({ block: 'center' });
      landingRef.current = { top: row.getBoundingClientRect().top, scroller };
      setWalk('landed');
    };
    const step = (now) => {
      if (start === null) start = now;
      const elapsed = now - start;
      if (hero && elapsed < HERO_HOLD_MS + HERO_SHRINK_MS) {
        // Hero: hold big in the middle, then shrink into the header slot while the backdrop fades away.
        const k = easeInOut(Math.max(0, (elapsed - HERO_HOLD_MS) / HERO_SHRINK_MS));
        if (elapsed >= HERO_HOLD_MS) bringBarBack(); // the bar rises back in with Home
        place(heroRef.current.x * (1 - k), heroRef.current.y * (1 - k), 1 + (base - 1) * k);
        backdrop.style.opacity = String(1 - k);
      } else {
        if (hero) backdrop.hidden = true; // out of the way, so a tap on a stop during the walk still opens it
        const t = elapsed - (hero ? HERO_HOLD_MS + HERO_SHRINK_MS : WALK_HOLD_MS);
        if (t >= 0) {
          if (!geo) geo = measure();
          const e = easeInOut(Math.min(1, t / geo.ms));
          place(geo.dx * e, geo.dy * e, base + (geo.scale - base) * e);
          if (scroller) scroller.scrollTop = geo.scrollFrom + (geo.scrollTo - geo.scrollFrom) * e;
          if (t >= geo.ms) return land();
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
  }, [walks, hero, travelSize, onHeroChange]);

  // Once Tinku has landed the emptied header spot is removed, or scrolling back up showed a blank band at the
  // top (owner review 2026-11-25). Before paint, keep the stop where it was on screen by scrolling up as far
  // as it moved; whatever the scroll can't absorb (header still on screen, stop near the top) slides up
  // instead of jumping (transform-only).
  useLayoutEffect(() => {
    const before = landingRef.current;
    const row = suggestedRef.current;
    if (walk !== 'landed' || !before || !row) return;
    landingRef.current = null;
    if (before.scroller) before.scroller.scrollTop += row.getBoundingClientRect().top - before.top;
    const stillMoved = before.top - row.getBoundingClientRect().top;
    if (stillMoved > 0.5) {
      rootRef.current?.animate?.(
        [{ transform: `translateY(${stillMoved}px)` }, { transform: 'translateY(0)' }],
        { duration: 300, easing: 'ease-out' }
      );
    }
  }, [walk]);

  // While the child scrolls Tinku's stop mostly out of view, offer "Back to Tinku", pointing toward the stop.
  // Direction compares the stop with the button's own anchor, which sits at the bottom of the visible area.
  // Skipped where IntersectionObserver is missing (jsdom, very old WebViews): the button just never shows.
  useEffect(() => {
    const row = suggestedRef.current;
    if (!row || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) return setTinkuAway(null);
        const anchorTop = backAnchorRef.current?.getBoundingClientRect().top ?? 0;
        return setTinkuAway(entry.boundingClientRect.top < anchorTop ? 'up' : 'down');
      },
      { threshold: [0, 0.5] }
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const backToTinku = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    suggestedRef.current?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div ref={rootRef} className="relative flex flex-col items-center min-h-full bg-bg px-4 py-6 text-center">
      {!hasPathMascot && <Mascot emotion="waving" size={HEADER_TINKU} />}
      {/* Hero intro: the splash-colour cover under the big Tinku (Wonder's primary-soft is the Android splash colour). */}
      {walk === 'walking' && hero && (
        <div ref={backdropRef} data-tinku="hero-backdrop" aria-hidden="true" className="absolute z-30 bg-primary-soft" />
      )}
      {/* F6: the walk's launch pad, removed once Tinku lands (see the layout effect above). */}
      {walk === 'walking' && (
        <div data-tinku="slot" className="relative z-40" style={{ width: HEADER_TINKU, height: HEADER_TINKU }}>
          <div ref={walkerRef} data-tinku="travel" className="pointer-events-none will-change-transform" style={{ transformOrigin: '0 0', width: travelSize, height: travelSize }}>
            <Mascot emotion="waving" size={travelSize} />
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
          {/* non-scaling-stroke keeps the thread an even width despite the non-uniform viewBox. */}
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
            const isReviewSuggested = isSuggested && recommendation.reason === 'review';
            const isLeft = i % 2 === 0;

            return (
              <li
                key={skill.id}
                ref={isSuggested ? suggestedRef : undefined}
                className="relative animate-opt-in"
                // Stagger starts where the screen starts: at the top while Tinku walks down (F6), else rippling
                // out from Tinku's stop, so the stops on screen after the instant jump don't sit blank for ~1 s.
                style={{ height: ROW_H, animationDelay: `${Math.abs(i - (walks ? 0 : Math.max(suggestedIdx, 0))) * 55}ms` }}
              >
                <PathNode
                  skill={skill}
                  level={level}
                  isDue={isDue}
                  isSuggested={isSuggested}
                  isReviewSuggested={isReviewSuggested}
                  isLeft={isLeft}
                  tinku={walk === 'walking' ? 'hidden' : walk === 'landed' ? 'land' : 'still'}
                  onClick={() => onSelectSkill(skill.id)}
                />
              </li>
            );
          })}
        </ol>
      </div>

      {/* "Back to Tinku" — a zero-height sticky anchor pinned near the bottom of the visible area, so the
          button floats over the path without taking layout space. Shown only while Tinku's stop is out of
          view, so it never competes with the one loud node. */}
      {hasPathMascot && (
        <div ref={backAnchorRef} className="sticky bottom-4 z-30 h-0 w-full max-w-sm">
          {tinkuAway && walk !== 'walking' && (
            <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none">
              <button
                type="button"
                onClick={backToTinku}
                aria-label="Back to Tinku"
                className="pointer-events-auto animate-opt-in min-h-[48px] flex items-center gap-2 pl-2 pr-4 rounded-full bg-bg-card border-2 border-primary-soft shadow-card font-display font-extrabold text-primary-ink active:scale-95 transition-transform"
              >
                <Mascot emotion="waving" size={36} />
                Back to Tinku
                <span data-direction={tinkuAway} aria-hidden="true">
                  {tinkuAway === 'up' ? <ArrowUp size={20} strokeWidth={2.5} /> : <ArrowDown size={20} strokeWidth={2.5} />}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Same privacy reassurance as production, kept subtle. */}
      <PrivacyNotice variant="footer" />
    </div>
  );
}

// ── One stop on the path: medallion + label + (when suggested) the Tinku "go here" marker ──

// `tinku` (suggested node only): 'hidden' while the header Tinku walks here (F6) — still laid out, so the walk
// can measure where to land — 'land' once arrived (small hop), 'still' when there was no walk.
function PathNode({ skill, level, isDue, isSuggested, isReviewSuggested, isLeft, tinku = 'still', onClick }) {
  // SHARED state→visual grammar (skillStateVisual.js) — identical mapping to SkillCard, so the two
  // Home views can't drift. due-but-not-suggested is NEUTRAL (never amber while due); mastered-not-
  // due is amber; the single loud element is the suggested node. (DECISIONS 2026-07-15.)
  const visual = getSkillVisual({ level, isDue, isSuggested, isReviewSuggested });

  const lanePct = isLeft ? LANE_LEFT : LANE_RIGHT;
  // Label fills the opposite (inner) side of the row so it never overlaps the node.
  const labelSide = isLeft
    ? { left: `calc(${LANE_LEFT}% + 46px)`, right: '8px', textAlign: 'left' }
    : { right: `calc(${100 - LANE_RIGHT}% + 46px)`, left: '8px', textAlign: 'right' };

  return (
    <>
      {/* Medallion — circular node, white fill, 5px state-ring (token border colour). */}
      <button
        onClick={onClick}
        aria-label={skill.displayName ?? skill.name}
        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[76px] h-[76px] rounded-full bg-bg-card border-[5px] ${visual.ring} shadow-card flex items-center justify-center active:scale-95 hover:scale-105 transition-transform`}
        style={{ left: `${lanePct}%` }}
      >
        {/* Gentle repeating sonar pulse on the single loud node; matches its ring colour. */}
        {visual.loud && (
          <span aria-hidden="true" className={`path-pulse absolute inset-[-5px] rounded-full border-[3px] ${visual.ring}`} />
        )}
        <span className="flex items-center justify-center leading-none" aria-hidden="true">
          <SkillIcon skillId={skill.id} fallback={skill.icon} size={46} />
        </span>
      </button>

      {/* Tinku "you are here / go here" marker beside the suggested node (outer side). */}
      {visual.loud && (
        <div
          data-tinku="stop"
          className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none ${tinku === 'land' ? 'animate-tinku-land' : ''}`}
          style={{ ...(isLeft ? { left: '-2px' } : { right: '-2px' }), opacity: tinku === 'hidden' ? 0 : undefined }}
        >
          <Mascot emotion="waving" size={58} />
        </div>
      )}

      {/* Label block on the inner side. Cue uses the SHARED grammar (skillStateVisual). */}
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

/** Mastery pips — amber dots (NOT stars). Duplicated from SkillCard on purpose (see file header). */
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
