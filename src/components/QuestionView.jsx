/**
 * QuestionView — renders the prompt for the three formats the ready recipes emit.
 * Presentational only; the option buttons + answer state live in SessionPlayer.
 *   - mcq           : big equation text (addition / subtraction)
 *   - count-objects : the question + a grid of `render.count` glyphs to count
 *   - compare       : the two numbers with a box for the missing sign
 */
export default function QuestionView({ question }) {
  if (question.format === 'count-objects') {
    const { glyph, count } = question.render;
    return (
      <div className="text-center">
        <p className="text-base font-bold text-ink mb-2">{question.questionText}</p>
        {/* Ten-frame tray: rows of 5. auto columns (not 1fr) so objects cluster to their
            natural size; justify-content:center centres the group. w-fit shrinks the tray
            box to the objects so it never looks empty. 16-20 not served — see counting.js. */}
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-3 shadow-card">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${Math.min(count, 5)}, auto)`, justifyContent: 'center' }}
            aria-label={`${count} objects to count`}
          >
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className="count-glyph flex items-center justify-center leading-none select-none"
                style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.5rem)', minWidth: '1.75rem', minHeight: '1.75rem' }}
              >
                {glyph}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (question.format === 'compare') {
    const { left, right } = question.render;
    return (
      <div className="text-center">
        <p className="text-base font-semibold text-muted mb-2">Which sign goes in the box?</p>
        {/* Numbers use clamp() so they shrink on short screens without losing readability. */}
        <div className="flex items-center justify-center gap-4">
          <span className="kid-num-3d font-display font-extrabold text-primary-ink" style={{ fontSize: 'clamp(2rem, 8vh, 3.75rem)' }}>{left}</span>
          <span className="w-12 h-12 rounded-button border-4 border-dashed border-primary-soft bg-bg-card flex items-center justify-center text-2xl text-primary">?</span>
          <span className="kid-num-3d font-display font-extrabold text-primary-ink" style={{ fontSize: 'clamp(2rem, 8vh, 3.75rem)' }}>{right}</span>
        </div>
      </div>
    );
  }

  // mcq — fluid size (text-question token) so the equation scales up on tall phones and down
  // on short ones.
  return (
    <p className="kid-num-3d font-display text-question font-extrabold text-primary-ink text-center tracking-wide">
      {question.questionText}
    </p>
  );
}
