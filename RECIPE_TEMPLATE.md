# RECIPE_TEMPLATE.md — The Recipe Contract

> **Core invariant:** Every question in Tinku Math comes from a pure **recipe** function in `src/recipes/` that conforms to this contract. Questions are never stored — one recipe generates unlimited deterministic questions from `(difficulty, rng, skillId)`.
> Every recipe must be registered in `src/engine/sessionLite.js` (`RECIPES`), map every emitted misconception tag in `src/engine/hints.js`, and pass `src/recipes/__tests__/validator.test.js` before merge.

---

## 1. What a Recipe Exports

A recipe file lives in `src/recipes/` and **default-exports a single object**.

### Single-skill recipe
```js
const recipe = {
  skillId: 'g1.add.within20',               // matches src/recipes/skillMap.js
  maxDifficulty: 3,                         // curriculum ceiling: difficulty rungs 1..N
  generate(difficulty, rng) { /* ... */ },  // pure function -> contract output
};
export default recipe;
```

### Multi-skill recipe (parameterised reuse)
Multiple related skills share one parameterised recipe module (currently 8 of 27 modules serve 17 skills — e.g. `counting`, `addition`, `subtraction`, `compareNumbers`, `addition2d`, `subtraction2d`, `mulTable`, `measureLength`). Export **`skillIds: [...]`** instead of `skillId` and accept `skillId` as the third argument:

```js
const recipe = {
  skillIds: ['g1.sub.within10', 'g1.sub.within20'],
  maxDifficulty: 3,
  generate(difficulty, rng, skillId) { /* pick range/params from skillId */ },
};
export default recipe;
```

- **`skillId` / `skillIds`** — stable IDs matching `src/recipes/skillMap.js`. Never reuse an ID for a different concept.
- **`maxDifficulty`** — curriculum ceiling (typically `2` or `3` rungs). Harder ranges belong in a separate skill, not unbounded recursion.
- **`generate(difficulty, rng, skillId)`** — **strictly pure**: same `(difficulty, rng seed, skillId)` always produces identical output. No React, DOM, `localStorage`, network, or `Math.random()`. Always use the seeded `rng` from `src/recipes/_rng.js` (`{ int, pick, shuffle, next }`).

---

## 2. Output Shape (Core Fields)

| Field | Type | Meaning |
|---|---|---|
| `questionText` | `string` | Non-empty prompt shown to the child |
| `correctAnswer` | `number\|string` | Exact right answer (UI stringifies at render) |
| `options` | `(number\|string)[]` | Distinct choices including `correctAnswer` (4 for most formats; 3 operators for `compare`) |
| `format` | `string` | Top-level render format dispatched by `src/components/QuestionView.jsx` |
| `misconceptions` | `(string\|null)[]` | Index-aligned with `options`: `null` for `correctAnswer`, canonical kebab-case tag for each wrong option |
| `render` | `object` *(optional)* | Structured visual payload consumed by `QuestionView.jsx` |

### Misconception & Distractor Rules
- Every wrong option must be a deliberate misconception tag from [`misconceptions-reference.md`](misconceptions-reference.md) (or safe `random-slip` fallback) with a matching kid-friendly hint in `src/engine/hints.js`.
- Use `src/recipes/_plausibility.js` (`selectDistractors()`) for numeric MCQ distractor selection so options stay plausible and deduplicated.
- Shuffle `{ value, tag }` pairs **together** so `options[i]` and `misconceptions[i]` stay aligned.
- Never allow a distractor to equal `correctAnswer`, and never use stars (`⭐`) as countable objects (stars are reserved for rewards).

---

## 3. Shipping `format` Taxonomy (11 Shipping + 2 Reserved)

| `format` | Status | Emitting Module(s) | Render & Option Contract |
|---|---|---|---|
| `mcq` | **shipping** | 19 modules (arithmetic, place value, ordinal, patterns, sorting, timeBasic, moneyAmounts, measureLength std, measureCapacity, etc.) | 4 numeric or string options; optional `render` with one of the 16 `render.kind` sub-archetypes below. |
| `count-objects` | **shipping** | `counting.js` | 4 numeric options; `render: { glyph, count }` (`count === correctAnswer`; question text uses object word, never glyph). |
| `compare` | **shipping** | `compareNumbers.js` | 3 operator options `['<', '>', '=']`; `render: { left, right }`. |
| `unit-length` | **shipping** | `measureLength.js` (`g1.measure.length`) | 4 numeric options; visual non-standard unit-block ruler payload in `render`. |
| `shape-mcq` | **shipping** | `shapes2d.js` | 4 options; SVG 2D shape + rotation payload in `render`. |
| `spatial-mcq` | **shipping** | `spatial.js` | 4 options; SVG spatial landmark/relation scene in `render`. |
| `balance-mcq` | **shipping** | `measureWeight.js` | 4 options; SVG balance-scale pan payload in `render`. |
| `coins-mcq` | **shipping** | `moneyCoins.js` | 4 numeric options; currency-neutral `🪙` coin tray payload in `render`. |
| `clock` | **shipping** | `timeClock.js` | 4 options; SVG analogue clock face (`hour`, `minutes`, optional elapsed offset) in `render`. |
| `pictograph` | **shipping** | `pictograph.js` | 4 numeric options; rows, symbol, and scale key in `render`. |
| `fraction-mcq` | **shipping** | `fractionsBasic.js` | 4 options; SVG partitioned circle/grid/bar fraction tray in `render`. |
| `text-input` | reserved | — | Future blank-bearing free response; inherits the "answer feedback fills the blank" rule. |
| `true-false` | reserved | — | Future 2-option format using standard option/misconception alignment. |

### `mcq` `render.kind` Sub-Archetypes (16 Shipped)
`QuestionView.jsx` renders specialized visual trays for `format: 'mcq'` when `render.kind` is one of:
`ordinal-strip`, `place-houses`, `pattern-strip`, `sorting-tray`, `number-step`, `time-sequence`, `money-add`, `money-change`, `ruler-cm`, `length-add`, `ribbon-compare`, `capacity-jugs`, `capacity-tanks`, `group-compare`, `half-collection`, `fraction-whole`.

> Adding a new `format` or `render.kind` requires updating this table, `src/components/QuestionView.jsx`, `src/recipes/__tests__/validator.test.js`, and `src/components/__tests__/QuestionView.test.jsx`.

---

## 4. Worked Example — `addition` at Difficulty 3

Skill `g1.add.within20`, `difficulty = 3`, operands `a = 7`, `b = 8` (`sum = 15`):

1. Collect triggered misconceptions from `misconceptions-reference.md`: `crossing-ten-misstep` (`5`), `operator-mixup` (`1`), `off-by-one` (`16`).
2. Pair values with tags (`null` for correct answer): `[{15, null}, {5, 'crossing-ten-misstep'}, {1, 'operator-mixup'}, {16, 'off-by-one'}]`.
3. Shuffle pairs together with `rng.shuffle(...)` and split into `options` and `misconceptions`:

```js
{
  questionText: '7 + 8 = ?',
  correctAnswer: 15,
  options:        [1,                15,   5,                      16],
  format: 'mcq',
  misconceptions: ['operator-mixup', null, 'crossing-ten-misstep', 'off-by-one'],
}
```

---

## 5. Checklist Before Merging a Recipe

- [ ] Default-exports `{ skillId, maxDifficulty, generate }` or `{ skillIds, maxDifficulty, generate }`.
- [ ] `generate` is strictly pure and deterministic (uses passed `rng` only; no `Math.random()`, DOM, or storage).
- [ ] Every difficulty rung stays within its curriculum ceiling and produces **>= 8 distinct prompts per rung** (`validateSessionVariety`).
- [ ] Uses `src/recipes/_plausibility.js` (`selectDistractors`) where applicable; options are distinct, include `correctAnswer`, and align 1:1 with `misconceptions`.
- [ ] Every emitted misconception tag exists in [`misconceptions-reference.md`](misconceptions-reference.md), `src/engine/hints.js`, and `src/recipes/__tests__/validator.test.js`.
- [ ] Registered in `src/engine/sessionLite.js` (`RECIPES`) and `src/recipes/skillMap.js` (`status: 'ready'`).
- [ ] Full CI suite (`npm run lint && npm run lint:hex && npm run test:run`) is green.
