# Tinku Math — Redesign Hand-off Pack (for Claude Design)

Everything a designer (or Claude Design) needs to redesign the app: product context, **hard constraints**,
the full design system, a screen-by-screen inventory with real screenshots, and a paste-ready prompt.

Screenshots were captured from the **real built app** (390×844 @2x, reduced-motion on) with `capture.mjs`.
Regenerate any time: `npm run build && CHROMIUM_PATH=<chrome> node design-handoff/capture.mjs`.

---

## 1. Product in one paragraph

**Tinku Math** — a CBSE/NCERT maths app for Indian children, **Grades 1–2 at launch** (Grade 3 planned), ages ~5–8.
Mascot is **Tinku**, a flat 2D blue-grey elephant with a glowing math star. A child practises
procedurally generated questions (8 per session, one skill at a time), gets gentle remediation on mistakes
(hint → reveal → bonus), and returns over days via spaced repetition. A gated **parent zone** shows progress.
Success metric = **D7 retention**, not revenue. Delivered as a **PWA** (React 18 + Vite + Tailwind), phone-first,
target = **low-end Android**.

Personality words (test every screen against these): **Warm. Playful. Encouraging. Clear. Alive.**
NOT: corporate, dense, babyish-cluttered, dark (for Wonder band), competitive.

## 2. HARD CONSTRAINTS (a redesign must respect these)

| Constraint | Why |
|---|---|
| **No network at all from the app**: no CDN fonts/images, no analytics, no ads, no accounts, no payments, no cloud | Published privacy policy + CI guards fail the build otherwise |
| **Fonts are self-hosted** (Fontsource: Nunito + Baloo 2). Changing font = new self-hosted package, not a Google Fonts link | Offline-first, low-end Android |
| **Colour semantics are LOCKED**: amber/gold = reward/achievement ONLY · green = correct · **soft coral = wrong (never red, never amber)** · sky = hint/learning · teal = review-due ("come back to this") | Product decision (DECISIONS 2026-07-04/05/15). Themes change the world, not the meaning |
| **Never punish**: no red, no harsh shake, no "wrong!" tone; Tinku never scolds. Session end is always celebratory (mood floor) | Child-safety / retention |
| **Fit one viewport**: question + answers must fit one screen with no scroll at **360×640 and 320×568**; decorative things (mascot) shrink first; answers never leave the screen | `docs/docs-responsive.md` |
| **Animate only `transform`/`opacity`**, 150–300ms, honour `prefers-reduced-motion` | Low-end Android perf |
| **Tap targets ≥ 48px**; big kid-facing type | Small fingers |
| **Images**: resize to display-size×3, WebP; reserve space (no layout shift) | `docs-images.md` |
| **No raw hex in components** — everything goes through CSS-variable tokens → Tailwind utilities (`bg-primary`, `text-ink`, `rounded-card`…). A band/theme override sets the same variables | Enforced by `npm run lint:hex` |
| **Stars/amber are rewards only**; countable objects (🍎🌸🍪) are never stars; "Tinku suggests" is sky, review-due is teal | Colour grammar |
| **Logic untouched**: redesign is *presentation only* (engine, hooks, recipes, mastery are out of scope) | Architecture rule |
| Auth/consent/onboarding beyond the first-run **grade picker** don't exist in MVP — don't design accounts, paywalls, subscriptions, profiles or sharing | Out of MVP scope (DECISIONS 2026-08-14) |
| Product name comes from `src/config/brand.js` (don't hardcode) | Convention |

Open to change: layout, illustration style, iconography (currently emoji), spacing, component shapes, motion
choreography, the nav, home metaphor (path vs cards), parent dashboard, empty/loading/error states,
**a dark "Explorer" band theme for Grades 4–5 (Phase 2, not built)**.

## 3. Design system (current — "Tinku's Wonder World")

Single source of truth: `source/index.css` (tokens + effect layer + keyframes) and `source/tailwind.config.js`.
Machine-readable summary: `tokens.json`.

### Colour (Wonder, light)
| Token | Hex | Use |
|---|---|---|
| `bg` | `#f0f9ff` | airy sky screen background |
| `bg-card` | `#ffffff` | cards, idle tiles, nav, modal |
| `primary` | `#4f46e5` | indigo — structure, CTAs, option text |
| `primary-soft` | `#e0e7ff` | borders, tints, active-nav pill, empty pips |
| `primary-ink` | `#3730a3` | headings, big numbers on light |
| `primary-tint` | `#eef2ff` | gradient endpoint of answer tiles |
| `accent` / `accent-soft` | `#fbbf24` / `#fef3c7` | **reward only** — mastered ring, pips, stars, "N skills mastered" card |
| `success` / `-soft` | `#22c55e` / `#dcfce7` | correct answer |
| `encourage` / `-soft` / `-ink` | `#fb9a7d` / `#ffede6` / `#c2410c` | wrong answer (peachy coral, warm burnt text) |
| `learn` / `-soft` / `-ink` | `#7dd3fc` / `#e0f2fe` / `#0369a1` | hint bubble, "Tinku suggests", current-skill strip |
| `review` | `#14b8a6` | review-due only (teal) |
| `ink` / `muted` | `#1e293b` / `#64748b` | body text / secondary |

Alternate palettes exist as a **parent-zone test instrument only** (not a kid feature, DECISIONS 2026-08-21):
`sunset` (warm orange/plum), `bubblegum` (lilac/purple), `deepsea` (dark navy, inverted `-ink`/`-soft` slots) —
see screenshots `13-theme-*`. A new palette must set **both** the hex and the `-rgb` triple for `primary`, `primary-ink`, `ink`.

### Type
- **Nunito Variable** — body, parent surfaces, question sentence (`text-prompt`, bold).
- **Baloo 2 Variable** — kid-facing display: titles, big numbers/equations, answer tiles (`font-display`).
- Fluid sizes (`clamp`): question `3rem–4.75rem` (9vh), option `1.75–2.25rem`, title `1.6–2.25rem`, prompt `1.15–1.5rem`, body `0.95–1.1rem`.

### Shape, depth, spacing
- Radius: button `1rem`, card `1.5rem`; pills/pips fully round. Everything soft, nothing sharp.
- Shadows: `shadow-button` = layered "pillow" (white inset highlight + 3 soft drops, primary-tinted); `shadow-card`; `shadow-nav`. Static only — never animated.
- Effect utilities: `.kid-tile-idle` (top-lit gradient white→primary-tint), `.count-glyph` (drop-shadow so counted objects sit on the tray), `.kid-num-3d` (soft text-shadow on big numbers), `.tinku-ground` (soft ellipse under Tinku).
- Spacing is Tailwind default scale; screen gutters `px-4`/`px-5`; app shell is full-bleed on phone, 85vh phone-mockup frame ≥640px.

### Motion (all GPU-safe; reduced-motion collapses to static)
Question slide-in 200ms · option stagger 45ms/tile · **correct** = scale-pop 300ms + green + chime · **wrong** = 260ms gentle nudge + coral · hint bubble pop 360ms spring · compare blank fills with operator (`slot-fill`) · screen transition rise+fade 200ms · Tinku breathe 3.2s loop · celebration sequence: Tinku pops → confetti → stars count up → "Great job!" → mastery beat → buttons · suggested path node sonar pulse 1.8s.

### Mascot — Tinku (`mascot/`)
6 transparent WebP poses, cross-faded on emotion change (120ms), preloaded: `Tinku_Mascot` (calm/neutral, **happy**), `Tinku_Happy_2` (celebrate, arms up + confetti), `Tinku_Encourage_2` (thumbs-up — used for wrong answers/hints), `Tinku_Think3` (thinking ?), `Tinku_Sleeping`, `Tinku_Bye` (waving, home/grade picker). Style = flat 2D, blue-grey body, peach inner ears, rosy cheeks, glowing amber star on chest. **Only mascot — no robots, no replacements.**

### Components (source in `source/`)
| Component | Notes |
|---|---|
| `KidButton` | Answer tile, 2-per-row, `clamp(3rem,11vh,5rem)` tall, 4px border, Baloo 2 extrabold; states idle / correct (green, white text) / wrong (coral-soft, coral border, ink text). Answer-tile ONLY — don't reuse for navigation |
| CTA button | `bg-primary text-white font-bold rounded-button shadow-button`, press `scale-95` (used on Celebration / error screens) |
| `HintBubble` | Sky bubble with upward tail pointing at Tinku, `rounded-card`, `border-2 border-learn` |
| `SkillPathScreen` | Default home: zig-zag "journey path" of emoji medallions with name/subtitle/pips; Tinku waves above and stands beside the suggested node |
| `SkillCard` / `SkillSelectScreen` | Alternate home (`/?home=cards`) — card list, A/B in kid-testing |
| `MasteryPips` | 5 dots: indigo = level, amber = mastered, pale = empty |
| `skillStateVisual` | The state grammar: suggested-review (teal ring + "↻ Review time!") > suggested-frontier (sky ring + "Tinku suggests!") > due-not-suggested (neutral ring, muted teal cue) > mastered (amber ring) > idle |
| `CelebrationScreen` + `Confetti` | Session end |
| `Layout` | Bottom nav (Home / Parent, lucide icons, active = primary-soft pill), offline banner, desktop phone frame |
| `ParentGateModal` | 4-digit PIN keypad, portalled; "Forgot passcode?" → adult arithmetic challenge; shake on wrong |
| `ParentDashboard` | Gold "N skills mastered" card, sky "currently working on" strip, grouped skill list (Mastered / In progress / Not started), activity line, passcode actions, parent test panel (theme, grade, warm-up toggle), export/import progress, privacy card |
| `GradePickerScreen` | First-run: "Which class is your child in?" Class 1 / Class 2 / Class 3 (coming soon, disabled) |
| `PrivacyNotice`, `/privacy.html` | Static generated page — has its own minimal styling (see screenshot 14) |

## 4. Screen inventory (screenshots in `screenshots/`)

| # | File | Screen | State / notes |
|---|---|---|---|
| 1 | `01-grade-picker.png` | First-run grade picker | Fresh device. **Observed: content stops ~half-way and a white block fills the bottom — layout is not full-height/bg-filled.** Good redesign target |
| 2 | `02-home-path-fresh.png` | Home — journey path | Nothing played; "Tinku suggests!" on first node, Tinku beside it |
| 3 | `03-home-path-progress.png` | Home — journey path with progress | amber mastered ring+pips, indigo 3-pip in progress, sky suggested ring |
| 4 | `04-home-cards-progress.png` | Home — card list (alt) | |
| 5 | `05-home-path-320x568.png` | Home at smallest supported phone | |
| 6a | `06-quiz-count-question.png` | Quiz — **count-objects** format | Tinku thinking, prompt, tray of emoji objects, 4 options |
| 6b | `06-quiz-compare-question.png` | Quiz — **compare** format | `6 ? 16` with dashed blank, 3 options (<, =, >); correct fills the blank green, wrong-reveal fills sky |
| 6c | `06-quiz-add-question.png` | Quiz — **mcq** (addition) | |
| 7 | `07-quiz-after-first-tap.png`, `08-quiz-hint-or-reveal.png` | Wrong answer → **hint** | Coral tile, Tinku shrinks to encourage pose, sky speech bubble. Ladder: wrong#1 hint → wrong#2 reveal correct + advance → wrong#3 park + bonus question |
| 9 | `09-celebration.png` | Session-end celebration | Always celebratory; 8 stars (filled = correct); Play again (primary) / "Pick another skill" (text link); optional amber mastery-up beat |
| 10 | `10-parent-dashboard-top.png`, `11-parent-dashboard-full.png` | Parent dashboard | Full-page capture shows the entire scroll incl. test panel + passcode + privacy |
| 12 | `12-parent-gate-set-passcode.png` | Parent gate modal (set-PIN mode) | Same modal in verify / forgot-challenge modes |
| 13 | `13-theme-{sunset,bubblegum,deepsea}-home.png` | Alternate palettes on Home | Proves token portability, incl. a dark theme |
| 14 | `14-privacy-page.png` | Static privacy policy page | |

**Not yet captured (describe-only):** Parent gate verify/forgot modes · bridge "Warm-up" and "Bonus" quiz stages (top-bar label replaces "n / 8") · offline banner (sky strip with small Tinku) · mastery-up amber beat on celebration · hint on compare format · success (green) tile state · session-complete when skill mastered.

Navigation map: `GradePicker (once) → Home (path|cards) → Quiz session (8 Qs) → Celebration → Home` · `Home ⇄ Parent (PIN gate) → Dashboard`. Bottom nav has only **Home** and **Parent**.

## 5. Known weaknesses / ideas the redesign could address

- Grade picker layout bug (see #1); it's the only screen that looks unfinished.
- Quiz: large empty void between Tinku/prompt and the tiles on tall phones; question content is small relative to the space.
- Home path: nodes are emoji-only (system emoji render differently per Android vendor) — custom icon set would improve consistency.
- Celebration is spare outside the animation: no progress/skill context, no "next up" suggestion.
- Parent dashboard is a long single column; the test-instrument controls (theme/grade) share it with parent content.
- No loading / error / empty states have bespoke Tinku art (only offline banner).
- Only one band is themed; Explorer (dark, G4–5) is planned but undesigned.
- Mastery pips (5 dots) are the only progress visual — no streaks/XP **by design** (D7 retention via return, not competition; avoid leaderboards/pressure).

## 6. Paste-ready prompt for Claude Design

> I'm redesigning **Tinku Math**, a maths app for Indian children aged 5–8 (CBSE Grades 1–2), delivered as a phone-first PWA. Mascot: Tinku, a flat 2D blue-grey elephant with a glowing amber star (6 poses attached). Personality: warm, playful, encouraging, clear, alive — never corporate, dense or competitive.
>
> Use the attached **design system** (`tokens.json`, `source/index.css`) as the starting point and evolve it: light airy sky background, indigo primary, Baloo 2 for kid-facing numbers/titles, Nunito for body. **Locked colour grammar:** amber = reward only; green = correct; soft coral = wrong (never red); sky = hint/learning; teal = review-due. Wrong answers never punish.
>
> Redesign these screens at 390×844 and verify at 320×568 (core interaction must fit one viewport, no scroll; Tinku shrinks first): (1) first-run grade picker, (2) home — journey path, (3) quiz in three formats — count-objects, compare-with-blank, multiple choice — including idle / correct / wrong+hint states, (4) session-end celebration, (5) parent PIN gate, (6) parent progress dashboard, (7) loading / offline / error states with Tinku. Also propose a dark "Explorer" band theme for Grades 4–5 using the same tokens.
>
> Constraints: no network assets (fonts/images self-hosted), tap targets ≥48px, animations transform/opacity only with reduced-motion fallbacks, everything expressed as named tokens (no one-off colours), presentation only — don't change app logic. No accounts, paywalls, ads, leaderboards or sharing. Current screenshots are attached for reference; improve on them rather than reproduce them. Deliver: updated token set, component specs (answer tile, CTA, card, bubble, nav, pips, modal), and the screens above.

## 7. What to attach when uploading to Claude Design

1. This `README.md` (or §6 prompt + §2 constraints)
2. `tokens.json` + `source/index.css`
3. `screenshots/*.png` (the 01–14 set)
4. `mascot/*.webp`
5. Optionally `docs/ui-overhaul-design-direction.md` (the original reasoning) and `source/*.jsx` (current component markup)

## 8. Repo pointers (for implementation after design)

`CLAUDE.md` → `DECISIONS.md` → `STANDARDS.md` → `ARCHITECTURE.md` (§ "Design tokens & UI-overhaul primitives") → `claude-chat/TRACKER.md`.
Guards that will fail a redesign build if violated: `npm run lint:hex`, `src/__tests__/designTokens.test.js`, `noFirebaseAuth.test.js`, analytics guard, `privacyPolicy.test.js`.
