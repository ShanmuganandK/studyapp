/**
 * WonderBackdrop — airy side-margin math illustrations & subtle sky/hill framing behind Hero Tinku
 * on both `GradePickerScreen` and cold-open `SkillPathScreen` (ROADMAP F6, 2026-11-28).
 *
 * Uses `preserveAspectRatio="xMidYMin/Max meet"` so the four Grade 1–2 maths vignettes never get
 * sliced off on tall `915 px` full-screen viewports while keeping the centre completely clear:
 *   - Top-left:     `1 · 2 · 3` blocks with staggered counting pop
 *   - Top-right:    `2 + 3 = 5` card with pulsing answer reveal
 *   - Bottom-left:  `3:00` analogue clock with ticking/sweeping minute hand
 *   - Bottom-right: `cm` ruler & right-triangle set square with gentle angle tilt
 *
 * Strict token & layout invariants:
 *   - Consumes ONLY structural (`--color-bg`, `--color-bg-card`, `--color-primary*`) and
 *     illustration (`--color-illo-*`) CSS variables — zero raw hex, zero locked semantic tokens
 *     (`accent`/`success`/`encourage`/`learn`/`review`), zero 5-point countable `⭐` stars.
 *   - Pure `<svg aria-hidden="true">` with `pointer-events-none` (no `<p>` or `<img>` elements,
 *     preserving `GradePickerScreen` layout measurements in `scripts/check-quiz-layout.mjs`).
 */

const C = {
  bg: 'var(--color-bg)',
  card: 'var(--color-bg-card)',
  primary: 'var(--color-primary)',
  primarySoft: 'var(--color-primary-soft)',
  primaryInk: 'var(--color-primary-ink)',
  sun: 'var(--color-illo-sun)',
  sunSoft: 'var(--color-illo-sun-soft)',
  leaf: 'var(--color-illo-leaf)',
  leafSoft: 'var(--color-illo-leaf-soft)',
  berry: 'var(--color-illo-berry)',
  berrySoft: 'var(--color-illo-berry-soft)',
  sky: 'var(--color-illo-sky)',
  skySoft: 'var(--color-illo-sky-soft)',
};

export default function WonderBackdrop({ className = '', variant = 'card' }) {
  const isSplash = variant === 'splash';
  return (
    <div
      data-testid="wonder-backdrop"
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 ${isSplash ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
    >
      {/* Clouds: spread wide across the upper sky */}
      <svg
        viewBox="0 0 400 110"
        preserveAspectRatio="xMidYMin meet"
        className={`absolute inset-x-0 w-full ${isSplash ? 'top-[3%]' : 'top-2'}`}
      >
        <g className="wonder-cloud-slow">
          <path
            d="M14 68h58a14 14 0 0 0 2-27.8A20 20 0 0 0 36 33a16 16 0 0 0-22 15.2A12 12 0 0 0 14 68z"
            fill={C.card}
            fillOpacity="0.86"
            stroke={C.primarySoft}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
        <g className="wonder-cloud-alt">
          <path
            d="M320 78h62a14 14 0 0 0 2-27.8A20 20 0 0 0 344 43a16 16 0 0 0-24 15.2A12 12 0 0 0 320 78z"
            fill={C.card}
            fillOpacity="0.86"
            stroke={C.primarySoft}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Upper side vignettes: wide in the upper sky (splash) or hugging the card (picker) */}
      <svg
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMin meet"
        className={`absolute inset-x-0 w-full ${isSplash ? 'top-[10%]' : 'top-2'}`}
      >
        {/* 1. Top-Left Side Math Vignette: 1-2-3 Counting Blocks with staggered wave pop */}
        <g className="wonder-float-a">
          <g transform={isSplash ? 'translate(42 122) rotate(-9)' : 'translate(38 142) rotate(-8)'}>
            <g className="wonder-block-1" style={{ transformOrigin: '0px -14px' }}>
              <rect x="-8" y="-22" width="16" height="16" rx="3.5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
              <text x="0" y="-10.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primaryInk}>1</text>
            </g>
            <g className="wonder-block-2" style={{ transformOrigin: '-9px 3px' }}>
              <rect x="-17" y="-5" width="16" height="16" rx="3.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
              <text x="-9" y="6.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primaryInk}>2</text>
            </g>
            <g className="wonder-block-3" style={{ transformOrigin: '9px 3px' }}>
              <rect x="1" y="-5" width="16" height="16" rx="3.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
              <text x="9" y="6.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primaryInk}>3</text>
            </g>
          </g>
        </g>

        {/* 2. Top-Right Side Math Vignette: "2 + 3 = 5" Card with animated "= 5" pop */}
        <g className="wonder-float-b">
          <g transform={isSplash ? 'translate(354 128) rotate(9)' : 'translate(358 148) rotate(8)'}>
            <rect x="-22" y="-18" width="44" height="36" rx="7" fill={C.card} stroke={C.primaryInk} strokeWidth="2" />
            <rect x="-19" y="-15" width="38" height="15" rx="4" fill={C.leafSoft} />
            <text x="0" y="-4" textAnchor="middle" fontSize="10.5" fontWeight="900" fill={C.primaryInk}>2 + 3</text>
            <g className="wonder-eq-ans" style={{ transformOrigin: '0px 9px' }}>
              <text x="0" y="12" textAnchor="middle" fontSize="11" fontWeight="900" fill={C.primary}>= 5</text>
            </g>
          </g>
        </g>
      </svg>

      {/* Lower side vignettes: balanced wide in the lower-middle zone above the hills */}
      <svg
        viewBox="0 0 400 150"
        preserveAspectRatio="xMidYMax meet"
        className={`absolute inset-x-0 w-full ${isSplash ? 'bottom-[21%]' : 'bottom-[11%]'}`}
      >
        {/* 3. Lower-Left Side Math Vignette: Friendly Ticking Analogue Clock */}
        <g className="wonder-float-b">
          <g transform="translate(42 72) rotate(-6)">
            <circle cx="0" cy="0" r="19" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
            <circle cx="0" cy="0" r="14.5" fill={C.card} stroke={C.primarySoft} strokeWidth="1.5" />
            <line x1="0" y1="-12" x2="0" y2="-9.5" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="0" x2="9.5" y2="0" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1="12" x2="0" y2="9.5" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-12" y1="0" x2="-9.5" y2="0" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-8.5"
              stroke={C.primaryInk}
              strokeWidth="2.2"
              strokeLinecap="round"
              className="wonder-clock-min"
            />
            <line x1="0" y1="0" x2="6.5" y2="0" stroke={C.berry} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill={C.primaryInk} />
          </g>
        </g>

        {/* 4. Lower-Right Side Math Vignette: "cm" Ruler & Geometry Set-Square */}
        <g className="wonder-float-a">
          <g transform="translate(356 72) rotate(9)">
            <g className="wonder-ruler-tilt">
              <polygon
                points="-18,14 14,-14 14,14"
                fill={C.skySoft}
                stroke={C.primaryInk}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <rect x="-20" y="4" width="38" height="13" rx="3" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
              <line x1="-12" y1="4" x2="-12" y2="9" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
              <line x1="-4" y1="4" x2="-4" y2="11" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
              <line x1="4" y1="4" x2="4" y2="9" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
              <line x1="12" y1="4" x2="12" y2="11" stroke={C.primaryInk} strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>

      {/* Ground / meadow horizon: richer two-layer rolling hills on full-screen splash, gentle curve on card */}
      {isSplash ? (
        <svg
          viewBox="0 0 400 220"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -bottom-11 w-full h-[calc(25%+44px)]"
        >
          {/* Back pastel ridge */}
          <path
            d="M0 78 C110 24, 240 104, 400 48 L400 220 L0 220 Z"
            fill={C.skySoft}
            fillOpacity="0.6"
          />
          {/* Front soft meadow hill */}
          <path
            d="M0 102 C140 52, 275 112, 400 68 L400 220 L0 220 Z"
            fill={C.leafSoft}
            fillOpacity="0.72"
          />
          <path
            d="M0 102 C140 52, 275 112, 400 68"
            fill="none"
            stroke={C.primarySoft}
            strokeWidth="2.2"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 400 90"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 w-full h-[13%]"
        >
          <path
            d="M0 44 C130 14, 270 68, 400 32 L400 90 L0 90 Z"
            fill={C.leafSoft}
            fillOpacity="0.55"
          />
          <path
            d="M0 44 C130 14, 270 68, 400 32"
            fill="none"
            stroke={C.primarySoft}
            strokeWidth="2"
          />
        </svg>
      )}
    </div>
  );
}
