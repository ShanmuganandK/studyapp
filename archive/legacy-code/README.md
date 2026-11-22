# Archived Legacy & Experimental Code (`archive/legacy-code/`)

> **Status:** Excluded from builds (`vite build`), ESLint (`eslint.config.js`), Vitest (`vitest.config.js`), `lint:hex` (`scripts/check-raw-hex.mjs`), and brand/privacy source scans. Retained here temporarily as a reference until the product matures, at which point this folder can be deleted outright.

## Contents

1. **Retired `?home=cards` Home variant** (superseded by `src/components/SkillPathScreen.jsx`):
   - `src/components/SkillSelectScreen.jsx`
   - `src/components/SkillCard.jsx`
   - `src/components/__tests__/SkillSelectScreen.test.jsx`
   - `src/components/__tests__/SkillCard.test.jsx`
   - `src/components/__tests__/skillStateGrammar.crossview.test.jsx`

2. **Unreachable pre-rewrite legacy modules** (zero live callers in `src/`):
   - `src/data/**` — stored question banks (including legacy `₹` currency items), static CBSE syllabus, and index.
   - `src/components/modules/**` — `VisualAddition.jsx`, `VisualFractions.jsx`.
   - 8 unreachable screens in `src/components/`: `AdventureLadder.jsx`, `Login.jsx`, `PassportDashboard.jsx`, `ProfileSelector.jsx`, `ProfileSetup.jsx`, `QuizEngine.jsx`, `StampCelebration.jsx`, `Syllabus.jsx`.
   - Unused `src/utils/**` — `StampEngine.js`, `masteryEngine.js`, `questionFactory.js`, `randomizer.js`, and `generators/`. (Only `src/utils/logger.js` and its test remain active in `src/utils/`.)
