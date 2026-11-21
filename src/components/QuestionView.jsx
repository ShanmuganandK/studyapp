/**
 * QuestionView — renders the prompt across the 4 Elite Visual Archetypes:
 *   - Archetype A (`equation` / `compare`): Hero 3D display equations & operator sign box.
 *   - Archetype B (`strip`): Tactile non-wrapping strips for `ordinal-strip`, `pattern-strip`,
 *     `sorting-tray`, `number-step`, and `time-sequence`.
 *   - Archetype C (`story`): Structured concept cards for `place-houses`, `money-add`,
 *     `money-change`, `ruler-cm`, `length-add`, `capacity-jugs`, and `capacity-tanks`.
 *   - Archetype D (`stage`): Self-sizing `qreg` visual trays & SVGs for `count-objects`,
 *     `unit-length`, `ribbon-compare`, `group-compare`, `shape-mcq`, `spatial-mcq`,
 *     `balance-mcq`, `coins-mcq`, `clock`, `pictograph`, `fraction-mcq`, and `half-collection`.
 *
 * All visual trays size themselves from `.quiz-question` (`container: qreg / size`) via `cqh` and
 * `cqw` so small/cramped phones (360×540 in-browser, 360×640) never scroll while tall phones
 * (390×844, 412×915) get hero-sized visuals.
 */

const SIGN_BOX = 'var(--q-sign-box, 3rem)';
const STAGE_SVG_SIZE = 'clamp(4.25rem, min(58cqh, 42cqw), 9rem)';

function TargetSlot({ blankFill, answer, size = 'clamp(2.25rem, min(22cqh, 13cqw), 3.25rem)' }) {
  if (blankFill) {
    return (
      <span
        key={`fill-${blankFill}`}
        className={`animate-slot-fill font-display font-extrabold rounded-button border-3 flex items-center justify-center px-2 ${
          blankFill === 'correct'
            ? 'border-success bg-success-soft text-success'
            : 'border-learn bg-learn-soft text-learn-ink'
        }`}
        style={{ minWidth: size, height: size }}
      >
        {answer}
      </span>
    );
  }
  return (
    <span
      key="blank"
      className="rounded-button border-3 border-dashed border-primary bg-primary-soft font-display font-extrabold text-primary flex items-center justify-center px-2"
      style={{ minWidth: size, height: size }}
    >
      ?
    </span>
  );
}

export default function QuestionView({ question, blankFill = null }) {
  // ── Archetype D: Ten-frame counting tray (`count-objects`) ──────────────────
  if (question.format === 'count-objects') {
    const { glyph, count } = question.render;
    const rows = Math.ceil(count / 5);
    const fit = `((100cqh - 3.1 * var(--text-prompt) - 4.25rem) / ${rows} / 1.05)`;
    const size = `min(var(--q-glyph, clamp(1.5rem, 6.5vw, 2.5rem)), max(1rem, ${fit}))`;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-2">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-2.5 shadow-card">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${Math.min(count, 5)}, auto)`, justifyContent: 'center' }}
            aria-label={`${count} objects to count`}
          >
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className="count-glyph flex items-center justify-center leading-none select-none"
                style={{ fontSize: size, minWidth: `calc(${size} * 1.1)` }}
              >
                {glyph}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Archetype A: Compare operator box (`compare`) ──────────────────────────
  if (question.format === 'compare') {
    const { left, right } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-bold text-ink mb-2">Which sign goes in the box?</p>
        <div className="flex items-center justify-center gap-4">
          <span className="kid-num-3d font-display font-extrabold text-primary-ink" style={{ fontSize: 'var(--q-num, clamp(2rem, 8vh, 3.75rem))' }}>{left}</span>
          {blankFill ? (
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
            <span key="blank" style={{ width: SIGN_BOX, height: SIGN_BOX, fontSize: 'calc(var(--q-sign-box, 3rem) * 0.5)' }} className="rounded-button border-4 border-dashed border-primary-soft bg-bg-card flex items-center justify-center text-primary">?</span>
          )}
          <span className="kid-num-3d font-display font-extrabold text-primary-ink" style={{ fontSize: 'var(--q-num, clamp(2rem, 8vh, 3.75rem))' }}>{right}</span>
        </div>
      </div>
    );
  }

  // ── Archetype D: Non-standard block length (`unit-length`) ──────────────────
  if (question.format === 'unit-length') {
    const { objectGlyph, unitGlyph, count } = question.render;
    const cellW = `clamp(1.35rem, min(11cqw, 18cqh), 2.35rem)`;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card">
          <div className="flex items-center justify-center gap-1 mb-1 select-none" aria-label="Object to measure">
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className="flex items-center justify-center leading-none" style={{ width: cellW, fontSize: `calc(${cellW} * 0.85)` }}>
                {objectGlyph}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1 select-none border-t border-primary-soft pt-1" aria-label={`${count} unit blocks`}>
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className="flex items-center justify-center leading-none" style={{ width: cellW, fontSize: `calc(${cellW} * 0.85)` }}>
                {unitGlyph}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Archetype D: 2D Shapes SVG stage (`shape-mcq`) ──────────────────────────
  if (question.format === 'shape-mcq') {
    const { shape, rotated } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-2.5 shadow-card">
          <svg
            viewBox="0 0 100 100"
            className="text-primary mx-auto"
            style={{
              width: STAGE_SVG_SIZE,
              height: STAGE_SVG_SIZE,
              transform: rotated ? 'rotate(45deg)' : undefined,
            }}
            role="img"
            aria-label={shape}
          >
            {shape === 'circle' && (
              <circle cx="50" cy="50" r="36" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" />
            )}
            {shape === 'square' && (
              <rect x="18" y="18" width="64" height="64" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" rx="3" />
            )}
            {shape === 'rectangle' && (
              <rect x="10" y="26" width="80" height="48" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" rx="3" />
            )}
            {shape === 'triangle' && (
              <polygon points="50,14 86,82 14,82" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
            )}
            {shape === 'pentagon' && (
              <polygon points="50,12 88,40 73,84 27,84 12,40" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
            )}
          </svg>
        </div>
      </div>
    );
  }

  // ── Archetype D: Spatial Scene (`spatial-mcq`) ─────────────────────────────
  if (question.format === 'spatial-mcq') {
    const { relation, itemGlyph, anchorGlyph, anchorName } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">
          Where is {itemGlyph} relative to the {anchorName || 'object'}?
        </p>
        <div
          className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-5 py-2.5 shadow-card flex items-center justify-center gap-3 select-none"
          style={{ fontSize: 'clamp(1.5rem, min(18cqh, 9cqw), 2.5rem)' }}
        >
          {relation === 'inside' && (
            <span className="rounded-button border-3 border-primary bg-primary-soft px-3.5 py-1 flex items-center gap-1.5">
              <span>{anchorGlyph}</span>
              <span>{itemGlyph}</span>
            </span>
          )}
          {relation === 'outside' && (
            <div className="flex items-center gap-4">
              <span className="rounded-button border-3 border-primary-soft px-3 py-1">{anchorGlyph}</span>
              <span className="rounded-button border-2 border-primary bg-primary-soft px-2.5 py-1">{itemGlyph}</span>
            </div>
          )}
          {relation === 'top' && (
            <div className="flex flex-col items-center leading-tight gap-0.5">
              <span className="rounded-button bg-primary-soft px-2 py-0.5">{itemGlyph}</span>
              <span className="border-t-2 border-primary-soft pt-0.5">{anchorGlyph}</span>
            </div>
          )}
          {relation === 'bottom' && (
            <div className="flex flex-col items-center leading-tight gap-0.5">
              <span className="border-b-2 border-primary-soft pb-0.5">{anchorGlyph}</span>
              <span className="rounded-button bg-primary-soft px-2 py-0.5">{itemGlyph}</span>
            </div>
          )}
          {relation === 'near' && (
            <div className="flex items-center gap-1 rounded-button bg-primary-soft px-3 py-1">
              <span>{anchorGlyph}</span>
              <span>{itemGlyph}</span>
            </div>
          )}
          {relation === 'far' && (
            <div className="flex items-center gap-8 px-2">
              <span>{anchorGlyph}</span>
              <span className="text-xs font-bold text-muted tracking-widest">• • •</span>
              <span>{itemGlyph}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Archetype D: SVG Pan-Balance Scale (`balance-mcq`) ─────────────────────
  if (question.format === 'balance-mcq') {
    const { leftItem, rightItem, heavier, unitCount, askLighter } = question.render;
    const tilt = heavier === 'left' ? -9 : heavier === 'right' ? 9 : 0;
    const prompt = unitCount
      ? `1 ${leftItem} balances ${unitCount} blocks. How many blocks heavy is ${leftItem}?`
      : `Look at the balance scale — which one is ${askLighter ? 'LIGHTER' : 'HEAVIER'}?`;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">{prompt}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-4 py-2 shadow-card">
          <svg
            viewBox="0 0 180 96"
            className="text-primary mx-auto select-none"
            style={{ width: 'clamp(8.5rem, min(72cqw, 95cqh), 13.5rem)', height: 'clamp(4.25rem, min(52cqh, 38cqw), 6.75rem)' }}
            role="img"
            aria-label={`Balance scale with ${leftItem} and ${rightItem}`}
          >
            {/* Base and fulcrum */}
            <polygon points="90,56 76,88 104,88" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <line x1="62" y1="88" x2="118" y2="88" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            {/* Tilted beam + pans */}
            <g transform={`rotate(${tilt} 90 54)`}>
              <line x1="28" y1="54" x2="152" y2="54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <circle cx="90" cy="54" r="4" fill="currentColor" />
              {/* Left pan */}
              <line x1="16" y1="50" x2="52" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <text x="34" y="42" textAnchor="middle" fontSize="22">{leftItem}</text>
              {/* Right pan */}
              <line x1="128" y1="50" x2="164" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <text x="146" y="42" textAnchor="middle" fontSize={unitCount ? '15' : '22'} fill="currentColor" fontWeight="bold">{rightItem}</text>
            </g>
          </svg>
        </div>
      </div>
    );
  }

  // ── Archetype D: Coins Value Tray (`coins-mcq`) ────────────────────────────
  if (question.format === 'coins-mcq') {
    const { coins } = question.render;
    const coinSize = 'clamp(2.4rem, min(26cqh, 15cqw), 3.4rem)';
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">
          {coins.length === 1 ? 'What is the value of this coin?' : 'What is the total value of these coins?'}
        </p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-4 py-2.5 shadow-card flex items-center justify-center gap-2 select-none">
          {coins.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="font-display font-bold text-muted text-sm">+</span>}
              <span
                className="rounded-full border-3 border-primary bg-primary-soft text-primary-ink font-display font-extrabold flex items-center justify-center shadow-button"
                style={{ width: coinSize, height: coinSize, fontSize: `calc(${coinSize} * 0.36)` }}
              >
                🪙{c}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Archetype D: Analogue Clock SVG (`clock`) ──────────────────────────────
  if (question.format === 'clock') {
    const { hours, minutes, deltaHours = 0 } = question.render;
    const minAngle = (minutes / 60) * 360;
    const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;
    const header = deltaHours > 0
      ? `What time will it be ${deltaHours} ${deltaHours === 1 ? 'hour' : 'hours'} later?`
      : 'What time does the clock show?';
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">{header}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-2 shadow-card">
          <svg
            viewBox="0 0 100 100"
            className="text-primary-ink mx-auto"
            style={{ width: STAGE_SVG_SIZE, height: STAGE_SVG_SIZE }}
            role="img"
            aria-label={`${hours}:${String(minutes).padStart(2, '0')}`}
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
            {Array.from({ length: 12 }).map((_, idx) => {
              const deg = idx * 30;
              return (
                <line
                  key={idx}
                  x1="50"
                  y1="7"
                  x2="50"
                  y2={idx % 3 === 0 ? '11' : '9'}
                  stroke="currentColor"
                  strokeWidth={idx % 3 === 0 ? '2.5' : '1.5'}
                  transform={`rotate(${deg} 50 50)`}
                />
              );
            })}
            <text x="50" y="21" textAnchor="middle" fontSize="11" fill="currentColor" fontWeight="bold">12</text>
            <text x="81" y="54" textAnchor="middle" fontSize="11" fill="currentColor" fontWeight="bold">3</text>
            <text x="50" y="88" textAnchor="middle" fontSize="11" fill="currentColor" fontWeight="bold">6</text>
            <text x="19" y="54" textAnchor="middle" fontSize="11" fill="currentColor" fontWeight="bold">9</text>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="29"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              transform={`rotate(${hourAngle} 50 50)`}
            />
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="17"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${minAngle} 50 50)`}
            />
            <circle cx="50" cy="50" r="3.5" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  }

  // ── Archetype D: Pictograph Table (`pictograph`) ───────────────────────────
  if (question.format === 'pictograph') {
    const { rows, scale } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1">{question.questionText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-1.5 shadow-card text-left">
          {rows.map((r, idx) => (
            <div
              key={r.label}
              className={`flex items-center gap-2.5 py-0.5 ${idx > 0 ? 'border-t border-primary-soft' : ''}`}
            >
              <span className="font-body font-bold text-ink text-xs sm:text-sm w-16 shrink-0">{r.label}</span>
              <span
                className="tracking-widest select-none leading-none"
                style={{ fontSize: 'clamp(0.95rem, min(9cqh, 5cqw), 1.35rem)' }}
              >
                {Array.from({ length: r.count }).map(() => r.glyph).join('')}
              </span>
            </div>
          ))}
          {scale > 1 && (
            <div className="text-primary-ink bg-primary-soft rounded-button px-2 py-0.5 text-xs font-extrabold mt-1 text-center">
              Key: 1 picture = {scale}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Archetype D: Partitioned Fraction Shape (`fraction-mcq`) ────────────────
  if (question.format === 'fraction-mcq') {
    const { totalParts, shadedParts, visualShape = 'bar', offset = 0, askUnshaded = false } = question.render;
    const isCellShaded = (i) => {
      for (let k = 0; k < shadedParts; k++) {
        if ((offset + k) % totalParts === i) return true;
      }
      return false;
    };
    const isGrid = visualShape === 'grid' && totalParts === 4;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">
          {shadedParts} of {totalParts} equal parts shaded — what fraction is{' '}
          <span className="text-primary underline">{askUnshaded ? 'UNSHADED' : 'SHADED'}</span>?
        </p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card p-2.5 shadow-card">
          <div
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${isGrid ? 2 : totalParts}, 1fr)`,
              width: isGrid ? 'clamp(4.5rem, min(38cqw, 52cqh), 6.5rem)' : 'clamp(6.5rem, min(56cqw, 85cqh), 11rem)',
              height: isGrid ? 'clamp(4.5rem, min(38cqw, 52cqh), 6.5rem)' : 'clamp(2.5rem, min(28cqh, 22cqw), 4rem)',
            }}
            role="img"
            aria-label={`${shadedParts} of ${totalParts} parts shaded`}
          >
            {Array.from({ length: totalParts }).map((_, i) => (
              <div
                key={i}
                className={`border-2 border-primary rounded-xs ${
                  isCellShaded(i) ? 'bg-primary' : 'bg-bg-card'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Structured `render.kind` Archetypes B, C & D (on `format: 'mcq'`) ──────
  const kind = question.render?.kind;

  // Archetype B.1: Ordinal non-wrapping single-row strip (`ordinal-strip`)
  if (kind === 'ordinal-strip') {
    const { items, target } = question.render;
    const n = items.length;
    const cellSize = `clamp(1.85rem, min(calc((86cqw - ${(n - 1) * 4}px) / ${n}), 28cqh), 2.85rem)`;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">
          From the <span className="text-primary underline">left</span>, what position is {target}?
        </p>
        <div className="mx-auto w-fit max-w-full rounded-card border-2 border-primary-soft bg-bg-card px-2.5 py-2 shadow-card">
          <div className="text-left text-xs font-extrabold text-primary mb-1">← Start (1st)</div>
          <div className="flex items-center justify-center gap-1 select-none">
            {items.map((glyph, i) => {
              const isTarget = glyph === target;
              return (
                <span
                  key={i}
                  className={`rounded-button flex items-center justify-center leading-none ${
                    isTarget
                      ? 'border-2 border-primary bg-primary-soft shadow-button'
                      : 'border border-primary-soft bg-bg'
                  }`}
                  style={{ width: cellSize, height: cellSize, fontSize: `calc(${cellSize} * 0.62)` }}
                >
                  {glyph}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Archetype B.2: Pattern strip (`pattern-strip`)
  if (kind === 'pattern-strip') {
    const { sequence } = question.render;
    const n = sequence.length + 1;
    const cellSize = `clamp(1.9rem, min(calc((86cqw - ${(n - 1) * 4}px) / ${n}), 28cqh), 2.9rem)`;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">What comes next in the pattern?</p>
        <div className="mx-auto w-fit max-w-full rounded-card border-2 border-primary-soft bg-bg-card px-2.5 py-2 shadow-card flex items-center justify-center gap-1 select-none">
          {sequence.map((glyph, i) => (
            <span
              key={i}
              className="rounded-button border border-primary-soft bg-bg flex items-center justify-center leading-none"
              style={{ width: cellSize, height: cellSize, fontSize: `calc(${cellSize} * 0.62)` }}
            >
              {glyph}
            </span>
          ))}
          <TargetSlot blankFill={blankFill} answer={question.correctAnswer} size={cellSize} />
        </div>
      </div>
    );
  }

  // Archetype B.3: Sorting tray (`sorting-tray`)
  if (kind === 'sorting-tray') {
    const { mode, items } = question.render;
    const prompt = mode === 'odd-one-out' ? 'Which one does NOT belong?' : 'Which one belongs with this group?';
    const cellSize = 'clamp(2.25rem, min(18cqw, 28cqh), 3.1rem)';
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">{prompt}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3 py-2 shadow-card flex items-center justify-center gap-2 select-none">
          {items.map((glyph, i) => (
            <span
              key={i}
              className="rounded-button border border-primary-soft bg-bg flex items-center justify-center leading-none"
              style={{ width: cellSize, height: cellSize, fontSize: `calc(${cellSize} * 0.62)` }}
            >
              {glyph}
            </span>
          ))}
          {mode === 'belongs-with' && (
            <TargetSlot blankFill={blankFill} answer={question.correctAnswer} size={cellSize} />
          )}
        </div>
      </div>
    );
  }

  // Archetype B.4: Number-stepping track (`number-step` for 21–99)
  if (kind === 'number-step') {
    const { sequence } = question.render;
    const boxH = 'clamp(2.35rem, min(26cqh, 14cqw), 3.25rem)';
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">Count forward — what comes next?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card flex items-center justify-center gap-2 select-none">
          {sequence.map((num, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="rounded-button border-2 border-primary-soft bg-bg font-display font-extrabold text-primary-ink px-3 flex items-center justify-center"
                style={{ height: boxH, fontSize: `calc(${boxH} * 0.55)` }}
              >
                {num}
              </span>
              <span className="text-primary font-extrabold text-base">→</span>
            </div>
          ))}
          <TargetSlot blankFill={blankFill} answer={question.correctAnswer} size={boxH} />
        </div>
      </div>
    );
  }

  // Archetype B.5: Days & Daily Time Sequence Card (`time-sequence`)
  if (kind === 'time-sequence') {
    const { current, direction, noun } = question.render;
    const isForward = direction === 'after' || direction === 'tomorrow' || direction === '2 days after';
    const headerText = direction === 'tomorrow'
      ? `Today is ${current} — what day is TOMORROW?`
      : direction === 'yesterday'
        ? `Today is ${current} — what day was YESTERDAY?`
        : direction === '2 days after'
          ? `What day comes 2 days AFTER ${current}?`
          : `What ${noun} comes right ${isForward ? 'AFTER' : 'BEFORE'}?`;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">{headerText}</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card flex items-center justify-center gap-2.5 select-none">
          {!isForward && (
            <>
              <TargetSlot blankFill={blankFill} answer={question.correctAnswer} />
              <span className="text-primary font-extrabold text-lg">←</span>
            </>
          )}
          <span className="rounded-button border-2 border-primary bg-primary-soft font-display font-extrabold text-primary-ink px-3.5 py-1.5 text-base sm:text-lg">
            {current}
          </span>
          {isForward && (
            <>
              <span className="text-primary font-extrabold text-lg">
                {direction === '2 days after' ? '+2 →' : '→'}
              </span>
              <TargetSlot blankFill={blankFill} answer={question.correctAnswer} />
            </>
          )}
        </div>
      </div>
    );
  }

  // Archetype C.1: Place-Value Houses (`place-houses` for Tens & Ones and Hundreds Club)
  if (kind === 'place-houses') {
    const { columns } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">What number do these houses make?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3 py-2 shadow-card flex items-center justify-center gap-2 select-none">
          {columns.map((col, i) => (
            <div key={col.label} className="flex items-center gap-1.5">
              {i > 0 && <span className="font-display font-extrabold text-muted text-sm">+</span>}
              <div className="rounded-button border-2 border-primary-soft bg-bg px-2.5 py-1 text-center min-w-[4.25rem]">
                <div
                  className="font-display font-extrabold text-primary-ink leading-tight"
                  style={{ fontSize: 'clamp(1.25rem, min(14cqh, 7cqw), 1.85rem)' }}
                >
                  {col.count}
                </div>
                <div className="text-xs font-body font-bold text-muted">{col.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Archetype C.2: Money Addition & Change Cards (`money-add`, `money-change`)
  if (kind === 'money-add') {
    const { a, b } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">Add the money together:</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-4 py-2 shadow-card flex items-center justify-center gap-2.5 font-display font-extrabold text-primary-ink">
          <span className="rounded-button border-2 border-primary bg-primary-soft px-3 py-1 text-lg">🪙 {a}</span>
          <span className="text-primary text-lg">+</span>
          <span className="rounded-button border-2 border-primary bg-primary-soft px-3 py-1 text-lg">🪙 {b}</span>
          <span className="text-primary text-lg">=</span>
          <TargetSlot blankFill={blankFill} answer={`🪙 ${question.correctAnswer}`} />
        </div>
      </div>
    );
  }

  if (kind === 'money-change') {
    const { have, spend } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">How much money is left?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card flex items-center justify-center gap-2.5 select-none">
          <div className="rounded-button border-2 border-primary-soft bg-bg px-3 py-1 text-center">
            <div className="text-xs font-body font-bold text-muted">👛 Have</div>
            <div className="font-display font-extrabold text-primary-ink text-lg leading-tight">🪙 {have}</div>
          </div>
          <span className="font-display font-extrabold text-primary text-xl">−</span>
          <div className="rounded-button border-2 border-primary-soft bg-bg px-3 py-1 text-center">
            <div className="text-xs font-body font-bold text-muted">🏷️ Spend</div>
            <div className="font-display font-extrabold text-primary-ink text-lg leading-tight">🪙 {spend}</div>
          </div>
        </div>
      </div>
    );
  }

  // Archetype C.3: Standard Ruler & Length Cards (`ruler-cm`, `length-add`, `ribbon-compare`)
  if (kind === 'ruler-cm') {
    const { start, end } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">How many cm long is the bar?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-4 py-2 shadow-card">
          <div className="flex items-center justify-between text-xs font-body font-extrabold text-primary-ink mb-1 gap-6">
            <span className="rounded-button bg-primary-soft px-2 py-0.5">Start: {start} cm</span>
            <span className="rounded-button bg-primary-soft px-2 py-0.5">End: {end} cm</span>
          </div>
          <div className="h-3 w-48 max-w-[72cqw] rounded-full bg-primary-soft overflow-hidden border border-primary flex items-center">
            <div className="h-full bg-primary w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'length-add') {
    const { a, b, unit } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">Join the two lengths:</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-4 py-2 shadow-card flex items-center justify-center gap-2 font-display font-extrabold text-primary-ink text-lg">
          <span className="rounded-button bg-primary-soft px-2.5 py-1">{a} {unit}</span>
          <span className="text-primary">+</span>
          <span className="rounded-button bg-primary-soft px-2.5 py-1">{b} {unit}</span>
          <span className="text-primary">=</span>
          <TargetSlot blankFill={blankFill} answer={`${question.correctAnswer} ${unit}`} />
        </div>
      </div>
    );
  }

  if (kind === 'ribbon-compare') {
    const { a, b } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">How many blocks LONGER is Ribbon A?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card text-left space-y-1">
          <div className="flex items-center gap-2 text-xs font-body font-bold text-ink">
            <span className="w-16">Ribbon A ({a})</span>
            <span className="leading-none">{Array.from({ length: a }).map(() => '🟦').join('')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-body font-bold text-ink">
            <span className="w-16">Ribbon B ({b})</span>
            <span className="leading-none">{Array.from({ length: b }).map(() => '🟦').join('')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Archetype C.4: Capacity Cards (`capacity-jugs`, `capacity-tanks`)
  if (kind === 'capacity-jugs') {
    const { perJug, jugs } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">How many litres in all {jugs} jugs?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card flex items-center justify-center gap-2 select-none">
          {Array.from({ length: jugs }).map((_, i) => (
            <div key={i} className="rounded-button border border-primary-soft bg-bg px-2.5 py-1 text-center">
              <div className="text-base leading-none">🫗</div>
              <div className="font-display font-extrabold text-primary-ink text-xs mt-0.5">{perJug} L</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'capacity-tanks') {
    const { tankA, tankB } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">How many MORE litres in Tank A?</p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card flex items-center justify-center gap-3 select-none">
          <div className="rounded-button border-2 border-primary bg-primary-soft px-3 py-1 text-center">
            <div className="text-xs font-body font-bold text-muted">🪣 Tank A</div>
            <div className="font-display font-extrabold text-primary-ink text-lg leading-tight">{tankA} L</div>
          </div>
          <span className="font-display font-extrabold text-muted text-sm">vs</span>
          <div className="rounded-button border-2 border-primary-soft bg-bg px-3 py-1 text-center">
            <div className="text-xs font-body font-bold text-muted">🪣 Tank B</div>
            <div className="font-display font-extrabold text-primary-ink text-lg leading-tight">{tankB} L</div>
          </div>
        </div>
      </div>
    );
  }

  // Archetype D.1: Side-by-side Group Compare (`group-compare` for More or Fewer?)
  if (kind === 'group-compare') {
    const { countA, glyphA, countB, glyphB, word } = question.render;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">
          How many are in the group with <span className="text-primary underline">{word}</span>?
        </p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-2.5 py-1.5 shadow-card grid grid-cols-2 gap-2 select-none">
          <div className="rounded-button border border-primary-soft bg-bg px-2 py-1 text-center">
            <div className="text-xs font-body font-bold text-muted mb-0.5">Group A</div>
            <div className="flex flex-wrap items-center justify-center gap-0.5 text-xl sm:text-3xl leading-none">
              {Array.from({ length: countA }).map((_, i) => <span key={i}>{glyphA}</span>)}
            </div>
          </div>
          <div className="rounded-button border border-primary-soft bg-bg px-2 py-1 text-center">
            <div className="text-xs font-body font-bold text-muted mb-0.5">Group B</div>
            <div className="flex flex-wrap items-center justify-center gap-0.5 text-xs sm:text-sm leading-tight">
              {Array.from({ length: countB }).map((_, i) => <span key={i}>{glyphB}</span>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Archetype D.2: Fraction of a Collection & Whole-Part Equivalence (`half-collection`, `fraction-whole`)
  if (kind === 'half-collection') {
    const { total, num = 1, den = 2, glyph = '🍎', word = 'items' } = question.render;
    const fracStr = `${num}/${den}`;
    const groupSize = total / den;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">
          What is <span className="text-primary underline">{fracStr}</span> of {total} {word}?
        </p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3 py-2 shadow-card flex flex-wrap items-center justify-center gap-2 select-none">
          {Array.from({ length: den }).map((_, gIdx) => (
            <div
              key={gIdx}
              className={`rounded-button border-2 px-2 py-1.5 flex flex-wrap items-center justify-center gap-0.5 max-w-[9.5rem] text-sm leading-tight ${
                gIdx < num ? 'border-primary bg-primary-soft' : 'border-primary-soft bg-bg'
              }`}
            >
              {Array.from({ length: groupSize }).map((__, i) => (
                <span key={i}>{glyph}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'fraction-whole') {
    const { wholes, partsPerWhole } = question.render;
    const fracStr = `1/${partsPerWhole}`;
    return (
      <div className="text-center">
        <p className="text-prompt font-body font-extrabold text-ink mb-1.5">
          {question.questionText}
        </p>
        <div className="mx-auto w-fit rounded-card border-2 border-primary-soft bg-bg-card px-3.5 py-2 shadow-card flex items-center justify-center gap-2 select-none">
          {Array.from({ length: wholes }).map((_, i) => (
            <div key={i} className="rounded-button border-2 border-primary bg-primary-soft px-2.5 py-1 text-center">
              <div className="text-base leading-none">🍕</div>
              <div className="text-xs font-display font-extrabold text-primary-ink mt-0.5">{partsPerWhole} × {fracStr}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Archetype A Default: Compact Equation or Fallback Sentence `mcq` ────────
  const MAX_COMPACT_LENGTH = 20;
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
