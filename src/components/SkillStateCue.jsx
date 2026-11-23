/**
 * Shared label markup for a skill state cue (`getSkillVisual().cue`), so the ↻ glyph, wording,
 * and tone live in one place (`SkillPathScreen`). `className` carries layout (spacing/alignment).
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
