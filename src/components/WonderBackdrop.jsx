/**
 * WonderBackdrop — decorative storybook scene behind Hero Tinku on both `GradePickerScreen`
 * and cold-open `SkillPathScreen` (ROADMAP F6, 2026-11-28).
 *
 * Gives 6–8 year olds world depth (puffy drifting clouds, rolling Wonder hills, 4-point diamond
 * sparkles, and playful storybook math blocks/shapes echoing `SkillIcon.jsx`) instead of a flat
 * monochrome rectangle.
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
      {/* Upper sky, clouds, diamond glints & floating math props */}
      <svg
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        {/* Soft sunny aura behind Tinku */}
        <circle cx="200" cy="295" r="155" fill={C.card} fillOpacity="0.55" />
        <circle cx="200" cy="295" r="108" fill={C.card} fillOpacity="0.45" />

        {/* Left storybook cloud */}
        <g className="wonder-cloud-slow">
          <path
            d="M26 112h66a16 16 0 0 0 2-31.8A23 23 0 0 0 50 72a19 19 0 0 0-24 18.2A14 14 0 0 0 26 112z"
            fill={C.card}
            fillOpacity="0.9"
            stroke={C.primarySoft}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>

        {/* Right storybook cloud */}
        <g className="wonder-cloud-alt">
          <path
            d="M298 134h72a17 17 0 0 0 2-33.8A25 25 0 0 0 324 91a20 20 0 0 0-26 19.2A15 15 0 0 0 298 134z"
            fill={C.card}
            fillOpacity="0.88"
            stroke={C.primarySoft}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>

        {/* Floating storybook math prop 1: tilted number cube (top-left margin) */}
        <g transform="translate(46 164) rotate(-14)">
          <rect
            x="-16"
            y="-16"
            width="32"
            height="32"
            rx="7"
            fill={C.sunSoft}
            stroke={C.primaryInk}
            strokeWidth="2.2"
          />
          <rect x="-11" y="-12" width="12" height="3.5" rx="1.7" fill={C.card} fillOpacity="0.85" />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fontSize="16"
            fontWeight="900"
            fill={C.primaryInk}
          >
            123
          </text>
        </g>

        {/* Floating storybook math prop 2: geometric prism & friendly + badge (top-right margin) */}
        <g transform="translate(348 182) rotate(13)">
          <polygon
            points="0,-17 18,14 -18,14"
            fill={C.skySoft}
            stroke={C.primaryInk}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="4" r="3" fill={C.sky} />
        </g>

        {/* Floating storybook math prop 3: mini + tile (lower-left margin) */}
        <g transform="translate(40 398) rotate(10)">
          <path
            d="M-4 -12h8v8h8v8h-8v8h-8v-8h-8v-8h8z"
            fill={C.leafSoft}
            stroke={C.primaryInk}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>

        {/* Floating storybook math prop 4: berry circle gem (lower-right margin) */}
        <g transform="translate(358 392) rotate(-10)">
          <circle
            cx="0"
            cy="0"
            r="12"
            fill={C.berrySoft}
            stroke={C.primaryInk}
            strokeWidth="2"
          />
          <circle cx="-3.5" cy="-3.5" r="3" fill={C.card} fillOpacity="0.85" />
        </g>

        {/* 4-point diamond sparkles (never 5-point countable stars) */}
        <path
          d="M88 128q2 9 11 11-9 2-11 11-2-9-11-11 9-2 11-11z"
          fill={C.sun}
        />
        <path
          d="M314 234q1.6 7.4 9 9-7.4 1.6-9 9-1.6-7.4-9-9 7.4-1.6 9-9z"
          fill={C.sun}
        />
        <path
          d="M64 290q1.5 6.5 8 8-6.5 1.5-8 8-1.5-6.5-8-8 6.5-1.5 8-8z"
          fill={C.card}
        />
        <path
          d="M342 308q1.5 6.5 8 8-6.5 1.5-8 8-1.5-6.5-8-8 6.5-1.5 8-8z"
          fill={C.card}
        />
      </svg>

      {/* Bottom rolling Wonder hills grounding Tinku */}
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 w-full h-[22%]"
      >
        <path
          d="M0 58 C110 18, 250 82, 400 34 L400 120 L0 120 Z"
          fill={C.skySoft}
          fillOpacity="0.72"
        />
        <path
          d="M0 78 C135 42, 275 96, 400 62 L400 120 L0 120 Z"
          fill={C.leafSoft}
          fillOpacity="0.78"
        />
        <path
          d="M0 78 C135 42, 275 96, 400 62"
          fill="none"
          stroke={C.primarySoft}
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
