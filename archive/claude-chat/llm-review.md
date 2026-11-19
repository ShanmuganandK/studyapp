# LLM Review Log — misconceptions-reference.md

Record of cross-LLM reviews of the misconceptions reference (a *different* model reviewing our doc, used as a cheap quality pass before the human teacher review). Kept intact so we can trace what changed and why.

---

## Review #1 — (cross-LLM, pre-recipe-factory)

**Reviewer:** a second LLM (not the one that built the doc), prompted to find logic bugs, implausible misconceptions, weak hints, and gaps. Not a substitute for the human teacher review — a free first pass.

### Findings & actions

**Tier 1 — Critical logic bugs (distractor could equal the correct answer). ALL FIXED in the doc + a global collision guard added.**

| # | Finding | Fix applied |
|---|---|---|
| 1 | `smaller-from-larger-force` (G1 sub within-10): `|a-b|` for 8−3 = 5 = correct answer | Restricted to teen-minuend borrow case `10+|ones(a)-b|`; explicitly NOT emitted on single-digit within-10 |
| 2 | `digit-subtraction-isolation`: `swapDigits(44)` = 44 (palindrome) | Guard added: only when `ans % 11 != 0` |
| 3 | `reverse-period-reading`: `reverseDigits(353)` = 353 (palindrome) | Guard added: only when first digit ≠ last digit |
| 4 | `multiplication-by-zero-identity`: 0×0 → 0 = correct | Guard added: only when one factor is 0 AND the other ≠ 0 |
| — | (general) | Added a **global collision guard** note: no distractor may equal the correct answer; collision-prone rules must carry an explicit skip condition. Validator already enforces no-duplicate/correct-present, but rules are now collision-proof by construction. |

**Tier 2 — Pedagogy fixes. ACCEPTED.**

| # | Finding | Fix applied |
|---|---|---|
| 5 | `exponentiation-confusion` (G2 mult) implausible — a 7-8yo answering 16 for 4×3 lost their skip count, didn't square | Removed `exponentiation-confusion`; covered by `skip-count-misstep` (`ans ± a`) which is the real behavior |
| 6 | Hint `expanded-concatenation` too dense | Rewritten to "thousands family / hundreds-tens-ones house" conceptual language |
| 7 | Hint `double-carry` confusing | Rewritten: "You made a new ten! Add it only to the tens column, not the ones." |
| 8 | Hint `separate-digit-reading` mechanical ("drop the zero") | Rewritten: "...the 2 ones take the zero's place to make 42!" (conceptual) |

**Tier 3 — Gaps. ADDED as PARKED (for planned skills, not built early).**

| # | Finding | Action |
|---|---|---|
| 9 | Fractions: `denominator-magnitude-bias` (1/4 > 1/2 because 4>2) | Added under PARKED → Fractions (G2), for when fractions recipe is built |
| 10 | Shape orientation: rotated square called "diamond" (`rotation-blindness`) | Added under PARKED → Shape orientation (G1 `g1.shapes.2d`) |

**Tier 4 — Confirmations (no action, reassurance).**
- ₹/paise usage correct for Indian context.
- Tags align with Indian teacher vocabulary (`haasil`/carry, `udhaar`/borrow).
- `add-tens-to-ones` validated as a real, accurate misconception.
- Reviewer asked whether we log which tags a student triggers over time → **yes, already designed**: `question_answered` event carries `misconception_tag` (see `analytics-plan.md`).

### Reviewer's "must-fix before shipping" (all addressed)
1. Prevent correct-answer collisions on palindromes/zeros → **done** (guards #1–4 + global note).
2. Rewrite G2 place-value hints to conceptual "houses" → **done** (#6, #8).
3. Remove `exponentiation-confusion`, use skip-count tracking error → **done** (#5).

### Still open (carried to human teacher review)
- These changes were made by an LLM, not a teacher — the human primary-math review still happens before launch.
- Plus the pre-existing flagged items: `regroup-ignored` rule (invalid as reconstructed), `g1.num.21-99` tags + number-recognition format.
- All tracked in `TEACHER-REVIEW.md`.

---

*(Future cross-LLM reviews append below.)*
