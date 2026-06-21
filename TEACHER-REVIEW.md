# TEACHER-REVIEW.md — Items needing human primary-math teacher sign-off

The running list of curriculum/pedagogy items that need a **human** primary-math teacher to
review **before launch**. `misconceptions-reference.md` is the canonical tag source, but parts
of it were reconstructed or revised by LLMs (see `llm-review.md`) — a teacher must confirm them.

> How to use: a teacher works through the open items, records the decision, and we then update
> `misconceptions-reference.md` (the source of truth) and any affected recipe + the validator's
> canonical-tag set in one change. Keep this list in sync — close items when signed off.

Legend: ☐ open · ☑ signed off

---

## Open items

### ☐ 1. `regroup-ignored` — invalid reconstructed rule (Subtraction within 20)
- **Problem:** the doc's rule `10 + (ones(a) − b)` for a borrow problem collapses to the
  **correct answer** (e.g. `13 − 5`: `10 + (3 − 5) = 8`, which is exactly `13 − 5`). So it can
  never be a valid distractor as written. The doc example ("13-5 → 18-ish err") doesn't match
  the formula either — the formula was reconstructed from prose and is wrong.
- **Current handling (code):** `subtraction.js` does **not** emit `regroup-ignored`; the
  borrow ones-error is covered by `smaller-from-larger-force` (`10 + |ones(a) − b|`, e.g.
  `13 − 5 → 12`). The tag is intentionally excluded from the validator's canonical-tag set for
  `g1.sub.within20`.
- **Teacher to decide:** either (a) define a *correct, non-colliding* rule for `regroup-ignored`
  (a real borrow error distinct from `smaller-from-larger-force`), or (b) confirm removal of the
  tag. Then update `misconceptions-reference.md` + (if re-added) the recipe + validator set.

### ☐ 2. `g1.num.21-99` — needs misconception tags + a number-recognition format
- **Problem:** the skill `g1.num.21-99` ("Numbers 21–99: read, write, count") is `planned`. It
  cannot reuse the `counting` recipe's `count-objects` format (drawing dozens of objects is
  unworkable), and `misconceptions-reference.md` has **no 21–99 counting tags**.
- **Current handling:** `g1.num.21-99` stays `status:'planned'`; `counting.js` serves only
  `g1.count.1-9` and `g1.count.1-20`.
- **Teacher to decide:** the right question format for 21–99 (e.g. number recognition,
  "what comes next/before", tens-and-ones reading) and the misconception tags + rules for it
  (place-value/skip-count errors at this range). Then we add them to the doc and build the recipe.

### ☐ 3. Cross-LLM review changes still need human sign-off
The Review #1 changes in `llm-review.md` were made by a **second LLM, not a teacher**. Each
needs human confirmation before launch:
- **Collision guards** added to palindrome/zero-prone rules (`digit-subtraction-isolation`,
  `reverse-period-reading`, `multiplication-by-zero-identity`) + the global "no distractor equals
  the correct answer" guard. *(Already honoured by all built recipes — confirmed by audit.)*
- **`exponentiation-confusion` removed**, replaced by `skip-count-misstep` (`ans ± a`) for the
  "16 for 4×3" case (G2 multiplication — not yet built).
- **3 place-value hints rewritten** to conceptual "houses/bundles" language
  (`expanded-concatenation`, `separate-digit-reading`, `double-carry` — G2, not yet built).
- **Parked additions:** fractions (`denominator-magnitude-bias`) and shape orientation
  (`rotation-blindness`) — documented for `planned` skills, not built early.

> Of the above, only the collision-guard changes touch already-built recipes (addition,
> counting, subtraction, compareNumbers); an audit confirmed those four already comply. The rest
> concern `planned` Grade-2 / shape / fraction skills and will be revisited when those recipes
> are built.

---

## Signed off
_(none yet)_

---

## References
- `misconceptions-reference.md` — canonical tag source (review status noted at top).
- `llm-review.md` — the cross-LLM review log this list draws from.
- `DECISIONS.md` — "misconceptions-reference.md is canonical" decision.
