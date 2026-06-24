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
        <p className="text-2xl font-bold text-slate-800 mb-4">{question.questionText}</p>
        {/* Countable tray: visually bounded + clearly separate from the question and Tinku.
            Generous spacing and large objects so kids can point-and-count without miscounts. */}
        <div className="mx-auto max-w-sm rounded-3xl border-4 border-indigo-100 bg-white p-5 shadow-inner">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-5" aria-label={`${count} objects to count`}>
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className="text-5xl leading-none select-none">{glyph}</span>
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
        <p className="text-xl font-semibold text-slate-600 mb-4">Which sign goes in the box?</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-6xl font-extrabold text-indigo-700">{left}</span>
          <span className="w-14 h-14 rounded-xl border-4 border-dashed border-indigo-300 flex items-center justify-center text-3xl text-indigo-300">?</span>
          <span className="text-6xl font-extrabold text-indigo-700">{right}</span>
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
