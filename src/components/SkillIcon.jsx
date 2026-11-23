/**
 * SkillIcon — Kid-First Tinku-World v2 SVG medallions for all 36 ready skills (DS-6).
 *
 * Designed for 6–8 year olds first:
 *   - Concrete storybook objects & playful characters over abstract math diagrams
 *   - Chunky dark-ink outlines (strokeWidth 2–2.4, rounded caps/joins), soft ground shadows,
 *     inner bevels & glossy specular glints echoing Tinku's own illustration style
 *   - Fills from the illustration palette (--color-illo-*), never the semantic UI colours
 *   - Zero raw hex literals, zero <defs> IDs (safe for duplicate renders on ParentDashboard),
 *     zero countable ⭐ stars, and a single default component export (zero lint warnings)
 *
 * @param {string} skillId - skill ID from skillMap.js
 * @param {string} [fallback] - optional fallback if an unknown/planned skillId is passed
 * @param {number} [size=34] - pixel width/height
 * @param {string} [className]
 */

// Structure (outlines, card fills) follows the theme like the rest of the UI. Every FILL colour comes from
// the illustration palette, never from a semantic token: amber = reward, green = correct, coral = wrong,
// sky = hint and teal = review are UI meanings (AGENTS.md §4), and an icon must not borrow one. Guarded
// by SkillIcon.test.jsx.
const C = {
  bg: 'var(--color-bg)',
  card: 'var(--color-bg-card)',
  primary: 'var(--color-primary)',
  primarySoft: 'var(--color-primary-soft)',
  primaryInk: 'var(--color-primary-ink)',
  ink: 'var(--color-ink)',
  muted: 'var(--color-muted)',
  sun: 'var(--color-illo-sun)',
  sunSoft: 'var(--color-illo-sun-soft)',
  leaf: 'var(--color-illo-leaf)',
  leafSoft: 'var(--color-illo-leaf-soft)',
  berry: 'var(--color-illo-berry)',
  berrySoft: 'var(--color-illo-berry-soft)',
  berryInk: 'var(--color-illo-berry-ink)',
  sky: 'var(--color-illo-sky)',
  skySoft: 'var(--color-illo-sky-soft)',
  skyInk: 'var(--color-illo-sky-ink)',
};

const RENDERERS = {
  // ── Grade 1 ──────────────────────────────────────────────────────────────────
  'g1.count.1-9': () => (
    <>
      <ellipse cx="24" cy="43" rx="16" ry="2.6" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Party hat */}
      <polygon points="16,9 26,28 6,28" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 18l9 2M9.5 23l13 2" stroke={C.berry} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="7.5" r="3" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" />
      {/* 1-2-3 toy blocks */}
      <rect x="21" y="25" width="11" height="11" rx="2.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="33" y="28" width="11" height="11" rx="2.5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="13" y="30" width="11" height="11" rx="2.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
      <text x="18.5" y="38.5" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>1</text>
      <text x="26.5" y="33.5" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>2</text>
      <text x="38.5" y="36.5" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>3</text>
      {/* Confetti dots + spark */}
      <circle cx="33" cy="12" r="2" fill={C.sky} />
      <circle cx="39" cy="19" r="1.8" fill={C.sun} />
      <path d="M29 19l2-2" stroke={C.leaf} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),

  'g1.count.1-20': () => (
    <>
      <ellipse cx="24" cy="43" rx="16" ry="2.6" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Bottom cake tier */}
      <rect x="8" y="27" width="32" height="13" rx="4" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <path d="M8 31c3 3 6 0 8 2.5s5-2.5 8 0 5-2.5 8 0 5 2 8-1.5v-4H8z" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="1.8" strokeLinejoin="round" />
      {/* Top cake tier */}
      <rect x="13" y="17" width="22" height="11" rx="3.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <path d="M13 21c3 2.5 5 0 7.5 2s4.5-2 7 0 4.5 1.5 7.5-1.5V17H13z" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="1.6" strokeLinejoin="round" />
      {/* Candle & 20 topper */}
      <rect x="17" y="6" width="14" height="10" rx="3.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" />
      <text x="24" y="14" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>20</text>
      {/* Sprinkles */}
      <circle cx="15" cy="36" r="1.5" fill={C.sun} />
      <circle cx="24" cy="36" r="1.5" fill={C.leaf} />
      <circle cx="33" cy="36" r="1.5" fill={C.primary} />
      <circle cx="8" cy="14" r="1.7" fill={C.berry} />
      <circle cx="40" cy="15" r="1.7" fill={C.sky} />
    </>
  ),

  'g1.prenum.compare': () => (
    <>
      <ellipse cx="24" cy="43" rx="17" ry="2.5" fill={C.primaryInk} fillOpacity="0.12" />
      {/* 1 big plump watermelon on the left */}
      <circle cx="15" cy="24" r="11" fill={C.leafSoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <circle cx="15" cy="24" r="8" fill={C.berry} stroke={C.primaryInk} strokeWidth="1.6" />
      <ellipse cx="11.5" cy="20" rx="2.2" ry="1.1" transform="rotate(-30 11.5 20)" fill={C.card} fillOpacity="0.8" />
      <circle cx="14" cy="24" r="1" fill={C.primaryInk} />
      <circle cx="17.5" cy="22" r="1" fill={C.primaryInk} />
      <circle cx="17" cy="26.5" r="1" fill={C.primaryInk} />
      {/* 3 cute small berries on the right */}
      {[
        [34, 17],
        [40, 25],
        [33, 31],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="4.3" fill={i === 1 ? C.sky : C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
          <circle cx={cx - 1.3} cy={cy - 1.3} r="1.1" fill={C.card} fillOpacity="0.85" />
        </g>
      ))}
      <path d="M34 11.5c1-1.5 2.5-1.5 3.5 0" fill="none" stroke={C.leaf} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  'g1.num.compare20': () => (
    <>
      <ellipse cx="23" cy="42" rx="16" ry="2.5" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Hungry smiling crocodile snout shaped like > */}
      <path
        d="M6 14c7-3 15-1 22 4l-14 6 14 6c-7 5-15 7-22 4-2-6-2-14 0-20z"
        fill={C.leafSoft}
        stroke={C.primaryInk}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      {/* Crocodile teeth */}
      <polygon points="17,18 20,21 23,19" fill={C.card} stroke={C.primaryInk} strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="17,30 20,27 23,29" fill={C.card} stroke={C.primaryInk} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Eye bump & rosy cheek */}
      <circle cx="13" cy="11.5" r="4.2" fill={C.card} stroke={C.primaryInk} strokeWidth="2" />
      <circle cx="14" cy="11.5" r="1.8" fill={C.primaryInk} />
      <ellipse cx="10.5" cy="24" rx="2.4" ry="1.4" fill={C.berry} fillOpacity="0.7" />
      {/* Big golden snack block it wants to eat */}
      <rect x="31" y="16" width="13" height="16" rx="3.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="2.2" />
      <rect x="33.5" y="18.5" width="4" height="2.2" rx="1" fill={C.card} fillOpacity="0.8" />
    </>
  ),

  'g1.num.ordinal': () => (
    <>
      <ellipse cx="24" cy="43" rx="17" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* 2nd place step */}
      <rect x="6" y="26" width="11" height="14" rx="2.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
      <text x="11.5" y="35.5" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>2</text>
      {/* 1st place center podium */}
      <rect x="18" y="19" width="12" height="21" rx="2.5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <text x="24" y="32" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primaryInk}>1</text>
      {/* 3rd place step */}
      <rect x="31" y="29" width="11" height="11" rx="2.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
      <text x="36.5" y="37" textAnchor="middle" fontSize="8" fontWeight="900" fill={C.primaryInk}>3</text>
      {/* Golden crown on #1 */}
      <path d="M18 16l2-7 4 3.5L28 9l2 7z" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
    </>
  ),

  'g1.add.within10': () => (
    <>
      <ellipse cx="24" cy="43" rx="15" ry="2.5" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Chunky friendly + buddy */}
      <path
        d="M19 8h10v11h11v10H29v11H19V29H8V19h11z"
        fill={C.leafSoft}
        stroke={C.primaryInk}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M21 11h6v3h-6z" fill={C.card} fillOpacity="0.7" />
      {/* Cute face inside + */}
      <circle cx="21" cy="23" r="1.5" fill={C.primaryInk} />
      <circle cx="27" cy="23" r="1.5" fill={C.primaryInk} />
      <path d="M22 26c1.2 1.4 2.8 1.4 4 0" fill="none" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="18.5" cy="25.5" rx="1.7" ry="1" fill={C.berry} fillOpacity="0.7" />
      <ellipse cx="29.5" cy="25.5" rx="1.7" ry="1" fill={C.berry} fillOpacity="0.7" />
      {/* Two hopping toy balls */}
      <circle cx="10" cy="11" r="3.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.8" />
      <circle cx="38" cy="36" r="3.5" fill={C.sky} stroke={C.primaryInk} strokeWidth="1.8" />
    </>
  ),

  'g1.add.within20': () => (
    <>
      {/* Flame trail */}
      <path d="M12 37l-4 5 7-2M17 39l-1 5 5-4" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.8" strokeLinejoin="round" />
      {/* Fins */}
      <path d="M14 27l-6 4 4 4 7-4M30 27l6 4-4 4-7-4" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      {/* Rocket body */}
      <path
        d="M24 6c7 5 9 13 8 24H16c-1-11 1-19 8-24z"
        fill={C.primarySoft}
        stroke={C.primaryInk}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      {/* Nose cone */}
      <path d="M24 6c3.8 2.8 6 6.8 7 11H17c1-4.2 3.2-8.2 7-11z" fill={C.sky} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      {/* + Porthole window */}
      <circle cx="24" cy="23.5" r="5.5" fill={C.card} stroke={C.primaryInk} strokeWidth="2" />
      <path d="M24 20.5v6M21 23.5h6" stroke={C.leaf} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),

  'g1.sub.within10': () => (
    <>
      {/* String & floating coral balloon */}
      <path d="M16 30c-2 4 2 7 0 12" fill="none" stroke={C.primaryInk} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="16" cy="18" rx="9" ry="11" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2.3" />
      <polygon points="14,29 18,29 16,31.5" fill={C.berry} stroke={C.primaryInk} strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="12.5" cy="14" rx="2.2" ry="3.6" transform="rotate(-20 12.5 14)" fill={C.card} fillOpacity="0.8" />
      {/* Comic POP starburst */}
      <polygon
        points="35,9 37,15 43,14 39,19 43,24 37,23 35,29 33,23 27,24 31,19 27,14 33,15"
        fill={C.sun}
        stroke={C.primaryInk}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="19" r="2" fill={C.card} />
      <circle cx="40" cy="33" r="1.8" fill={C.sky} />
    </>
  ),

  'g1.sub.within20': () => (
    <>
      <path d="M14 26v13M24 22v17M34 27v12" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="14" cy="17" rx="7" ry="8.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.1" />
      <ellipse cx="34" cy="18" rx="7" ry="8.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.1" />
      <ellipse cx="24" cy="13.5" rx="7.5" ry="9" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <ellipse cx="21" cy="10" rx="1.8" ry="2.8" transform="rotate(-20 21 10)" fill={C.card} fillOpacity="0.8" />
      {/* Chunky minus badge */}
      <rect x="26" y="30" width="16" height="11" rx="4" fill={C.card} stroke={C.primaryInk} strokeWidth="2.2" />
      <path d="M30 35.5h8" stroke={C.berryInk} strokeWidth="3" strokeLinecap="round" />
    </>
  ),

  'g1.num.21-99': () => (
    <>
      {/* Winding stepping stone path */}
      <path d="M13 36c4-9 18-7 22-21" fill="none" stroke={C.primarySoft} strokeWidth="6" strokeLinecap="round" />
      <rect x="6" y="29" width="16" height="12" rx="4" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.1" />
      <text x="14" y="38" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>21</text>
      <rect x="17" y="18" width="14" height="11" rx="4" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.1" />
      <text x="24" y="26.5" textAnchor="middle" fontSize="8" fontWeight="900" fill={C.primaryInk}>50</text>
      <rect x="26" y="7" width="16" height="12" rx="4" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.1" />
      <text x="34" y="16" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>99</text>
    </>
  ),

  'g1.place.tens-ones': () => (
    <>
      <ellipse cx="24" cy="43" rx="15" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Tied bundle of 10 coloured sticks */}
      <rect x="8" y="10" width="5" height="29" rx="2" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="13" y="8" width="5" height="31" rx="2" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="18" y="10" width="5" height="29" rx="2" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
      {/* Cute ribbon wrap & bow */}
      <rect x="7" y="22" width="17" height="4.5" rx="2" fill={C.berry} stroke={C.primaryInk} strokeWidth="1.8" />
      <circle cx="15.5" cy="24.2" r="2" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.5" />
      {/* 2 loose ones cubes */}
      <rect x="30" y="30" width="9" height="9" rx="2.2" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="30" y="19" width="9" height="9" rx="2.2" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="32" y="21" width="3" height="2" rx="0.8" fill={C.card} fillOpacity="0.8" />
    </>
  ),

  'g1.money.coins': () => (
    <>
      <ellipse cx="24" cy="43" rx="16" ry="2.5" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Back coin */}
      <circle cx="17" cy="27" r="11" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <circle cx="17" cy="27" r="7.5" fill="none" stroke={C.sun} strokeWidth="1.6" strokeDasharray="3 2" />
      <text x="14.5" y="30.5" textAnchor="middle" fontSize="9.5" fontWeight="900" fill={C.primaryInk}>2</text>
      {/* Front gleaming coin */}
      <circle cx="30" cy="21" r="11.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="2.2" />
      <circle cx="30" cy="21" r="8" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="1.5" />
      <text x="30" y="25" textAnchor="middle" fontSize="11.5" fontWeight="900" fill={C.primaryInk}>5</text>
      <path d="M24 13a8 8 0 0 1 6-2.5" fill="none" stroke={C.card} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  'g1.prenum.patterns': () => (
    <>
      {/* Curved caterpillar / necklace string */}
      <path d="M6 26c9 7 27 7 36 0" fill="none" stroke={C.primaryInk} strokeWidth="2.2" strokeLinecap="round" />
      {/* Bead 1: circle with cute eyes */}
      <circle cx="10.5" cy="24" r="6" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
      <circle cx="9" cy="23.5" r="1" fill={C.primaryInk} />
      <circle cx="12" cy="23.5" r="1" fill={C.primaryInk} />
      {/* Bead 2: triangle */}
      <polygon points="21.5,19 27,29 16,29" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      {/* Bead 3: circle */}
      <circle cx="31.5" cy="24" r="5.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
      {/* Mystery ? bead */}
      <circle cx="40.5" cy="20" r="5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" strokeDasharray="2.5 2" />
      <text x="40.5" y="23" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={C.primaryInk}>?</text>
    </>
  ),

  'g1.prenum.sort': () => (
    <>
      <ellipse cx="21" cy="42" rx="14" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Cozy woven basket holding matching stemmed apples */}
      <circle cx="13.5" cy="18.5" r="5" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2" />
      <path d="M13.5 13.5l1.2-2.5" stroke={C.leaf} strokeWidth="2" strokeLinecap="round" />
      <circle cx="23.5" cy="18" r="5" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2" />
      <path d="M23.5 13l1.2-2.5" stroke={C.leaf} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 22h24l-3 16H10z" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M6 22h26" stroke={C.primaryInk} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M12 28h14M13 33h12" stroke={C.sun} strokeWidth="2" strokeLinecap="round" />
      {/* Mismatched geometric triangle bouncing outside */}
      <polygon points="39,14 44.5,24.5 33.5,24.5" fill={C.sky} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <path d="M35 10.5l2-2M42.5 11.5l2-1.5" stroke={C.skyInk} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),

  'g1.shapes.2d': () => (
    <>
      <ellipse cx="24" cy="43" rx="17" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Smiling circle character */}
      <circle cx="16" cy="17" r="9.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <circle cx="13.5" cy="15.5" r="1.2" fill={C.primaryInk} />
      <circle cx="18.5" cy="15.5" r="1.2" fill={C.primaryInk} />
      <path d="M14 18.5c1.2 1.4 2.8 1.4 4 0" fill="none" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
      {/* Friendly square character */}
      <rect x="23" y="21" width="16" height="16" rx="3.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <circle cx="28.5" cy="27.5" r="1.2" fill={C.primaryInk} />
      <circle cx="33.5" cy="27.5" r="1.2" fill={C.primaryInk} />
      <path d="M29 31c1.2 1.2 2.8 1.2 4 0" fill="none" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
      {/* Cheeky peeking triangle */}
      <polygon points="16,22 25,39 7,39" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="14.5" cy="32.5" r="1.1" fill={C.primaryInk} />
      <circle cx="18" cy="32.5" r="1.1" fill={C.primaryInk} />
    </>
  ),

  'g1.shapes.space': () => (
    <>
      <ellipse cx="24" cy="43" rx="15" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Open cardboard toy box with flared side flaps */}
      <polygon points="11,23 6,18 17,18 20,23" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="37,23 42,18 31,18 28,23" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      {/* Smiling toy ball perched playfully on top */}
      <circle cx="24" cy="14" r="7.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="2.2" />
      <circle cx="21.5" cy="13" r="1.2" fill={C.primaryInk} />
      <circle cx="26.5" cy="13" r="1.2" fill={C.primaryInk} />
      <path d="M22 16c1.2 1.2 2.8 1.2 4 0" fill="none" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="11" y="23" width="26" height="17" rx="3" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <path d="M19 30h10" stroke={C.primary} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),

  'g1.measure.length': () => (
    <>
      <ellipse cx="24" cy="42" rx="17" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Sharpened crayon */}
      <rect x="7" y="12" width="23" height="9" rx="2" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <polygon points="30,12 39,16.5 30,21" fill={C.berry} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 12v9M25 12v9" stroke={C.primaryInk} strokeWidth="1.8" />
      {/* 3 studded LEGO-style unit bricks */}
      {[7, 18.5, 30].map((x, idx) => (
        <g key={x}>
          <rect x={x + 2} y="25" width="6" height="3" rx="1" fill={idx === 1 ? C.primary : C.sky} stroke={C.primaryInk} strokeWidth="1.6" />
          <rect x={x} y="27.5" width="10" height="10" rx="2" fill={idx === 1 ? C.primarySoft : C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
        </g>
      ))}
    </>
  ),

  'g1.measure.weight': () => (
    <>
      <ellipse cx="24" cy="43" rx="15" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Seesaw fulcrum */}
      <polygon points="24,27 18,40 30,40" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      {/* Tilted seesaw plank */}
      <path d="M7 29l34-11" stroke={C.primaryInk} strokeWidth="3.5" strokeLinecap="round" />
      {/* Heavy rock/watermelon pushing down left */}
      <circle cx="12" cy="20" r="6.5" fill={C.berry} stroke={C.primaryInk} strokeWidth="2.1" />
      <ellipse cx="10" cy="17.5" rx="1.5" ry="1" fill={C.card} fillOpacity="0.8" />
      {/* Floating light balloon lifted high on right */}
      <ellipse cx="37" cy="11" rx="4.5" ry="5.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
      <path d="M37 16.5v3" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),

  'g1.time.daynight': () => (
    <>
      <ellipse cx="24" cy="43" rx="15" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Half day / half night storybook badge */}
      <circle cx="24" cy="23" r="16" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.3" />
      <path d="M24 7a16 16 0 0 0 0 32z" fill={C.sunSoft} />
      <path d="M24 7v32" stroke={C.primaryInk} strokeWidth="2" />
      {/* Smiling sun on left */}
      <circle cx="16" cy="23" r="5" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.8" />
      <path d="M16 14v2M16 30v2M10 18l1.5 1.5M10 28l1.5-1.5" stroke={C.sun} strokeWidth="2" strokeLinecap="round" />
      {/* Crescent moon + puff cloud on right */}
      <path d="M32 14a5.5 5.5 0 1 0 4 9 4.5 4.5 0 1 1-4-9z" fill={C.primaryInk} />
      <path d="M27 31h10a3 3 0 0 0 0-6 3.5 3.5 0 0 0-6.5-1A2.5 2.5 0 0 0 27 31z" fill={C.card} stroke={C.primaryInk} strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),

  // ── Grade 2 ──────────────────────────────────────────────────────────────────
  'g2.num.3digit': () => (
    <>
      <ellipse cx="24" cy="43" rx="14" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Ribbon tails */}
      <path d="M17 31l-3 10 5-3 3 4 2-10M31 31l3 10-5-3-3 4-2-10" fill={C.sky} stroke={C.primaryInk} strokeWidth="1.9" strokeLinejoin="round" />
      {/* Golden 100 clubhouse medal */}
      <circle cx="24" cy="20" r="14" fill={C.sun} stroke={C.primaryInk} strokeWidth="2.3" />
      <circle cx="24" cy="20" r="10.5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="1.6" />
      <text x="24" y="23.5" textAnchor="middle" fontSize="10.5" fontWeight="900" fill={C.primaryInk}>100</text>
      <circle cx="11" cy="11" r="1.7" fill={C.sun} />
      <circle cx="38" cy="10" r="1.7" fill={C.sky} />
    </>
  ),

  'g2.place.hundreds': () => (
    <>
      <ellipse cx="24" cy="43" rx="18" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Tall Hundreds cottage */}
      <polygon points="5,19 12,10 19,19" fill={C.primary} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <rect x="6" y="19" width="12" height="20" rx="1.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="10" y="30" width="4" height="9" rx="1" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="1.5" />
      <circle cx="12" cy="24" r="2.2" fill={C.card} stroke={C.primaryInk} strokeWidth="1.5" />
      {/* Medium Tens cottage */}
      <polygon points="19,22 25,15 31,22" fill={C.sky} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <rect x="20" y="22" width="10" height="17" rx="1.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="23" y="31" width="4" height="8" rx="1" fill={C.card} stroke={C.primaryInk} strokeWidth="1.5" />
      {/* Small Ones cottage */}
      <polygon points="31,26 36.5,20 42,26" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <rect x="32" y="26" width="9" height="13" rx="1.5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
      <circle cx="36.5" cy="31.5" r="1.8" fill={C.card} stroke={C.primaryInk} strokeWidth="1.4" />
    </>
  ),

  'g2.num.compare999': () => (
    <>
      <ellipse cx="24" cy="43" rx="17" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Tall crowned castle tower */}
      <path d="M7 13h3v-3h2.5v3h3v-3H18v3h3v27H7z" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.1" strokeLinejoin="round" />
      <rect x="12" y="30" width="4" height="10" rx="1.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.6" />
      <circle cx="14" cy="21" r="2.2" fill={C.card} stroke={C.primaryInk} strokeWidth="1.5" />
      {/* Bold > comparison chevron */}
      <path d="M23.5 22l4.5 4-4.5 4" fill="none" stroke={C.sun} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Tiny short turret */}
      <path d="M30 25h3v-2.5h2.5V25h3v-2.5H41V40H30z" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.1" strokeLinejoin="round" />
      <rect x="34" y="32" width="3" height="8" rx="1" fill={C.card} stroke={C.primaryInk} strokeWidth="1.5" />
    </>
  ),

  'g2.add.2d-nocarry': () => (
    <>
      <ellipse cx="24" cy="43" rx="16" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Wooden abacus frame */}
      <rect x="7" y="9" width="32" height="29" rx="5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.3" />
      <rect x="11" y="13" width="24" height="21" rx="2.5" fill={C.card} stroke={C.primaryInk} strokeWidth="1.8" />
      {/* Two bead rods */}
      <path d="M11 19.5h24M11 27.5h24" stroke={C.primaryInk} strokeWidth="1.8" />
      <circle cx="16" cy="19.5" r="3" fill={C.primary} stroke={C.primaryInk} strokeWidth="1.6" />
      <circle cx="22.5" cy="19.5" r="3" fill={C.sky} stroke={C.primaryInk} strokeWidth="1.6" />
      <circle cx="27" cy="27.5" r="3" fill={C.berry} stroke={C.primaryInk} strokeWidth="1.6" />
      <circle cx="17" cy="27.5" r="3" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.6" />
      {/* Friendly green + badge */}
      <circle cx="37" cy="35" r="7.5" fill={C.leafSoft} stroke={C.primaryInk} strokeWidth="2" />
      <path d="M37 31.5v7M33.5 35h7" stroke={C.leaf} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),

  'g2.add.2d-carry': () => (
    <>
      <ellipse cx="24" cy="43" rx="16" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Two houses (Tens & Ones) */}
      <rect x="7" y="21" width="14" height="19" rx="3" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <rect x="27" y="21" width="14" height="19" rx="3" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      {/* Rainbow jump arrow carrying 10 from Ones to Tens */}
      <path d="M34 19c0-10-20-10-20-1" fill="none" stroke={C.leaf} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M10.5 15.5l3.5 4 4-3" fill="none" stroke={C.leaf} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Flying +1 badge at peak */}
      <rect x="19" y="5.5" width="11" height="9" rx="3" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.8" />
      <text x="24.5" y="12.5" textAnchor="middle" fontSize="7.5" fontWeight="900" fill={C.primaryInk}>+1</text>
      <circle cx="14" cy="30.5" r="3" fill={C.primary} />
      <circle cx="34" cy="30.5" r="3" fill={C.skyInk} />
    </>
  ),

  'g2.sub.2d-noborrow': () => (
    <>
      <ellipse cx="21" cy="43" rx="14" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Stack of yummy sprinkle cookies */}
      <ellipse cx="20" cy="35" rx="12" ry="5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.1" />
      <ellipse cx="20" cy="28" rx="12" ry="5" fill={C.sun} stroke={C.primaryInk} strokeWidth="2.1" />
      {/* Top cookie swooshing off */}
      <ellipse cx="28" cy="14" rx="10" ry="4.5" transform="rotate(-14 28 14)" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2.1" />
      <circle cx="26" cy="13.5" r="1.1" fill={C.primaryInk} />
      <circle cx="31" cy="14.5" r="1.1" fill={C.primaryInk} />
      {/* Bold minus badge */}
      <circle cx="36" cy="34" r="7.5" fill={C.card} stroke={C.primaryInk} strokeWidth="2.1" />
      <path d="M32 34h8" stroke={C.berryInk} strokeWidth="2.8" strokeLinecap="round" />
    </>
  ),

  'g2.sub.2d-borrow': () => (
    <>
      <ellipse cx="24" cy="43" rx="16" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Ten gift-box opening */}
      <rect x="6" y="21" width="16" height="18" rx="3" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <path d="M14 21v18M6 29h16" stroke={C.berry} strokeWidth="2.5" />
      <path d="M5 17l11-4 1 4-11 4z" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      {/* Trade arrow sending loose cubes to Ones */}
      <path d="M22 14c5-5 12-4 15 2" fill="none" stroke={C.berryInk} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 15l3.5 2 1-4" fill="none" stroke={C.berryInk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Loose unit cubes */}
      <rect x="29" y="23" width="7.5" height="7.5" rx="1.8" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="1.9" />
      <rect x="35" y="31.5" width="7.5" height="7.5" rx="1.8" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="1.9" />
      <rect x="26" y="32" width="7.5" height="7.5" rx="1.8" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="1.9" />
    </>
  ),

  'g2.money.amounts': () => (
    <>
      <ellipse cx="24" cy="43" rx="16" ry="2.4" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Cute market basket */}
      <path d="M8 21h28l-3 18H11z" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M16 21l3-9M32 21l-3-9" stroke={C.primaryInk} strokeWidth="2.3" strokeLinecap="round" />
      {/* Striped awning rim */}
      <rect x="6" y="18" width="32" height="5" rx="2.5" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2" />
      {/* Shiny golden coins peeking out */}
      <circle cx="19" cy="14" r="4.8" fill={C.sun} stroke={C.primaryInk} strokeWidth="1.9" />
      <circle cx="27" cy="14.5" r="4.8" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="1.9" />
      {/* Hanging price tag */}
      <polygon points="32,27 42,27 42,35 37,39 32,35" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="37" cy="31" r="1.4" fill={C.primaryInk} />
    </>
  ),

  'g2.mul.intro': () => (
    <>
      <ellipse cx="24" cy="43" rx="17" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* 3 cozy little bowls each holding 2 glossy berries */}
      {[
        [13, 32],
        [35, 32],
        [24, 17],
      ].map(([cx, cy], idx) => (
        <g key={idx}>
          <circle cx={cx - 3.2} cy={cy - 3.5} r="3.4" fill={idx === 2 ? C.berry : C.sun} stroke={C.primaryInk} strokeWidth="1.8" />
          <circle cx={cx + 3.2} cy={cy - 3.5} r="3.4" fill={idx === 2 ? C.berry : C.sun} stroke={C.primaryInk} strokeWidth="1.8" />
          <path
            d={`M${cx - 8} ${cy - 1}h16a8 7 0 0 1-16 0z`}
            fill={idx === 0 ? C.skySoft : idx === 1 ? C.primarySoft : C.leafSoft}
            stroke={C.primaryInk}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </>
  ),

  'g2.mul.table2': () => (
    <>
      <ellipse cx="24" cy="43" rx="14" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Playful twin cherry stems + cherries crowning the ×2 badge */}
      <path d="M18 15c2-6 5-8 6-9 1 1 4 3 6 9" fill="none" stroke={C.leaf} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="15" r="4.5" fill={C.berry} stroke={C.primaryInk} strokeWidth="2" />
      <circle cx="31" cy="15" r="4.5" fill={C.berry} stroke={C.primaryInk} strokeWidth="2" />
      <circle cx="15.5" cy="13.5" r="1.2" fill={C.card} fillOpacity="0.85" />
      <circle cx="29.5" cy="13.5" r="1.2" fill={C.card} fillOpacity="0.85" />
      {/* Rounded ×2 shield */}
      <rect x="9" y="19" width="30" height="21" rx="7" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <text x="24" y="34" textAnchor="middle" fontSize="14.5" fontWeight="900" fill={C.primaryInk}>×2</text>
    </>
  ),

  'g2.mul.table5': () => (
    <>
      <ellipse cx="24" cy="43" rx="14" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Friendly waving 5-finger high-five glove silhouette behind golden ×5 badge */}
      <path
        d="M13 24l-2-9a2.2 2.2 0 0 1 4.2-1l1.8 6 1-10a2.2 2.2 0 0 1 4.3.2l.5 8.8 1.5-9.5a2.2 2.2 0 0 1 4.3.5l-.4 9.5 2.5-7a2.2 2.2 0 0 1 4 1.6l-2.5 8.5 3-3a2.1 2.1 0 0 1 3 3l-5 6.5z"
        fill={C.sun}
        stroke={C.primaryInk}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="9" y="21" width="30" height="20" rx="7" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <text x="24" y="35.5" textAnchor="middle" fontSize="14.5" fontWeight="900" fill={C.primaryInk}>×5</text>
    </>
  ),

  'g2.mul.table10': () => (
    <>
      <ellipse cx="24" cy="43" rx="15" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Gleaming coin crown + crisp ×10 badge */}
      <rect x="13" y="8" width="22" height="8" rx="3.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" />
      <rect x="16" y="10.5" width="7" height="2" rx="1" fill={C.card} fillOpacity="0.8" />
      <rect x="8" y="17" width="32" height="23" rx="7" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2.2" />
      <text x="24" y="33.5" textAnchor="middle" fontSize="14" fontWeight="900" fill={C.primaryInk}>×10</text>
    </>
  ),

  'g2.frac.halves-quarters': () => (
    <>
      <ellipse cx="23" cy="43" rx="15" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Pizza 3/4 base */}
      <path d="M22 24V9a15 15 0 1 0 15 15z" fill={C.sun} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M22 24V12.5A11.5 11.5 0 1 0 33.5 24z" fill={C.sunSoft} />
      <path d="M22 24v15M22 24H7" stroke={C.primaryInk} strokeWidth="1.8" />
      {/* Pepperoni dots */}
      <circle cx="16" cy="18" r="1.8" fill={C.berry} />
      <circle cx="15" cy="30" r="1.8" fill={C.berry} />
      <circle cx="26" cy="31" r="1.8" fill={C.berry} />
      {/* Quarter slice pulled joyfully outward */}
      <path d="M26.5 20V6.5a13.5 13.5 0 0 1 13.5 13.5z" fill={C.berrySoft} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="32" cy="14" r="1.8" fill={C.berryInk} />
    </>
  ),

  'g2.measure.length-std': () => (
    <>
      <ellipse cx="24" cy="41" rx="16" ry="2.2" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Cute wooden school ruler */}
      <rect x="6" y="21" width="36" height="14" rx="3.5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2.2" />
      {[12, 18, 24, 30, 36].map((x, idx) => (
        <path
          key={x}
          d={`M${x} 21v${idx % 2 === 0 ? 7 : 4.5}`}
          stroke={C.primaryInk}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
      {/* Cute little smiling inchworm crawling along top */}
      <path d="M12 20c2-6 7-6 9 0 2-6 7-6 9 0" fill="none" stroke={C.leaf} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="31" cy="18.5" r="3.4" fill={C.leafSoft} stroke={C.primaryInk} strokeWidth="1.9" />
      <circle cx="32" cy="18" r="1" fill={C.primaryInk} />
    </>
  ),

  'g2.measure.capacity': () => (
    <>
      <ellipse cx="22" cy="43" rx="14" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Plump glass measuring jug */}
      <path d="M10 13h19l-2 26H12z" fill={C.card} stroke={C.primaryInk} strokeWidth="2.2" strokeLinejoin="round" />
      {/* Wavy sky-blue water fill */}
      <path d="M11.2 25c3-2 6 2 9 0s5.5-2 7.5 0L26.3 39H12.7z" fill={C.sky} />
      {/* Spout & handle */}
      <path d="M10 13l-4 3 4.5 2" fill={C.card} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <path d="M29 17h4.5a4 4 0 0 1 0 8H28" fill="none" stroke={C.primaryInk} strokeWidth="2.2" strokeLinecap="round" />
      {/* Measurement ticks */}
      <path d="M15 20h4M15 28h5M15 33h4" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
      {/* Cute water droplet splash */}
      <path d="M36 9c2.5 3.5 2.5 6 0 6s-2.5-2.5 0-6z" fill={C.sky} stroke={C.primaryInk} strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),

  'g2.time.clock': () => (
    <>
      <ellipse cx="24" cy="43" rx="13" ry="2.2" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Twin-bell alarm clock feet & bells */}
      <path d="M15 37l-3 4M33 37l3 4" stroke={C.primaryInk} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M8 14a5.5 5.5 0 0 1 9-4z" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 14a5.5 5.5 0 0 0-9-4z" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" strokeLinejoin="round" />
      {/* Round clock face */}
      <circle cx="24" cy="24.5" r="14" fill={C.card} stroke={C.primaryInk} strokeWidth="2.4" />
      <circle cx="24" cy="24.5" r="11" fill={C.primarySoft} fillOpacity="0.45" />
      {/* Hands */}
      <path d="M24 24.5v-8M24 24.5l6.5 3.5" stroke={C.primaryInk} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="24" cy="24.5" r="2" fill={C.berry} stroke={C.primaryInk} strokeWidth="1.4" />
      <circle cx="24" cy="13" r="1.2" fill={C.primaryInk} />
      <circle cx="35.5" cy="24.5" r="1.2" fill={C.primaryInk} />
      <circle cx="24" cy="36" r="1.2" fill={C.primaryInk} />
      <circle cx="12.5" cy="24.5" r="1.2" fill={C.primaryInk} />
    </>
  ),

  'g2.data.pictograph': () => (
    <>
      <ellipse cx="24" cy="43" rx="15" ry="2.3" fill={C.primaryInk} fillOpacity="0.12" />
      {/* Mini wooden clipboard easel */}
      <rect x="8" y="10" width="32" height="30" rx="5" fill={C.card} stroke={C.primaryInk} strokeWidth="2.2" />
      <rect x="17" y="6.5" width="14" height="6" rx="2.5" fill={C.sun} stroke={C.primaryInk} strokeWidth="2" />
      {/* Row 1: 3 stemmed apples */}
      {[15, 23, 31].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="20" r="2.8" fill={C.berry} stroke={C.primaryInk} strokeWidth="1.5" />
          <path d={`M${cx} 17l1-1.8`} stroke={C.leaf} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
      {/* Row 2: 2 stemmed berries */}
      {[15, 23].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="28" r="2.8" fill={C.sky} stroke={C.primaryInk} strokeWidth="1.5" />
          <path d={`M${cx} 25l1-1.6`} stroke={C.leaf} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
      {/* Key strip */}
      <rect x="12" y="33.5" width="24" height="3.5" rx="1.7" fill={C.primarySoft} />
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
      viewBox="0 0 48 48"
      aria-hidden="true"
      data-skill-icon={skillId}
      className={`shrink-0 select-none ${className}`}
    >
      {render()}
    </svg>
  );
}
