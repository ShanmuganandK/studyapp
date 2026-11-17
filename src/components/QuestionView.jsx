/**
 * QuestionView — renders the prompt for the three formats the ready recipes emit.
 * Presentational only; the option buttons + answer state live in SessionPlayer.
 *   - mcq           : big equation text (addition / subtraction)
 *   - count-objects : the question + a grid of `render.count` glyphs to count
 *   - compare       : the two numbers with a box for the missing sign
 *
 * `blankFill` (presentation-only, view-state from SessionPlayer's phase) drives the
 * "answer feedback fills the blank" rule (DECISIONS.md 2026-07-04) for formats with a BLANK
 * (compare now; text-input later). It lands the committed CORRECT value in the blank so the
 * child sees the full statement complete before the question transitions out:
 *   'correct' → correct answer (green success beat)
 *   'reveal'  → wrong-#2 reveal ("here's how") — same correct value, sky/learn teaching tone
 *   null      → dashed placeholder (resting/wrong/hint; never slot a wrong value in)
 * Formats without a blank (mcq, count-objects) ignore it.
 */
// The compare sign box: sized by the stage's budget (3rem = the old fixed w-12 h-12 when there is none).
const SIGN_BOX = 'var(--q-sign-box, 3rem)';

export default function QuestionView({ question, blankFill = null }) {
  if (question.format === 'count-objects') {
    const { glyph, count } = question.render;
    // Rows of 5, up to 3 rows (11-15 objects). The tray is sized by the room the question area really has
    // (it is a size container, `qreg`): what is left after the prompt (reserved at 2 lines of 1.5 line-height)
    // and the fixed spacing (prompt margin, tray padding and gaps, wrapper padding: ~4rem) is shared between the rows. So 3 rows shrink, 1 row stays big, and nothing is clipped.
    const rows = Math.ceil(count / 5);
    const fit = `((100cqh - 3.1 * var(--text-prompt) - 4.25rem) / ${rows} / 1.05)`;
    const size = `min(var(--q-glyph, clamp(1.5rem, 6.5vw, 2.5rem)), max(1rem, ${fit}))`;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-3">{question.questionText}</p>
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
                style={{
                  fontSize: size,
                  minWidth: `calc(${size} * 1.1)`,
                }}
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
        <p className="text-prompt font-bold text-ink mb-3">Which sign goes in the box?</p>
        {/* Numbers use clamp() so they shrink on short screens without losing readability. */}
        <div className="flex items-center justify-center gap-4">
          <span className="kid-num-3d font-display font-extrabold text-primary-ink" style={{ fontSize: 'var(--q-num, clamp(2rem, 8vh, 3.75rem))' }}>{left}</span>
          {blankFill ? (
            // The CORRECT operator lands in the slot so the child sees the completed statement
            // (e.g. "5 < 15"). Green on a correct win; sky/learn on the wrong-#2 reveal ("here's
            // how" — a teaching moment, not false praise). Keyed distinct from the placeholder (and
            // per treatment) so it mounts fresh and the pop-in animation plays.
            <span
              key={`fill-${blankFill}`}
              className={`animate-slot-fill font-display font-extrabold rounded-button border-4 flex items-center justify-center ${
                blankFill === 'correct'
                  ? 'border-success bg-success-soft text-success'
                  : 'border-learn bg-learn-soft text-learn-ink'
              }`}
              style={{ width: SIGN_BOX, height: SIGN_BOX, fontSize: 'calc(var(--q-sign-box, 3rem) * 0.55)' }}
            >
              {question.correctAnswer}
            </span>
          ) : (
            // Resting / wrong / hint: dashed placeholder — never slot a wrong sign in (never punish).
            <span key="blank" style={{ width: SIGN_BOX, height: SIGN_BOX, fontSize: 'calc(var(--q-sign-box, 3rem) * 0.5)' }} className="rounded-button border-4 border-dashed border-primary-soft bg-bg-card flex items-center justify-center text-primary">?</span>
          )}
          <span className="kid-num-3d font-display font-extrabold text-primary-ink" style={{ fontSize: 'var(--q-num, clamp(2rem, 8vh, 3.75rem))' }}>{right}</span>
        </div>
      </div>
    );
  }

  if (question.format === 'unit-length') {
    const { objectGlyph, unitGlyph, count } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-2">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-4 py-2 shadow-card">
          <div className="text-2xl mb-1 select-none" aria-label="Object to measure">
            {Array.from({ length: count }).map(() => objectGlyph).join('')}
          </div>
          <div className="flex items-center justify-center gap-1 select-none" aria-label={`${count} unit blocks`}>
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className="text-xl leading-none">{unitGlyph}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (question.format === 'shape-mcq') {
    const { shape, rotated } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-2">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-3 shadow-card">
          <svg
            viewBox="0 0 100 100"
            className="w-20 h-20 text-primary mx-auto"
            style={{ transform: rotated ? 'rotate(45deg)' : undefined }}
            role="img"
            aria-label={shape}
          >
            {shape === 'circle' && (
              <circle cx="50" cy="50" r="36" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" />
            )}
            {shape === 'square' && (
              <rect x="18" y="18" width="64" height="64" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" />
            )}
            {shape === 'rectangle' && (
              <rect x="10" y="26" width="80" height="48" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" />
            )}
            {shape === 'triangle' && (
              <polygon points="50,14 86,82 14,82" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" />
            )}
          </svg>
        </div>
      </div>
    );
  }

  if (question.format === 'spatial-mcq') {
    const { relation, itemGlyph, anchorGlyph } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-2">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-5 py-2 shadow-card flex items-center justify-center gap-3 text-2xl select-none">
          {relation === 'inside' && (
            <span className="rounded-button border-2 border-primary px-3 py-1">{anchorGlyph} {itemGlyph}</span>
          )}
          {relation === 'outside' && (
            <>
              <span className="rounded-button border-2 border-primary px-3 py-1">{anchorGlyph}</span>
              <span>{itemGlyph}</span>
            </>
          )}
          {relation === 'top' && (
            <div className="flex flex-col items-center leading-tight">
              <span>{itemGlyph}</span>
              <span>{anchorGlyph}</span>
            </div>
          )}
          {relation === 'bottom' && (
            <div className="flex flex-col items-center leading-tight">
              <span>{anchorGlyph}</span>
              <span>{itemGlyph}</span>
            </div>
          )}
          {relation === 'near' && (
            <div className="flex items-center gap-1">
              <span>{anchorGlyph}</span>
              <span>{itemGlyph}</span>
            </div>
          )}
          {relation === 'far' && (
            <div className="flex items-center gap-8">
              <span>{anchorGlyph}</span>
              <span>{itemGlyph}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (question.format === 'balance-mcq') {
    const { leftItem, rightItem, heavier } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-2">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-5 py-2 shadow-card flex items-center justify-center gap-4 text-xl select-none">
          <span className={heavier === 'left' ? 'translate-y-1 font-bold text-primary-ink' : '-translate-y-1 text-muted'}>
            [{leftItem}]
          </span>
          <span className="text-primary font-bold">⚖️</span>
          <span className={heavier === 'right' ? 'translate-y-1 font-bold text-primary-ink' : '-translate-y-1 text-muted'}>
            [{rightItem}]
          </span>
        </div>
      </div>
    );
  }

  if (question.format === 'coins-mcq') {
    const { coins } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-2">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-4 py-2 shadow-card flex items-center justify-center gap-2 select-none">
          {coins.map((c, i) => (
            <span
              key={i}
              className="w-11 h-11 rounded-full border-2 border-primary bg-primary-soft text-primary-ink font-display font-extrabold flex items-center justify-center text-base"
            >
              ₹{c}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (question.format === 'clock') {
    const { hours, minutes } = question.render;
    const minAngle = (minutes / 60) * 360;
    const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-2">What time does the clock show?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-2 shadow-card">
          <svg viewBox="0 0 100 100" className="w-20 h-20 text-primary-ink mx-auto" role="img" aria-label={`${hours}:${String(minutes).padStart(2, '0')}`}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="4" />
            <text x="50" y="18" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">12</text>
            <text x="84" y="53" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">3</text>
            <text x="50" y="90" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">6</text>
            <text x="16" y="53" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">9</text>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="28"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              transform={`rotate(${hourAngle} 50 50)`}
            />
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="18"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${minAngle} 50 50)`}
            />
            <circle cx="50" cy="50" r="3" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  }

  if (question.format === 'pictograph') {
    const { rows, scale } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-1">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3 py-1.5 shadow-card text-left text-xs">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2 py-0.5">
              <span className="font-bold text-ink w-16">{r.label}</span>
              <span className="tracking-widest select-none">{Array.from({ length: r.count }).map(() => r.glyph).join('')}</span>
            </div>
          ))}
          {scale > 1 && (
            <div className="text-muted font-semibold mt-0.5 border-t border-primary-soft pt-0.5">
              Key: 1 picture = {scale}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (question.format === 'fraction-mcq') {
    const { totalParts, shadedParts } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-extrabold text-ink mb-2">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-3 shadow-card">
          <div
            className="grid gap-1 w-24 h-12 mx-auto"
            style={{ gridTemplateColumns: `repeat(${totalParts}, 1fr)` }}
            role="img"
            aria-label={`${shadedParts} of ${totalParts} parts shaded`}
          >
            {Array.from({ length: totalParts }).map((_, i) => (
              <div
                key={i}
                className={`border-2 border-primary rounded-xs ${
                  i < shadedParts ? 'bg-primary' : 'bg-bg-card'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // mcq — fluid size. Compact equations ("27 + 1 = ?") use the large `text-question` token so
  // they scale up on tall phones and down on short ones. Longer sentence-style prompts (e.g.
  // counting3digit.js's place-value decomposition, "1 hundred, 3 tens and 0 ones make ?") would
  // overflow the fit-one-viewport layout at that size — cutting off the tail of the question,
  // the exact bug this length check exists to prevent — so they fall back to `text-prompt`,
  // the same fluid token already used for the compare/count-objects sentence prompts above.
  const MAX_COMPACT_LENGTH = 20; // every equation-style mcq recipe stays well under this; every
  // sentence-style one (currently only counting3digit.js) is comfortably over it.
  const isLongPrompt = question.questionText.length > MAX_COMPACT_LENGTH;
  return (
    <p
      className={`kid-num-3d font-display font-extrabold text-primary-ink text-center tracking-wide ${
        isLongPrompt ? 'text-prompt' : 'text-question'
      }`}
    >
      {question.questionText}
    </p>
  );
}
