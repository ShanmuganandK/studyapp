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
        {/* Countable tray: compact sizing keeps the tray visible on short phones without scroll. */}
        <div className="mx-auto max-w-sm rounded-2xl border-2 border-indigo-100 bg-white p-2 shadow-inner">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-3" aria-label={`${count} objects to count`}>
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className="text-4xl leading-none select-none">{glyph}</span>
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
