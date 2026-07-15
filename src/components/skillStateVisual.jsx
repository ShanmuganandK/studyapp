import { MASTERY } from '../config/masteryConfig';

/**
 * Skill-state visual grammar — the SINGLE source of truth both Home views share (SkillCard cards
 * and SkillPathScreen medallions) so their ring/label encoding can't drift again.
 *
 * Presentation only: it does NOT compute state — `isDue`/`isSuggested`/`isReviewSuggested` come from
 * the engine (composer/mastery) and are passed in. It only maps that state → tokens.
 *
 * LOCKED colour rule (DECISIONS 2026-07-05 / 2026-07-15): amber (`accent`) = reward/achievement ONLY;
 * review-due = teal (`review`), NEVER amber; suggest = sky (`learn`). Exactly ONE loud element per
 * screen — the suggested node (the call-to-action). Precedence, highest first:
 *
 *   1. suggested-review   → teal ring   + "↻ Review time!" (loud)  + Tinku/emphasis
 *   2. suggested-frontier → sky ring    + "Tinku suggests!"        + Tinku/emphasis
 *   3. due-not-suggested  → NEUTRAL ring + "↻ Review time!" (muted teal cue)  ← never amber while due
 *   4. mastered-not-due   → amber ring  + amber pips, no label
 *   5. started / idle     → neutral ring, no label
 *
 * The ↻ lives in the LABEL (cue) in both views — pips never carry it (dedupe).
 */

/**
 * @param {{ level:number, isDue:boolean, isSuggested:boolean, isReviewSuggested:boolean }} s
 * @returns {{ state:string, ring:string, cue:({kind:'review'|'suggest', tone:'loud'|'muted'}|null), loud:boolean }}
 */
export function getSkillVisual({ level, isDue, isSuggested, isReviewSuggested }) {
  const isMastered = level >= MASTERY.MASTERED_LEVEL;

  if (isSuggested && isReviewSuggested) {
    return { state: 'suggested-review', ring: 'border-review', cue: { kind: 'review', tone: 'loud' }, loud: true };
  }
  if (isSuggested) {
    return { state: 'suggested-frontier', ring: 'border-learn', cue: { kind: 'suggest', tone: 'loud' }, loud: true };
  }
  if (isDue) {
    // Review-due but not the recommendation: quiet teal cue on a NEUTRAL ring — never amber.
    return { state: 'due', ring: 'border-primary-soft', cue: { kind: 'review', tone: 'muted' }, loud: false };
  }
  if (isMastered) {
    return { state: 'mastered', ring: 'border-accent', cue: null, loud: false };
  }
  return { state: 'idle', ring: 'border-primary-soft', cue: null, loud: false };
}

/**
 * Shared label markup for a state cue, so the ↻ glyph, wording, and tone live in one place and read
 * identically on cards and the path. `className` carries each view's layout (spacing/alignment).
 */
export function SkillStateCue({ cue, className = '' }) {
  if (!cue) return null;
  if (cue.kind === 'review') {
    // ↻ always teal (review token); the text tone signals loud (ink) vs a muted secondary cue.
    const toneClass = cue.tone === 'muted' ? 'text-muted' : 'text-ink';
    return (
      <span className={`text-xs font-bold ${toneClass} ${className}`}>
        <span className="text-review">↻</span> Review time!
      </span>
    );
  }
  return (
    <span className={`text-xs font-bold text-learn-ink ${className}`}>Tinku suggests!</span>
  );
}
