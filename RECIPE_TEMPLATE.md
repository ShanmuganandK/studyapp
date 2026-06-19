# RECIPE_TEMPLATE.md — The Recipe Contract

> **This contract is sacred** (STANDARDS §2). Every question in Tinku Math comes from a
> recipe that conforms to it. We never store questions — we store **recipes** (logic that
> *generates* questions). One recipe = infinite questions.
>
> Claude Code builds the first of each kind; **Antigravity replicates the rest by copying a
> reference recipe** (`src/recipes/addition.js`, `src/recipes/counting.js`). Every recipe
> must pass the shared validator (`src/recipes/__tests__/validator.test.js`) before merge.

---

## 1. What a recipe exports

A recipe file lives in `src/recipes/`, one file per skill, and **default-exports a single
object**:

```js
const recipe = {
  skillId: 'g1.add.within20',   // matches the skill map id (string)
  maxDifficulty: 3,             // curriculum ceiling: number of difficulty rungs (1..N)
  generate(difficulty, rng) { /* ... */ }, // pure function -> contract output
};
export default recipe;
```

- **`skillId`** — stable id used by mastery, spaced-rep, and the dashboard. Never reused.
- **`maxDifficulty`** — how many difficulty rungs this skill has (almost always `3`:
  easy / medium / hard).
- **`generate(difficulty, rng)`** — **pure**: same `(difficulty, rng-seed)` → same output.
  No UI, no Firebase, no `Math.random()`, no side effects (STANDARDS §2). It receives:
  - `difficulty` — an integer `1..maxDifficulty`.
  - `rng` — a seeded RNG from `src/recipes/_rng.js` (`makeRng(seed)` → `{ int, pick,
    shuffle, next }`). Always use this for randomness so questions are reproducible/testable.

---

## 2. The difficulty ceiling

Difficulty does **not** climb forever. Each skill has a fixed curriculum ceiling, expressed
as `maxDifficulty` rungs (easy/medium/hard). For `g1.add.within20` the rungs cap the sum at
**5 / 10 / 20**. A child who has mastered hard does not get "difficulty 4" here — **a harder
range is a different skill** (e.g. addition within 100), with its own recipe and `skillId`.

This is why content is "solved forever" and why new grades/boards are cheap later: harder
maths = more recipes, not deeper recursion inside one recipe.

---

## 3. What `generate()` returns — the output shape

The output has **core fields (always present)** plus **optional format-specific fields**.
The contract is designed to be **extensible**: today we ship `mcq` and `count-objects`;
formats like `text-input`, `true-false`, and others are added as the app matures and harder
sections need them — without breaking existing recipes or the validator.

### Core fields (every format)

| Field            | Type       | Meaning                                                        |
|------------------|------------|----------------------------------------------------------------|
| `questionText`   | `string`   | The prompt shown to the child. Non-empty.                      |
| `correctAnswer`  | `number`   | The right answer (a real number — UI stringifies at render).   |
| `options`        | `number[]` | Choices for option-based formats (see below).                  |
| `format`         | `string`   | Render hint / question type. Open, growing taxonomy.           |
| `misconceptions` | `(string\|null)[]` | Index-aligned with `options`; why each wrong choice is wrong. |

### The `format` taxonomy (extensible)

| `format`         | Status   | Render meaning                                                    |
|------------------|----------|-------------------------------------------------------------------|
| `mcq`            | shipping | Plain multiple choice. Core fields only.                          |
| `count-objects`  | shipping | Show a set of objects to count; adds a `render` payload.          |
| `text-input`     | reserved | Free-response number entry. May omit `options`/`misconceptions`.  |
| `true-false`     | reserved | Two options; uses the standard option-based fields.               |

> Adding a format = add a row here, a recipe that emits it, and (if its shape differs) a
> branch in the validator. Don't repurpose an existing format's meaning.

### Misconceptions encode WHY (the heart of remediation)

Each distractor is a **deliberate** wrong answer tied to a known misconception, so:
- the **remediation ladder** gives a hint targeted at the actual error, and
- the **parent dashboard** can explain *why* a child struggles (not just "got it wrong").

Rules for option-based formats (`mcq`, `count-objects`, `true-false`):
- `options` contains exactly **4 choices** (`OPTION_COUNT`), including `correctAnswer`, with
  **no duplicates**.
- `misconceptions` has the **same length** as `options` and is **index-aligned**:
  `misconceptions[i]` is the tag for `options[i]`.
- The **correct** option's slot is **`null`**. Every wrong option's slot is a **non-empty,
  kebab-case** tag (e.g. `forgot-carry`, `off-by-one`, `random-slip`).
- Because options are shuffled, shuffle the `{ value, tag }` pairs **together** so alignment
  survives (see the worked example).

---

## 4. Format-specific payloads

### `mcq`
No extra fields. Just the core fields, with `format: 'mcq'`.

### `count-objects`
Adds an optional **`render`** object so the UI can draw the actual set to count:

```js
render: { glyph: '🍎', count: 7 }   // draw 7 apples
```

- `render.glyph` — the object to repeat (a single emoji/glyph string).
- `render.count` — how many to draw. **Equals `correctAnswer`** — in a counting question the
  visible set *is* the prompt, so showing answer-many objects is intentional and correct.

Example output:

```js
{
  questionText: 'How many 🍎 are there?',
  correctAnswer: 7,
  options: [7, 8, 6, 9],
  format: 'count-objects',
  misconceptions: [null, 'off-by-one', 'miscount-low', 'random-slip'],
  render: { glyph: '🍎', count: 7 },
}
```

---

## 5. Worked example — `addition` at difficulty 3

Skill `g1.add.within20`, difficulty `3` (sums capped at 20). Say the RNG draws `a = 7`,
`b = 8`, so `sum = 15`.

1. **Build tagged distractors** from misconceptions:
   - `forgot-carry`: added units, dropped the tens carry → `15 - 10 = 5`.
   - `counted-extra`: counted one too many → `15 + 1 = 16`.
   - `random-slip`: a plausible nearby miss → `15 - 2 = 13`.
2. **Pair each value with its tag** (correct answer's tag is `null`):
   `[{15, null}, {5, 'forgot-carry'}, {16, 'counted-extra'}, {13, 'random-slip'}]`
3. **Shuffle the pairs together** (so options + misconceptions stay aligned), then split:

```js
{
  questionText: '7 + 8 = ?',
  correctAnswer: 15,
  options:        [16,             15,    5,             13],
  format: 'mcq',
  misconceptions: ['counted-extra', null, 'forgot-carry', 'random-slip'],
}
```

`options[1] === 15 === correctAnswer`, and `misconceptions[1] === null`. A child who taps
`5` reveals `forgot-carry`, so Tinku can hint about carrying the ten — never just "wrong".

---

## 6. Checklist before you merge a new recipe

- [ ] Default-exports `{ skillId, maxDifficulty, generate }`.
- [ ] `generate` is pure, uses only the passed `rng`, no UI/Firebase/`Math.random()`.
- [ ] Difficulty is capped at the curriculum ceiling (no out-of-range answers).
- [ ] Distractors encode real misconceptions; tags are kebab-case; correct slot is `null`.
- [ ] `options` has 4 distinct values including the answer (for option-based formats).
- [ ] Added to the validator's recipe table; `npm run test:run` is green.
