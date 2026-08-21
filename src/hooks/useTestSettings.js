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
  const [{ theme, grade }, setSettings] = useState(loadTestSettings);

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

  return { theme, grade, setTheme, setGrade };
}
