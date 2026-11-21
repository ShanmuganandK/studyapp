/**
 * SkillIcon — bespoke flat-2D, token-coloured SVG medallions for all 36 ready skills (DS-6).
 *
 * Replaces platform-variant OS emojis with a cohesive Tinku-world visual language:
 *   - Rounded 2px strokes & chunky soft-cornered geometry matching Tinku's flat 2D style
 *   - Consumes CSS custom properties ONLY (zero raw hex — re-themes across Wonder/Sunset/Bubblegum)
 *   - Never uses ⭐ stars as countable objects
 *
 * @param {string} skillId - skill ID from skillMap.js
 * @param {string} [fallback] - optional text/emoji fallback if an unknown/planned skillId is passed
 * @param {number} [size=34] - pixel width/height
 * @param {string} [className]
 */

const C = {
  bg: 'var(--color-bg)',
  card: 'var(--color-bg-card)',
  primary: 'var(--color-primary)',
  primarySoft: 'var(--color-primary-soft)',
  primaryInk: 'var(--color-primary-ink)',
  accent: 'var(--color-accent)',
  accentSoft: 'var(--color-accent-soft)',
  learn: 'var(--color-learn)',
  learnSoft: 'var(--color-learn-soft)',
  learnInk: 'var(--color-learn-ink)',
  success: 'var(--color-success)',
  successSoft: 'var(--color-success-soft)',
  encourage: 'var(--color-encourage)',
  encourageSoft: 'var(--color-encourage-soft)',
  encourageInk: 'var(--color-encourage-ink)',
  review: 'var(--color-review)',
  ink: 'var(--color-ink)',
  muted: 'var(--color-muted)',
};

const RENDERERS = {
  // ── Grade 1 ──────────────────────────────────────────────────────────────────
  'g1.count.1-9': () => (
    <>
      <rect x="6" y="13" width="12" height="12" rx="3" fill={C.learnSoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="22" y="13" width="12" height="12" rx="3" fill={C.accentSoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="14" y="21" width="12" height="12" rx="3" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <path d="M12 19h0M28 19h0M20 27h0" stroke={C.primaryInk} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M20 5l1.4 3 3 .6-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3L15.6 8.6l3-.6L20 5z" fill={C.accent} />
    </>
  ),

  'g1.count.1-20': () => (
    <>
      <rect x="5" y="9" width="30" height="22" rx="4" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((c) => (
        <g key={c}>
          <circle cx={10 + c * 5} cy="15.5" r="1.8" fill={C.primaryInk} />
          <circle cx={10 + c * 5} cy="24.5" r="1.8" fill={c < 3 ? C.accent : C.learn} />
        </g>
      ))}
      <path d="M8 20h24" stroke={C.card} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  'g1.prenum.compare': () => (
    <>
      <rect x="6" y="8" width="13" height="24" rx="4" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <circle cx="12.5" cy="20" r="3.8" fill={C.learn} stroke={C.learnInk} strokeWidth="1.8" />
      <rect x="23" y="15" width="11" height="17" rx="3.5" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <circle cx="26.5" cy="21" r="1.6" fill={C.primaryInk} />
      <circle cx="30.5" cy="21" r="1.6" fill={C.primaryInk} />
      <circle cx="28.5" cy="26" r="1.6" fill={C.primaryInk} />
    </>
  ),

  'g1.num.compare20': () => (
    <>
      <rect x="5" y="11" width="10" height="18" rx="3" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <rect x="25" y="14" width="10" height="15" rx="3" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <path d="M17 15l7 5-7 5" fill="none" stroke={C.accent} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="2" fill={C.primaryInk} />
      <circle cx="30" cy="21.5" r="1.6" fill={C.learnInk} />
    </>
  ),

  'g1.num.ordinal': () => (
    <>
      <rect x="5" y="21" width="9" height="12" rx="2" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <rect x="15.5" y="14" width="9" height="19" rx="2" fill={C.accentSoft} stroke={C.accent} strokeWidth="2" />
      <rect x="26" y="24" width="9" height="9" rx="2" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <path d="M20 7v4M18 9h4" stroke={C.primaryInk} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="1.8" fill={C.primaryInk} />
    </>
  ),

  'g1.add.within10': () => (
    <>
      <rect x="7" y="7" width="26" height="26" rx="7" fill={C.successSoft} stroke={C.success} strokeWidth="2" />
      <path d="M20 13v14M13 20h14" stroke={C.success} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.6" fill={C.accent} />
      <circle cx="28" cy="28" r="1.6" fill={C.primary} />
    </>
  ),

  'g1.add.within20': () => (
    <>
      <rect x="5" y="17" width="18" height="14" rx="3" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <circle cx="10" cy="24" r="2" fill={C.primaryInk} />
      <circle cx="18" cy="24" r="2" fill={C.primaryInk} />
      <circle cx="31" cy="24" r="4.5" fill={C.successSoft} stroke={C.success} strokeWidth="2" />
      <path d="M26 17c-2-5-8-6-11-2" fill="none" stroke={C.success} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 12l1 3.5 3.5-.5" fill="none" stroke={C.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  'g1.sub.within10': () => (
    <>
      <ellipse cx="17" cy="15" rx="7" ry="8.5" fill={C.encourageSoft} stroke={C.encourageInk} strokeWidth="2" />
      <path d="M17 24c-1 3 1 5 0 9" fill="none" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M28 11l3-3M30 16h4M28 21l3 3" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="14.5" cy="12.5" r="1.4" fill={C.card} />
    </>
  ),

  'g1.sub.within20': () => (
    <>
      <ellipse cx="13" cy="15" rx="5.5" ry="7" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <ellipse cx="25" cy="13" rx="5.5" ry="7" fill={C.encourageSoft} stroke={C.encourageInk} strokeWidth="2" />
      <path d="M13 22v9M25 20v11" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="19" y="24" width="14" height="8" rx="3" fill={C.card} stroke={C.encourageInk} strokeWidth="2" />
      <path d="M22.5 28h7" stroke={C.encourageInk} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),

  'g1.num.21-99': () => (
    <>
      <rect x="5" y="18" width="12" height="13" rx="3" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <rect x="23" y="9" width="12" height="13" rx="3" fill={C.accentSoft} stroke={C.accent} strokeWidth="2" />
      <path d="M17 21c2-5 4-6 6-6" fill="none" stroke={C.primaryInk} strokeWidth="2.2" strokeLinecap="round" />
      <text x="11" y="27.5" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.primaryInk}>29</text>
      <text x="29" y="18.5" textAnchor="middle" fontSize="8" fontWeight="800" fill={C.primaryInk}>30</text>
    </>
  ),

  'g1.place.tens-ones': () => (
    <>
      <rect x="9" y="7" width="8" height="26" rx="2" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      {[12, 17, 22, 27].map((y) => (
        <path key={y} d={`M9 ${y}h8`} stroke={C.primary} strokeWidth="1.4" />
      ))}
      <rect x="23" y="25" width="8" height="8" rx="2" fill={C.accentSoft} stroke={C.accent} strokeWidth="2" />
      <rect x="23" y="15" width="8" height="8" rx="2" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
    </>
  ),

  'g1.money.coins': () => (
    <>
      <circle cx="15" cy="22" r="9" fill={C.accentSoft} stroke={C.accent} strokeWidth="2.2" />
      <circle cx="25" cy="18" r="9" fill={C.primarySoft} stroke={C.primary} strokeWidth="2.2" />
      <text x="25" y="21.5" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={C.primaryInk}>5</text>
      <text x="13" y="25" textAnchor="middle" fontSize="8.5" fontWeight="800" fill={C.primaryInk}>2</text>
    </>
  ),

  'g1.prenum.patterns': () => (
    <>
      <circle cx="9.5" cy="20" r="4" fill={C.primary} />
      <polygon points="20,15 24.5,24 15.5,24" fill={C.encourage} />
      <circle cx="30.5" cy="20" r="4" fill="none" stroke={C.primaryInk} strokeWidth="2" strokeDasharray="2.5 2" />
      <path d="M7 10h26M7 30h26" stroke={C.primarySoft} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),

  'g1.prenum.sort': () => (
    <>
      <rect x="6" y="11" width="18" height="20" rx="4" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <circle cx="12" cy="18" r="2.5" fill={C.primary} />
      <circle cx="18" cy="24" r="2.5" fill={C.primary} />
      <rect x="26" y="14" width="9" height="14" rx="3" fill={C.encourageSoft} stroke={C.encourageInk} strokeWidth="2" strokeDasharray="2.5 2" />
      <polygon points="30.5,18.5 33,23.5 28,23.5" fill={C.encourageInk} />
    </>
  ),

  'g1.shapes.2d': () => (
    <>
      <circle cx="14" cy="15" r="7" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <rect x="19" y="19" width="13" height="13" rx="2.5" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <polygon points="15,20 22,33 8,33" fill={C.accentSoft} stroke={C.accent} strokeWidth="2" strokeLinejoin="round" />
    </>
  ),

  'g1.shapes.space': () => (
    <>
      <rect x="9" y="19" width="22" height="14" rx="4" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <path d="M9 23h22" stroke={C.primary} strokeWidth="1.5" />
      <circle cx="20" cy="12" r="5" fill={C.accent} stroke={C.primaryInk} strokeWidth="2" />
    </>
  ),

  'g1.measure.length': () => (
    <>
      <rect x="6" y="11" width="24" height="7" rx="3.5" fill={C.accentSoft} stroke={C.primaryInk} strokeWidth="2" />
      <path d="M27 11l4 3.5-4 3.5" fill={C.encourage} stroke={C.primaryInk} strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="6" y="23" width="8" height="7" rx="1.5" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="1.8" />
      <rect x="15" y="23" width="8" height="7" rx="1.5" fill={C.primarySoft} stroke={C.primary} strokeWidth="1.8" />
      <rect x="24" y="23" width="8" height="7" rx="1.5" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="1.8" />
    </>
  ),

  'g1.measure.weight': () => (
    <>
      <path d="M20 9v22M13 31h14" stroke={C.primaryInk} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 17l24-5" stroke={C.primary} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="10" cy="22" r="4" fill={C.accentSoft} stroke={C.primaryInk} strokeWidth="2" />
      <circle cx="30" cy="17" r="2.6" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
    </>
  ),

  'g1.time.daynight': () => (
    <>
      <circle cx="20" cy="20" r="13" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
      <path d="M20 7a13 13 0 0 0 0 26z" fill={C.accentSoft} />
      <circle cx="14" cy="20" r="4" fill={C.accent} />
      <path d="M26 15a4.5 4.5 0 1 0 3 7.5 3.6 3.6 0 1 1-3-7.5z" fill={C.primaryInk} />
    </>
  ),

  // ── Grade 2 ──────────────────────────────────────────────────────────────────
  'g2.num.3digit': () => (
    <>
      <rect x="6" y="9" width="16" height="16" rx="2.5" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <path d="M6 14.5h16M6 19.5h16M11.5 9v16M16.5 9v16" stroke={C.primary} strokeWidth="1.2" />
      <rect x="25" y="9" width="5" height="16" rx="1.5" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="1.8" />
      <rect x="25" y="28" width="5" height="5" rx="1.2" fill={C.accentSoft} stroke={C.accent} strokeWidth="1.8" />
    </>
  ),

  'g2.place.hundreds': () => (
    <>
      <path d="M5 18l5-6 5 6v13H5z" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 19l4-5 4 5v12h-8z" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" strokeLinejoin="round" />
      <path d="M26 21l4.5-4.5L35 21v10h-9z" fill={C.accentSoft} stroke={C.accent} strokeWidth="2" strokeLinejoin="round" />
    </>
  ),

  'g2.num.compare999': () => (
    <>
      <rect x="6" y="9" width="11" height="22" rx="3" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <rect x="23" y="13" width="11" height="18" rx="3" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <path d="M18 16l4 4-4 4" fill="none" stroke={C.accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15h5M9 20h5M26 19h5" stroke={C.primaryInk} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  'g2.add.2d-nocarry': () => (
    <>
      <rect x="7" y="7" width="26" height="26" rx="5" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <path d="M14 11v18M26 11v18" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="15" r="2.5" fill={C.primary} />
      <circle cx="14" cy="24" r="2.5" fill={C.accent} />
      <circle cx="26" cy="18" r="2.5" fill={C.success} />
      <circle cx="26" cy="26" r="2.5" fill={C.learn} />
    </>
  ),

  'g2.add.2d-carry': () => (
    <>
      <rect x="8" y="15" width="10" height="17" rx="2.5" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <rect x="22" y="15" width="10" height="17" rx="2.5" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <path d="M27 14c0-6-14-6-14 0" fill="none" stroke={C.success} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10.5 11.5L13 14.5l3-2" fill="none" stroke={C.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27" cy="24" r="2.2" fill={C.learnInk} />
      <circle cx="13" cy="24" r="2.2" fill={C.primaryInk} />
    </>
  ),

  'g2.sub.2d-noborrow': () => (
    <>
      <rect x="7" y="8" width="26" height="24" rx="5" fill={C.encourageSoft} stroke={C.encourageInk} strokeWidth="2" />
      <path d="M13 20h14" stroke={C.encourageInk} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="14" cy="13.5" r="2" fill={C.primary} />
      <circle cx="26" cy="26.5" r="2" fill={C.primaryInk} />
    </>
  ),

  'g2.sub.2d-borrow': () => (
    <>
      <rect x="8" y="14" width="10" height="18" rx="2.5" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <rect x="22" y="14" width="10" height="18" rx="2.5" fill={C.encourageSoft} stroke={C.encourageInk} strokeWidth="2" />
      <path d="M13 13c0-5 14-5 14 0" fill="none" stroke={C.encourageInk} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 11.5l3 2 2.5-3" fill="none" stroke={C.encourageInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27" cy="23" r="2.2" fill={C.encourageInk} />
    </>
  ),

  'g2.money.amounts': () => (
    <>
      <path d="M9 15h22l-2 17H11z" fill={C.accentSoft} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 15v-3a5 5 0 0 1 10 0v3" fill="none" stroke={C.primaryInk} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="23.5" r="4" fill={C.accent} stroke={C.primaryInk} strokeWidth="1.6" />
    </>
  ),

  'g2.mul.intro': () => (
    <>
      {[10, 20, 30].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="20" r="5" fill={C.primarySoft} stroke={C.primary} strokeWidth="1.8" />
          <circle cx={cx - 1.5} cy="20" r="1.2" fill={C.primaryInk} />
          <circle cx={cx + 1.5} cy="20" r="1.2" fill={C.primaryInk} />
        </g>
      ))}
    </>
  ),

  'g2.mul.table2': () => (
    <>
      <rect x="7" y="8" width="26" height="24" rx="6" fill={C.learnSoft} stroke={C.learnInk} strokeWidth="2" />
      <text x="20" y="24" textAnchor="middle" fontSize="13" fontWeight="900" fill={C.primaryInk}>×2</text>
    </>
  ),

  'g2.mul.table5': () => (
    <>
      <rect x="7" y="8" width="26" height="24" rx="6" fill={C.accentSoft} stroke={C.accent} strokeWidth="2" />
      <text x="20" y="24" textAnchor="middle" fontSize="13" fontWeight="900" fill={C.primaryInk}>×5</text>
    </>
  ),

  'g2.mul.table10': () => (
    <>
      <rect x="6" y="8" width="28" height="24" rx="6" fill={C.primarySoft} stroke={C.primary} strokeWidth="2" />
      <text x="20" y="24" textAnchor="middle" fontSize="12" fontWeight="900" fill={C.primaryInk}>×10</text>
    </>
  ),

  'g2.frac.halves-quarters': () => (
    <>
      <circle cx="20" cy="20" r="13" fill={C.card} stroke={C.primary} strokeWidth="2.2" />
      <path d="M20 20V7a13 13 0 0 1 13 13z" fill={C.primary} />
      <path d="M20 7v26M7 20h26" stroke={C.primaryInk} strokeWidth="2" />
    </>
  ),

  'g2.measure.length-std': () => (
    <>
      <rect x="5" y="13" width="30" height="14" rx="3" fill={C.accentSoft} stroke={C.primaryInk} strokeWidth="2" />
      {[10, 15, 20, 25, 30].map((x, idx) => (
        <path
          key={x}
          d={`M${x} 13v${idx % 2 === 0 ? 7 : 4.5}`}
          stroke={C.primaryInk}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ))}
    </>
  ),

  'g2.measure.capacity': () => (
    <>
      <path d="M11 11h14l-1.5 20h-11z" fill={C.card} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12.2 21h11.6l-.7 10h-10.2z" fill={C.learn} />
      <path d="M25 15h3.5a3 3 0 0 1 0 6H24.5" fill="none" stroke={C.primaryInk} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 16h4M14 25h4" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),

  'g2.time.clock': () => (
    <>
      <circle cx="20" cy="20" r="13" fill={C.card} stroke={C.primary} strokeWidth="2.2" />
      <path d="M20 20V12M20 20l5.5 3.5" stroke={C.primaryInk} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="20" cy="20" r="1.8" fill={C.accent} />
      <circle cx="20" cy="9.5" r="1.1" fill={C.primary} />
      <circle cx="30.5" cy="20" r="1.1" fill={C.primary} />
      <circle cx="20" cy="30.5" r="1.1" fill={C.primary} />
      <circle cx="9.5" cy="20" r="1.1" fill={C.primary} />
    </>
  ),

  'g2.data.pictograph': () => (
    <>
      <rect x="6" y="8" width="28" height="24" rx="4" fill={C.card} stroke={C.primary} strokeWidth="2" />
      <circle cx="12" cy="14" r="2.1" fill={C.accent} />
      <circle cx="18" cy="14" r="2.1" fill={C.accent} />
      <circle cx="24" cy="14" r="2.1" fill={C.accent} />
      <circle cx="12" cy="21" r="2.1" fill={C.learn} />
      <circle cx="18" cy="21" r="2.1" fill={C.learn} />
      <rect x="9" y="26.5" width="22" height="2.5" rx="1.2" fill={C.primarySoft} />
    </>
  ),
};

export default function SkillIcon({ skillId, fallback = '', size = 34, className = '' }) {
  const render = RENDERERS[skillId];
  if (!render) {
    return fallback ? (
      <span className={`inline-flex items-center justify-center leading-none ${className}`} aria-hidden="true">
        {fallback}
      </span>
    ) : null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      data-skill-icon={skillId}
      className={`shrink-0 select-none ${className}`}
    >
      {render()}
    </svg>
  );
}
