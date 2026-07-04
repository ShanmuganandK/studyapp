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

### Multi-skill recipes (recipe reuse)

Some skills share one parameterised recipe (the skill map's recipe-reuse note — e.g.
`counting` serves `g1.count.1-9` and `g1.count.1-20`; `subtraction` serves `g1.sub.within10`
and `g1.sub.within20`). Such a recipe exports **`skillIds: [...]`** instead of a single
`skillId`, and `generate` takes a third arg:

```js
generate(difficulty, rng, skillId) { /* pick the range/params from skillId */ }
```

Single-skill recipes keep `skillId` and ignore the third arg. The validator normalises both
(`recipe.skillIds ?? [recipe.skillId]`) and drives generation per served skill. Each served
skill still has its own ceiling and canonical tags — build ONE parameterised recipe, not a
file per skill.

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
| `correctAnswer`  | `number\|string` | The right answer. A number for numeric formats; an operator string (`>`/`<`/`=`) for `compare`. UI stringifies at render. |
| `options`        | `number[]\|string[]` | Choices for option-based formats (see below).            |
| `format`         | `string`   | Render hint / question type. Open, growing taxonomy.           |
| `misconceptions` | `(string\|null)[]` | Index-aligned with `options`; why each wrong choice is wrong. |

### The `format` taxonomy (extensible)

| `format`         | Status   | Render meaning                                                    |
|------------------|----------|-------------------------------------------------------------------|
| `mcq`            | shipping | Plain multiple choice. 4 numeric options.                         |
| `count-objects`  | shipping | Show a set of objects to count; 4 numeric options + `render`.     |
| `compare`        | shipping | Pick the sign: 3 string options `['>','<','=']`; adds `render: { left, right }`. |
| `text-input`     | reserved | Free-response number entry. May omit `options`/`misconceptions`. Renders a blank → the "answer feedback fills the blank" rule applies (see DECISIONS.md, locked 2026-07-04): on correct, the entered value lands in the blank; presentation-only, view-state only; any future blank-bearing format inherits this. |
| `true-false`     | reserved | Two options; uses the standard option-based fields.               |

> Adding a format = add a row here, a recipe that emits it, and (if its shape differs) a
> branch in the validator. Don't repurpose an existing format's meaning.

### Misconceptions encode WHY (the heart of remediation)

Each distractor is a **deliberate** wrong answer tied to a known misconception, so:
- the **remediation ladder** gives a hint targeted at the actual error, and
- the **parent dashboard** can explain *why* a child struggles (not just "got it wrong").

Rules for option-based formats (`mcq`, `count-objects`, `compare`, `true-false`):
- `options` contains the format's fixed choice count, including `correctAnswer`, with **no
  duplicates** (4 for `mcq`/`count-objects`; 3 operators for `compare`).
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

> **Convention:** the question text uses the object **word** ("apples"), never the glyph — an
> embedded countable glyph is indistinguishable from the objects in the tray. The glyph lives
> only in `render` (the countable tray). Never use stars (⭐) as countable objects — stars are
> reserved for rewards.

```js
{
  questionText: 'How many apples are there?',
  correctAnswer: 7,
  options: [7, 8, 6, 9],
  format: 'count-objects',
  misconceptions: [null, 'double-count-object', 'skip-count-sequence', 'random-slip'],
  render: { glyph: '🍎', count: 7 },
}
```

(Tags above are the canonical counting tags from `misconceptions-reference.md`:
`double-count-object` = `7 + 1`, `skip-count-sequence` = `7 - 1` for sets ≥ 6.)

### `compare`
Three operator options; `correctAnswer` is a string. Adds **`render: { left, right }`** so the
UI shows the two numbers around the blank:

```js
{
  questionText: 'Which sign goes in the box?  15 ⬜ 5',
  correctAnswer: '>',
  options: ['<', '>', '='],
  format: 'compare',
  misconceptions: ['alligator-confusion', null, 'ones-digit-bias'],
  render: { left: 15, right: 5 },
}
```

A comparison has only three possible answers, so each question has exactly two wrong operators
(the reverse direction + `=`). Both must stay misconception-backed: `alligator-confusion`
covers the reversed sign; `=` is covered by `ones-digit-bias` (shared ones digit) or
`digit-length-bias` (shared leading digit), so the recipe builds pairs where one of those
holds.

---

## 5. Worked example — `addition` at difficulty 3

Skill `g1.add.within20`, difficulty `3` (sums capped at 20). Say the RNG draws `a = 7`,
`b = 8`, so `sum = 15`. Tags + rules are canonical per `misconceptions-reference.md`.

1. **Build tagged distractors** from the misconceptions whose condition is met (most specific
   first):
   - `crossing-ten-misstep`: the ones carry (`7 + 8 ≥ 10`), so dropping the carried ten gives
     `15 - 10 = 5`.
   - `add-tens-to-ones`: skipped — neither operand is a teen, so this rule doesn't apply.
   - `operator-mixup`: subtracted instead → `|7 - 8| = 1`.
   - `off-by-one`: miscounted the last hop → `15 + 1 = 16`.
2. **Pair each value with its tag** (correct answer's tag is `null`):
   `[{15, null}, {5, 'crossing-ten-misstep'}, {1, 'operator-mixup'}, {16, 'off-by-one'}]`
3. **Shuffle the pairs together** (so options + misconceptions stay aligned), then split:

```js
{
  questionText: '7 + 8 = ?',
  correctAnswer: 15,
  options:        [1,                15,    5,                      16],
  format: 'mcq',
  misconceptions: ['operator-mixup', null, 'crossing-ten-misstep', 'off-by-one'],
}
```

`options[1] === 15 === correctAnswer`, and `misconceptions[1] === null`. A child who taps
`5` reveals `crossing-ten-misstep`, so Tinku can hint about carrying the ten — never just
"wrong".

---

## 6. Checklist before you merge a new recipe

- [ ] Default-exports `{ skillId, maxDifficulty, generate }`.
- [ ] `generate` is pure, uses only the passed `rng`, no UI/Firebase/`Math.random()`.
- [ ] Difficulty is capped at the curriculum ceiling (no out-of-range answers).
- [ ] Distractors encode real misconceptions; tags are kebab-case; correct slot is `null`.
- [ ] `options` has 4 distinct values including the answer (for option-based formats).
- [ ] Added to the validator's recipe table; `npm run test:run` is green.
