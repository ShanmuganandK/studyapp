# UI Overhaul — Design Direction (lock this BEFORE touching screens)

**Purpose:** The single source of truth for Tinku Math's visual language. Every screen in the overhaul follows this. Lock it first so all screens feel like ONE designed world, not per-screen improvisation.

**Overhaul ground rules (non-negotiable):**
1. **RESKIN ONLY.** The overhaul touches components/styling — never the engine, hooks, mastery, composer, session logic, or recipes. Logic/presentation separation (STANDARDS §2) is the insurance that kid feedback and legal can't invalidate this work.
2. **QUARANTINE auth/onboarding/consent screens.** Legal (DPDP) may shape those — leave them minimal/as-is until the lawyer answers. Overhaul everything else.
3. **BUILD ON TOKENS.** All colors/spacing/type/radii become named design tokens (Tailwind config / a tokens file) as screens are built. Repeated UI extracts into primitives (Button, Card, etc.) when used 3+ times. This makes future kid-feedback tuning a token change, not a screen hunt.
4. **Fit-one-viewport + performance rules still apply** (STANDARDS §5, docs/responsive.md, docs/images.md). Beauty never breaks fit or low-end Android perf.

---

## The world: "Tinku's Wonder World"

The app is Tinku the elephant's warm, bright, playful world where math is play. Not a worksheet with decoration — a place a 5–8 year old wants to BE. Reference feeling: modern kids' apps (Khan Kids' warmth, Duolingo's juice) but distinctly Tinku's own — Indian-warm, friendly, uncluttered.

### Personality words (test every screen against these)
**Warm. Playful. Encouraging. Clear. Alive.**
(NOT: corporate, dense, babyish-cluttered, dark, competitive.)

### Color — the Wonder palette (tokens)
- **Base/background:** light, airy sky tones (the current bg-sky-50 family) — bright and open, never stark white or dark.
- **Primary:** the friendly indigo/violet family (current brand continuity) for structure, headers, primary text.
- **Action/joy:** a warm accent for celebration and positive moments — amber/gold (already the mastery/reward color — keep that meaning consistent: amber = achievement).
- **Feedback colors:** success green (correct), gentle sky (learning/hints), NEVER harsh red for wrong — wrong is a soft, encouraging tone (muted coral/orange at most), because "never punish."
- **Rule:** stars & amber = rewards/achievement ONLY (locked decision). Countable objects never stars.
- **Review-due** ("come back to this") uses its own token `color.review` (calm teal, distinct from the sky `learn`/"suggests" family) — amber stays reward/achievement-only (locked 2026-07-05).
- Define ALL of these as tokens: `color.bg`, `color.primary`, `color.accent`, `color.success`, `color.encourage`, etc. No raw hex in components.

### Type
- Big, round, friendly. Generous sizes for kid-facing text (readability for early readers), clear hierarchy.
- Kid-facing: large + minimal words. Parent-facing: normal informational sizing.
- Fluid sizing via clamp() per docs/responsive.md. Tokens: `text.question`, `text.option`, `text.title`, etc.

### Shape & depth
- **Soft and rounded everywhere** — generous border radius (cards, buttons, trays). Nothing sharp.
- Soft shadows/elevation for tappable things (buttons feel pressable — slight lift, pressed state squishes). Depth = affordance, used sparingly.
- Big tap targets (min ~48px) — kid fingers.

### Motion (the "alive" part — GPU-safe only: transform/opacity)
- **Micro-delight on every interaction:** buttons squish on press; correct answers pop + burst; Tinku breathes/reacts; screens transition with a gentle slide/fade (not hard cuts).
- **Celebration moments are EVENTS:** session-end gets confetti/stars/Tinku dancing — the reward must feel BIG to a kid.
- Motion is quick (150–300ms) and playful, never sluggish. Respect prefers-reduced-motion.

### Tinku's presence
- Tinku is the host of every kid-facing screen — visible, reacting, alive (the existing 6 poses + breathe/cross-fade system).
- Hints/help come FROM Tinku (speech bubble) — he's the teacher-friend.
- Tinku never scolds; wrong answers get his encourage pose.

### Sound & haptics (already built — the design integrates them)
- The existing sound events pair with the new motion (pop + chime together = juice).

### Parent-facing surfaces (dashboard, parent zone)
- Same palette family but calmer: less motion, more whitespace, informational. Warm-professional, not babyish — a parent should feel "this is a quality product."

---

## Design tokens — starter set (create during Screen 1, grow as needed)
```
bg / bg-card / primary / primary-soft / accent(amber) / success / encourage /
text-primary / text-muted /
radius-card / radius-button /
space-* (consistent spacing scale) /
text-question / text-option / text-title / text-body (fluid clamp values) /
shadow-card / shadow-button
```
Primitives to extract AS THEY REPEAT (not upfront): `<KidButton>`, `<Card>`, `<ScreenShell>`, `HintBubble.jsx`, celebration components.

---

## What "done" looks like for the overhaul
Every kid-facing screen feels like one warm, alive, Tinku-hosted world; every interaction has a touch of delight; celebrations feel like events; parents' surfaces feel calm and premium; all styling flows from tokens; zero logic changed; fit-one-viewport holds on a small phone; low-end Android stays smooth.
