# Spec — Wire Recipe Engine into a Playable Quiz Screen (behind `useRecipeEngine`)

**Goal:** The first moment Tinku Math is *playable* on the new engine. A child opens the app, gets real recipe-generated questions for a real skill, answers them, sees Tinku react, and finishes a short session. All behind the `useRecipeEngine` flag so the legacy path stays intact for instant rollback.

**Scope discipline:** This is the thin playable loop ONLY. NOT in scope: mastery persistence, spaced repetition, Firestore, auth, parent dashboard, paywall, daily limit. Those come after the first kid-test. Build the smallest thing a 6-year-old can actually play and learn from.

**Migration posture:** This is the first real strangler-fig cut — new engine feeding a screen. Legacy quiz path remains untouched and reachable with the flag off. Plan-mode, one screen, reversible.

---

## What "playable loop" means (the minimum)

```
Pick a ready skill  →  generate a session of questions (recipe)
   →  show question + options + Tinku (thinking)
   →  child answers
        ├─ correct → Tinku celebrates, advance
        └─ wrong   → REMEDIATION LADDER (hint → retry → mood floor)
   →  after N questions → session-end celebration (Tinku) → back to start
```

Two things make this a *teaching* loop, not a quiz toy — both must be in this build:
1. **Tinku reacts** (you have 6 poses; wire correct/wrong/thinking/celebrate).
2. **The remediation ladder** (wrong answers teach, never just mark red).

---

## Pieces to build

### 1. `session-lite` — a minimal session builder (`src/engine/sessionLite.js`)

Not the full composer (that's later). Just enough to produce a playable set:

```js
// Picks a ready skill and generates a short question set.
// NO mastery input yet (no persistence) — uses skill map + recipes only.

export function buildLiteSession(grade, rng, { length = 8 } = {}) {
  // 1. find ready skills for this grade from skillMap (status:'ready')
  // 2. pick one (for now: first ready skill, or random among ready — simple)
  // 3. load its recipe, generate `length` questions across difficulty 1..maxDifficulty
  //    (ramp difficulty: start at 1, climb as questions go — simple linear ramp)
  // 4. return { skillId, skillName, questions: [ {…contract output…}, … ] }
}
```

- Pure function (engine layer, no React/Firebase). Testable.
- Difficulty ramp: simple — e.g. first third at diff 1, middle at 2, last third at 3 (clamped to maxDifficulty). No adaptivity yet.
- Reads `status:'ready'` from skillMap so it only ever serves built skills (honors the status gate the skill-map helpers deliberately left to this layer).

### 2. `useQuizSession` hook (`src/hooks/useQuizSession.js`)

React orchestration of one session — the state machine the screen renders:

```js
// State: current question index, current question, attempt count on this question,
//        tinkuEmotion, hintVisible, sessionComplete, score.
// Actions: answer(optionIndex), nextQuestion, restart.
// Implements the remediation ladder (see §3) and emits the right Tinku emotion.
```

- Calls `buildLiteSession` on mount (seeded rng — for now a fresh seed each session so questions vary).
- Holds all session state in React state (NO localStorage, NO Firestore — STANDARDS §2).
- Exposes a clean interface the screen just renders; screen has no logic.

### 3. The remediation ladder (inside the hook) — DECISIONS "never punish"

```
answer(i):
  if correct:
     tinku = 'celebrate'; score++; brief pause; → nextQuestion
  else (wrong):
     attempt 1:  tinku = 'encourage'
                 show HINT for the chosen distractor's misconception tag
                 (look up tag → hint from misconceptions-reference data)
                 stay on same question, let them retry
     attempt 2:  tinku = 'encourage'
                 reveal the correct answer gently ("Here's how — let's see!")
                 highlight correct option, then → nextQuestion (no penalty)
  // MOOD FLOOR: a session never ends on a failure.
  // For this lite build: the session-end screen is always celebratory
  // regardless of score (Tinku celebrates effort). Full "guaranteed-win
  // last question" logic deferred — note it as a TODO.
```

- **Hints come from the misconception tags.** The recipe output already carries `misconceptions[]` index-aligned with `options`. When the child taps option `i`, read `misconceptions[i]` → look up the hint. **Hint source:** a small lookup (`src/engine/hints.js`) mapping tag → hint string, seeded from `misconceptions-reference.md`. (For this build, include hints for the tags the 4 ready recipes actually emit: counting, addition, subtraction, compare tags. Not all 68 — just what's reachable now.)
- Tinku is NEVER 'sad'/disappointed — only 'encourage' on wrong, 'celebrate' on right (DECISIONS).

### 4. The Tinku component (`src/components/Mascot.jsx`)

If it doesn't exist yet, build the minimal version now (this is also T42/T79):
```jsx
// <Mascot emotion="celebrate" /> → renders the matching Tinku image (flat, light-theme)
// emotions: happy | celebrate | encourage | thinking | sleeping | waving
// CSS pop-in + gentle breathing (transform/opacity only — perf).
// Uses the 6 existing Tinku assets. Light theme (Wonder band).
```
- Drop the 6 cleaned Tinku images into `src/assets/mascot/`.
- This is the first time Tinku appears in the app — high visible impact.

### 5. The quiz screen wiring (behind the flag)

In the existing quiz screen (or a new `RecipeQuizScreen` rendered when the flag is on):
```jsx
import { FLAGS } from '../config/flags';

// When FLAGS.useRecipeEngine is true → render the new RecipeQuizScreen
// (driven by useQuizSession), else → the existing legacy quiz (untouched).
```
- **Do NOT modify the legacy quiz internals.** Branch at the routing/parent level: flag on → new screen, flag off → old screen. Legacy stays a frozen, working fallback.
- New screen renders: `QuestionCard` (question text + the right format — mcq / count-objects / compare), `OptionButton`s, `<Mascot>`, a progress indicator, the hint bubble, and the session-end celebration.
- **Formats:** handle the three the ready recipes emit — `mcq` (number options), `count-objects` (render the glyph × count + numeric options), `compare` (two numbers + operator options). Keep rendering simple; light theme.

### 6. Analytics instrumentation (weave in now — see analytics-plan.md)

Instrument the quiz loop from the first play, so the kid-test and early users generate data. Build a thin wrapper, then log the core events.

- **`src/services/analytics.js`** — a tiny wrapper around Firebase Analytics: `logEvent(name, params)`. Everything calls this, never Firebase directly (swappable, testable, mockable). In dev/test → `console.log` or no-op; in prod → forward to Firebase. Fire-and-forget; never block the UI.
- **Events to log in this build** (names + properties per analytics-plan.md, snake_case, NO PII):
  - `session_start` — `skill_id`, `grade`, `band`
  - `session_complete` — `skill_id`, `questions_total`, `questions_correct`, `duration_sec`
  - `session_abandoned` — `skill_id`, `question_index`, `duration_sec` (on leaving mid-session)
  - `question_answered` — `skill_id`, `difficulty`, `correct`, `misconception_tag` (chosen wrong tag or `none`), `attempt_number`, `time_to_answer_ms`, `format`
  - `hint_shown` — `skill_id`, `misconception_tag`, `difficulty`
  - `play_again` — `skill_id`
- **Child-safety:** behavior only, no names/PII/personal identifiers. No ad-personalization. (Families Policy / DPDP.)
- `question_answered` is the key event — it makes the app a live misconception instrument. Make sure `misconception_tag` is captured correctly from the chosen distractor.

### 7. The flag flip for testing

- Default `useRecipeEngine: false` stays in committed code (legacy is still the shipped default).
- You flip it to `true` **locally** to play/test the new loop on your phone. Document in the PR how to flip it.

---

## What to render (screen contents, light theme, Wonder band)

- **Top:** small progress (e.g. "3 / 8") + Tinku (thinking while solving).
- **Middle:** the question — big, readable. For `count-objects`, show the glyphs to count. For `compare`, show the two numbers with a gap/box for the operator.
- **Options:** large tap targets (kid fingers), 3–4 buttons. On answer: correct → green + Tinku celebrate; wrong → gentle, hint bubble appears, Tinku encourage.
- **Hint bubble:** Tinku says the misconception-specific hint.
- **Session end:** Tinku celebrating, "Great job!", simple summary (e.g. stars = correct count), a "Play again" button. Always celebratory (mood floor).

Keep visuals simple and bright — this is for the kid-test, not the final polish. Don't gold-plate; we tune after watching real kids.

---

## Tests (STANDARDS §3)

- `sessionLite.test.js` — returns only ready skills, correct length, difficulty ramp within ceiling, questions pass the contract shape.
- `useQuizSession` — remediation ladder transitions (correct→advance, wrong#1→hint, wrong#2→reveal+advance), mood floor (ends celebratory), emotion emitted per state. (Test the hook's logic; mock nothing external since there's nothing external yet.)
- Hint lookup — every reachable tag has a hint string.

---

## Verification

- `npm run test:run` green (engine + hook + existing suites).
- **Manual on phone:** flip `useRecipeEngine` true, `npm run dev`, open on phone → play a full session of each ready skill (counting, addition, subtraction, compare). Confirm: questions generate, Tinku reacts, wrong answers show the right hint, session ends celebratory, "play again" works.
- Flag off → legacy quiz still works unchanged.
- `git status` — legacy quiz internals NOT modified; only new files + the flag-branch point + Tinku assets.

---

## Explicitly deferred (do NOT build now)

Mastery tracking/persistence, spaced repetition, Firestore, auth, the full session composer, adaptive difficulty, parent dashboard, paywall, daily limit, sound/haptics, the "guaranteed-win last question," all 68 hints, and the Q4/Q5 analytics events (conversion/engagement beyond the core loop — those land with their features). This build = the thinnest playable + teachable loop, instrumented with the core analytics events (Q1–Q3 from analytics-plan.md), for the kid-test. Note each deferred item as a TODO where relevant.

---

## Why this scope

After this, you can put Tinku Math in front of a real 6-year-old and watch them count, compare, add, and subtract — with Tinku reacting and hints teaching. That kid-test will tell you more than any further building. Everything heavier waits until you've learned from it.
