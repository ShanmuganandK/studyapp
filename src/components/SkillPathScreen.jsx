import { useState } from 'react';
import { SKILLS } from '../recipes/skillMap';
import { loadAllSkillStates } from '../services/progressStore';
import { isDueForReview } from '../engine/mastery';
import { MASTERY } from '../config/masteryConfig';
import { recommendNext } from '../engine/composer';
import Mascot from './Mascot';
import PrivacyNotice from './PrivacyNotice';

/**
 * SkillPathScreen — EXPERIMENT (Screen 3-B): a "Journey Path" Home variant, parallel to the
 * production SkillSelectScreen. Decision-pending — we kid-test both, then keep one. Reached only
 * via the `?home=path` flag (ThemeManager); the production Home is the untouched default.
 *
 * Same skill set + ORDER as production (status:'ready', by `order`), laid out as a vertical winding
 * path of medallions alternating left/right, connected by a soft SVG spine.
 *
 * DATA FLOW IS IDENTICAL to SkillSelectScreen — the same loadAllSkillStates + recommendNext + per-
 * node isDueForReview delegation (thin, pre-existing pattern; copied, not refactored). No new engine
 * calls, no recomputed logic. Pip/label rendering is intentionally DUPLICATED here (not shared with
 * SkillCard) — de-dup only happens after the kid-test decision (STANDARDS §0.2). Tokens only; the
 * LOCKED colour rules hold: review-due = `review` (teal), mastered = `accent` (amber, reward-only).
 */

// Layout constants — the path geometry. Nodes sit on two lanes (% of width) at fixed row heights;
// the SVG spine weaves between the same lanes, so HTML nodes and the drawn thread always align.
const LANE_LEFT = 30; // %
const LANE_RIGHT = 70; // %
const ROW_H = 128; // px per skill row

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

export default function SkillPathScreen({ onSelectSkill }) {
  // IDENTICAL to SkillSelectScreen (copied, not refactored — see file header). Thin delegation to
  // the pure engine; no new calls or logic in this experiment.
  const [{ allStates, recommendation }] = useState(() => {
    const states = loadAllSkillStates();
    const nowDate = new Date().toISOString().slice(0, 10);
    return { allStates: states, recommendation: recommendNext(states, SKILLS, nowDate) };
  });
  const today = new Date().toISOString().slice(0, 10);

  const skills = Object.values(SKILLS)
    .filter((s) => s.status === 'ready')
    .sort((a, b) => a.order - b.order);

  const spine = buildSpine(skills.length);
  const pathHeight = skills.length * ROW_H;

  return (
    <div className="flex flex-col items-center min-h-full bg-bg px-4 py-6 text-center">
      <Mascot emotion="waving" size={104} />
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
            const isSuggested =
              recommendation.skillId === skill.id && recommendation.reason !== 'all_caught_up';
            const isReviewSuggested = isSuggested && recommendation.reason === 'review';
            const isLeft = i % 2 === 0;

            return (
              <li
                key={skill.id}
                className="relative animate-opt-in"
                style={{ height: ROW_H, animationDelay: `${i * 55}ms` }}
              >
                <PathNode
                  skill={skill}
                  level={level}
                  isDue={isDue}
                  isSuggested={isSuggested}
                  isReviewSuggested={isReviewSuggested}
                  isLeft={isLeft}
                  onClick={() => onSelectSkill(skill.id)}
                />
              </li>
            );
          })}
        </ol>
      </div>

      {/* Same privacy reassurance as production, kept subtle. */}
      <PrivacyNotice variant="footer" />
    </div>
  );
}

// ── One stop on the path: medallion + label + (when suggested) the Tinku "go here" marker ──

// Medallion ring by state. `locked` is spec'd + STYLED here but intentionally UNWIRED in this
// experiment: the identical-to-production data flow yields no locked nodes (ready-only, no prereq
// computation) — mirrors the Screen-3 "locked cards deferred" decision. Kept ready for a future
// lock signal. amber(accent)=mastered reward only; review(teal)=review-due; sky(learn)=suggested.
const RING_CLASS = {
  idle: 'border-primary-soft',
  mastered: 'border-accent',
  suggested: 'border-learn',
  review: 'border-review',
  locked: 'border-slate-300',
};

function PathNode({ skill, level, isDue, isSuggested, isReviewSuggested, isLeft, onClick }) {
  const isMastered = level >= MASTERY.MASTERED_LEVEL;
  const ringState = isReviewSuggested
    ? 'review'
    : isSuggested
    ? 'suggested'
    : isMastered
    ? 'mastered'
    : 'idle';

  // The pulse (on the active recommendation) matches its ring colour so "go here" reads at a glance.
  const pulseBorder = isReviewSuggested ? 'border-review' : 'border-learn';

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
        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[76px] h-[76px] rounded-full bg-bg-card border-[5px] ${RING_CLASS[ringState]} shadow-card flex items-center justify-center active:scale-95 hover:scale-105 transition-transform`}
        style={{ left: `${lanePct}%` }}
      >
        {/* Gentle repeating sonar pulse on the active recommendation (transform/opacity only). */}
        {isSuggested && (
          <span aria-hidden="true" className={`path-pulse absolute inset-[-5px] rounded-full border-[3px] ${pulseBorder}`} />
        )}
        <span className="text-3xl leading-none" aria-hidden="true">
          {skill.icon}
        </span>
      </button>

      {/* Tinku "you are here / go here" marker beside the suggested node (outer side). */}
      {isSuggested && (
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={isLeft ? { left: '-2px' } : { right: '-2px' }}
        >
          <Mascot emotion="waving" size={58} />
        </div>
      )}

      {/* Label block on the inner side. */}
      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col min-w-0" style={labelSide}>
        <span className="font-display text-primary-ink font-extrabold text-base leading-tight truncate">
          {skill.displayName ?? skill.name}
        </span>
        {skill.subtitle && <span className="text-muted text-xs font-medium truncate">{skill.subtitle}</span>}

        {/* Review-due (teal, never amber) takes precedence over the suggest label. */}
        {isDue || isReviewSuggested ? (
          <span className={`text-xs font-bold mt-0.5 text-ink ${isLeft ? '' : 'self-end'}`}>
            <span className="text-review">↻</span> Review time!
          </span>
        ) : isSuggested ? (
          <span className={`text-xs font-bold mt-0.5 text-learn-ink ${isLeft ? '' : 'self-end'}`}>Tinku suggests!</span>
        ) : null}

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
