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
        <p className="text-base font-bold text-slate-800 mb-2">{question.questionText}</p>
        {/* Ten-frame tray: 5-column grid (rows of 5) matches how counting in groups is taught.
            Glyph size scales with screen width so the tray never clips at 320-360px.
            NOTE: counts 16-20 are not served (ceiling capped at 15 in counting.js) — if the
            skill range is ever extended, a numeral/grouped presentation will be needed here. */}
        <div className="mx-auto rounded-2xl border-2 border-indigo-100 bg-white p-2 shadow-inner">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
            aria-label={`${count} objects to count`}
          >
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className="flex items-center justify-center leading-none select-none"
                style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.5rem)' }}
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
        <p className="text-base font-semibold text-slate-600 mb-2">Which sign goes in the box?</p>
        {/* Numbers use clamp() so they shrink on short screens without losing readability. */}
        <div className="flex items-center justify-center gap-4">
          <span className="font-extrabold text-indigo-700" style={{ fontSize: 'clamp(2rem, 8vh, 3.75rem)' }}>{left}</span>
          <span className="w-12 h-12 rounded-xl border-4 border-dashed border-indigo-300 flex items-center justify-center text-2xl text-indigo-300">?</span>
          <span className="font-extrabold text-indigo-700" style={{ fontSize: 'clamp(2rem, 8vh, 3.75rem)' }}>{right}</span>
        </div>
      </div>
    );
  }

  // mcq
  return (
    <p className="text-5xl font-extrabold text-indigo-700 text-center tracking-wide">
      {question.questionText}
    </p>
  );
}
