/**
 * KidButton — the kid-facing answer-tile primitive (UI overhaul, Screen 1).
 *
 * Big, soft-rounded, pressable: it SQUISHES on press (transform scale, GPU-safe) and reacts
 * to the answer state — `correct` pops in success green (syncs with the chime), `wrong` gets a
 * gentle encourage nudge in soft coral (never harsh red, never amber — amber = reward only).
 *
 * PURELY PRESENTATIONAL. All answer logic (which option, when locked, the remediation ladder)
 * lives in useQuizSession; this only renders the state it's handed (STANDARDS §2). All colours,
 * radii and shadows come from design tokens (theme-wonder) — no raw hex.
 *
 * @param {string} label    - the option text
 * @param {'idle'|'correct'|'wrong'} state - visual state driven by the session
 * @param {boolean} disabled - locked during the post-answer pause (prevents double-tap)
 * @param {() => void} onClick
 * @param {number} index    - position in the option row; drives the stagger-in delay
 */
const STATE_CLASS = {
  // idle also carries the stagger-in; correct/wrong swap it out for their own one-shot motion
  // so two transform animations never fight on the same node.
  idle: 'bg-bg-card border-primary-soft text-primary animate-opt-in',
  correct: 'bg-success border-success text-white animate-correct-pop',
  wrong: 'bg-encourage-soft border-encourage text-encourage-ink animate-encourage-nudge',
};

export default function KidButton({ label, state = 'idle', disabled = false, onClick, index = 0 }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-button border-4 text-option font-extrabold shadow-button flex items-center justify-center transition-transform ${STATE_CLASS[state]} ${
        disabled ? 'cursor-default' : 'active:scale-95 hover:scale-[1.03]'
      }`}
      style={{
        height: 'clamp(3rem, 11vh, 5rem)',
        width: 'calc(50% - 0.375rem)',
        // Stagger only applies to the idle stagger-in animation.
        animationDelay: state === 'idle' ? `${index * 45}ms` : undefined,
      }}
    >
      {label}
    </button>
  );
}
