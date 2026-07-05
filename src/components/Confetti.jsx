import { useMemo } from 'react';

/**
 * Confetti — a brief, GPU-safe celebration burst (UI overhaul, Screen 2).
 *
 * A small sprinkle of pieces fans out from the top-centre of its (relatively-positioned) parent,
 * each animating a single `confetti-fall` keyframe via inline CSS custom properties (spread,
 * rotation, duration, delay). Transform/opacity only — no layout thrash, low-end-Android safe.
 * Piece count is kept MODEST on purpose (no jank on cheap phones — STANDARDS §5).
 *
 * PURELY PRESENTATIONAL & DECORATIVE (aria-hidden, pointer-events-none). Reused by the session-end
 * celebration and its mastery-up beat (`palette="amber"`). Respects prefers-reduced-motion by
 * rendering nothing — the celebration still reads via the (motionless) title/score/mascot.
 *
 * amber IS allowed here: session-end is a REWARD moment (locked meaning), not a countable object.
 *
 * @param {number} count   - number of pieces (default modest)
 * @param {'party'|'amber'} palette - colour set; 'amber' skews warm for the mastery-up beat
 */
const PALETTES = {
  // A joyful mix (amber legitimately included — this is a reward moment).
  party: ['var(--color-accent)', 'var(--color-primary)', 'var(--color-success)', 'var(--color-learn)'],
  // Warm/amber-forward for the mastery-up beat.
  amber: ['var(--color-accent)', 'var(--color-accent)', 'var(--color-primary-soft)'],
};

const DEFAULT_COUNT = 16;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// Spread values are decorative randomness (not app state) — Math.random is fine here.
function makePieces(count, colors) {
  return Array.from({ length: count }, (_, i) => {
    const startX = Math.round((Math.random() - 0.5) * 60); // tight origin near centre
    const dx = Math.round((Math.random() - 0.5) * 280); // fan out horizontally
    const dy = Math.round(120 + Math.random() * 150); // fall down
    const rot = Math.round((Math.random() - 0.5) * 1080); // tumble
    const dur = Math.round(1000 + Math.random() * 400);
    const delay = Math.round(Math.random() * 220);
    const size = Math.round(7 + Math.random() * 4);
    const circle = i % 3 === 0;
    return { i, startX, dx, dy, rot, dur, delay, size, circle, color: colors[i % colors.length] };
  });
}

export default function Confetti({ count = DEFAULT_COUNT, palette = 'party' }) {
  const colors = PALETTES[palette] ?? PALETTES.party;
  // Compute piece params once (per mount) so React re-renders don't reshuffle the burst.
  const pieces = useMemo(() => makePieces(count, colors), [count, palette]); // eslint-disable-line react-hooks/exhaustive-deps

  if (prefersReducedMotion()) return null;

  // No overflow clipping here: the burst spills naturally (e.g. beyond the small mastery-up pill).
  // The session-end screen container is already `overflow-hidden`, so pieces never cause scroll.
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece absolute top-[18%]"
          style={{
            left: `calc(50% + ${p.startX}px)`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: p.circle ? '50%' : '2px',
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--rot': `${p.rot}deg`,
            '--dur': `${p.dur}ms`,
            '--delay': `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
