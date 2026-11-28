/**
 * WonderBackdrop — airy side-margin math illustrations & subtle sky/hill framing behind Hero Tinku
 * on both `GradePickerScreen` and cold-open `SkillPathScreen` (ROADMAP F6, 2026-11-28).
 *
 * Uses `preserveAspectRatio="xMidYMid meet"` (anchored to left/right edges via corner viewBoxes)
 * so the four Grade 1–2 maths vignettes (`1·2·3` blocks, `2 + 3 = 5` card, `3:00` clock, and `cm`
 * ruler + set-square) never get sliced off on tall `915 px` full-screen viewports while keeping
 * the centre completely clear around Tinku.
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

export default function WonderBackdrop({ className = '' }) {
  return (
    <div
      data-testid="wonder-backdrop"
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Upper band: corner clouds + Top-Left (1·2·3 blocks) & Top-Right (2+3=5 card) */}
      <svg
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMin meet"
        className="absolute inset-x-0 top-2 w-full"
      >
        <g className="wonder-cloud-slow">
          <path
            d="M18 68h54a13 13 0 0 0 2-25.8A19 19 0 0 0 38 35a15 15 0 0 0-20 14.5A11.5 11.5 0 0 0 18 68z"
            fill={C.card}
            fillOpacity="0.82"
            stroke={C.primarySoft}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
        <g className="wonder-cloud-alt">
          <path
            d="M322 78h58a14 14 0 0 0 2-27.8A20 20 0 0 0 344 43a16 16 0 0 0-22 15.2A12 12 0 0 0 322 78z"
            fill={C.card}
            fillOpacity="0.82"
            stroke={C.primarySoft}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>

        {/* 1. Top-Left Side Math Vignette: 1-2-3 Counting Blocks */}
        <g className="wonder-float-a">
          <g transform="translate(38 142) rotate(-8)">
            <rect x="-8" y="-22" width="16" height="16" rx="3.5" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
            <text x="0" y="-10.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primaryInk}>1</text>
            <rect x="-17" y="-5" width="16" height="16" rx="3.5" fill={C.skySoft} stroke={C.primaryInk} strokeWidth="2" />
            <text x="-9" y="6.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primaryInk}>2</text>
            <rect x="1" y="-5" width="16" height="16" rx="3.5" fill={C.primarySoft} stroke={C.primaryInk} strokeWidth="2" />
            <text x="9" y="6.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={C.primaryInk}>3</text>
          </g>
        </g>

        {/* 2. Top-Right Side Math Vignette: "2 + 3 = 5" Addition Card */}
        <g className="wonder-float-b">
          <g transform="translate(358 148) rotate(8)">
            <rect x="-22" y="-18" width="44" height="36" rx="7" fill={C.card} stroke={C.primaryInk} strokeWidth="2" />
            <rect x="-19" y="-15" width="38" height="15" rx="4" fill={C.leafSoft} />
            <text x="0" y="-4" textAnchor="middle" fontSize="10.5" fontWeight="900" fill={C.primaryInk}>2 + 3</text>
            <text x="0" y="12" textAnchor="middle" fontSize="11" fontWeight="900" fill={C.primary}>= 5</text>
          </g>
        </g>
      </svg>

      {/* Lower band: Bottom-Left (3:00 Clock) & Bottom-Right (cm Ruler + Set-Square) */}
      <svg
        viewBox="0 0 400 150"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-x-0 bottom-[11%] w-full"
      >
        {/* 3. Lower-Left Side Math Vignette: Friendly 3:00 Analogue Clock */}
        <g className="wonder-float-b">
          <g transform="translate(38 72) rotate(-6)">
            <circle cx="0" cy="0" r="19" fill={C.sunSoft} stroke={C.primaryInk} strokeWidth="2" />
            <circle cx="0" cy="0" r="14.5" fill={C.card} stroke={C.primarySoft} strokeWidth="1.5" />
            <line x1="0" y1="-12" x2="0" y2="-9.5" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="12" y1="0" x2="9.5" y2="0" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1="12" x2="0" y2="9.5" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-12" y1="0" x2="-9.5" y2="0" stroke={C.primaryInk} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1="0" x2="0" y2="-8.5" stroke={C.primaryInk} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="0" y1="0" x2="6.5" y2="0" stroke={C.berry} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2" fill={C.primaryInk} />
          </g>
        </g>

        {/* 4. Lower-Right Side Math Vignette: "cm" Ruler & Geometry Set-Square */}
        <g className="wonder-float-a">
          <g transform="translate(360 72) rotate(9)">
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
      </svg>

      {/* Soft low meadow curve at the very bottom */}
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
    </div>
  );
}
