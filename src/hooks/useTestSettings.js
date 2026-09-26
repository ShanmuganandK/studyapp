import { useEffect, useState } from 'react';
import { loadTestSettings, saveTestSettings, THEME_SLUGS } from '../services/testSettings';

/**
 * useTestSettings — React state + side-effects for the parent test panel (theme + grade).
 *
 * Owns the theme/grade preferences (persisted via the `testSettings` seam) AND the single
 * side-effect that ACTUALLY APPLIES a theme: it toggles a `theme-<slug>` class on
 * `document.body`. Body-level — NOT `#root` — is deliberate and load-bearing: `ParentGateModal`
 * renders via `createPortal(document.body)`, so its DOM node is a SIBLING of `#root` and never
 * inherits a `#root`-scoped class. Scoping the theme on `<body>` reaches every surface, portalled
 * ones included (the 2026-08-20 design-system audit finding). `wonder` = no class (the `:root`
 * defaults in index.css).
 *
 * This is where the theme-application logic lives so `ThemeManager` (which manages VIEWS, not
 * colour themes) stays presentational and only wires the hook — keeping logic out of the
 * component per STANDARDS §2.
 *
 * Intended as a SINGLE app-level instance (mounted by ThemeManager). Not built for concurrent
 * instances writing the body class.
 */
export default function useTestSettings() {
  const [{ theme, grade, bridgeEnabled, gradeChosen }, setSettings] = useState(loadTestSettings);

  // Apply the active theme as a scoped class on <body>. Reruns only when `theme` changes.
  useEffect(() => {
    const body = document.body;
    // Clear any theme class we may have set before adding the current one — keeps switching clean
    // and never stacks two palettes.
    THEME_SLUGS.forEach((slug) => body.classList.remove(`theme-${slug}`));
    if (theme !== 'wonder') body.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = (nextTheme) => {
    setSettings((prev) => {
      const next = { ...prev, theme: nextTheme };
      saveTestSettings(next);
      return next;
    });
  };

  const setGrade = (nextGrade) => {
    setSettings((prev) => {
      const next = { ...prev, grade: nextGrade };
      saveTestSettings(next);
      return next;
    });
  };

  const setBridgeEnabled = (nextBridgeEnabled) => {
    setSettings((prev) => {
      const next = { ...prev, bridgeEnabled: nextBridgeEnabled };
      saveTestSettings(next);
      return next;
    });
  };

  // First-run grade picker's ONLY write path (DECISIONS 2026-09-23). Sets grade AND gradeChosen
  // together, atomically — the ordinary parent-zone `setGrade` above deliberately does NOT touch
  // gradeChosen, so switching grades later in the parent zone never re-triggers (or, if already
  // true, never un-suppresses) the picker as a side effect.
  const chooseInitialGrade = (nextGrade) => {
    setSettings((prev) => {
      const next = { ...prev, grade: nextGrade, gradeChosen: true };
      saveTestSettings(next);
      return next;
    });
  };

  return { theme, grade, bridgeEnabled, gradeChosen, setTheme, setGrade, setBridgeEnabled, chooseInitialGrade };
}
