#!/usr/bin/env node
/**
 * Generate the PUBLIC privacy policy page — `public/privacy.html`.
 *
 * Why generated and not hand-written: the same policy must appear at a public URL (Play
 * requires a linkable policy in the store listing) AND inside the app (Designed-for-Families
 * expects it reachable in-app). Two hand-maintained copies of a legal text drift, and the one
 * that drifts is always the one nobody opens. So the words live in ONE place —
 * `src/config/privacyPolicy.js` — and this script renders the standalone page from them.
 * `src/config/__tests__/privacyPolicy.test.js` fails CI if the committed HTML falls out of sync.
 *
 * The file is generated into `public/` (not `dist/`) on PURPOSE: Vite copies `public/` verbatim,
 * so the page lands in the PWA precache manifest and stays reachable offline — the same
 * guarantee the in-app copy has. Generating into `dist/` after the build would miss the
 * precache.
 *
 * SELF-CONTAINED BY REQUIREMENT. The page states that the app makes no network calls; a policy
 * page that pulls a webfont or a stylesheet from a CDN would contradict itself in the reader's
 * own devtools. No external fonts, no scripts, no images, no analytics — inline CSS and a system
 * font stack only. The sync test asserts this structurally.
 *
 * Raw hex below is deliberate and NOT a token violation: `scripts/check-raw-hex.mjs` scopes to
 * `src/`, and a standalone page outside the React tree cannot consume the app's CSS custom
 * properties. The values are copied from `src/index.css` so the page reads as the same product.
 *
 * Usage:
 *   node scripts/build-privacy-page.mjs           # write public/privacy.html
 *   node scripts/build-privacy-page.mjs --check   # exit 1 if the committed file is stale
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRIVACY_POLICY, linkifyEmailParts } from '../src/config/privacyPolicy.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUTPUT_PATH = join(REPO_ROOT, 'public', 'privacy.html');

/** Minimal HTML text escaping. The source is our own prose, but escape anyway — cheap, total. */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Render one paragraph, turning any contact-email occurrence into a mailto link. */
function renderParagraph(text) {
  const inner = linkifyEmailParts(text, PRIVACY_POLICY.contactEmail)
    .map((part) =>
      part.type === 'email'
        ? `<a href="mailto:${escapeHtml(part.value)}">${escapeHtml(part.value)}</a>`
        : escapeHtml(part.value)
    )
    .join('');

  return `      <p>${inner}</p>`;
}

function renderSection(section) {
  const heading = section.heading ? `      <h2>${escapeHtml(section.heading)}</h2>\n` : '';
  const body = section.paragraphs.map(renderParagraph).join('\n');
  const lede = section.heading ? '' : ' class="lede"';

  return `    <section id="${escapeHtml(section.id)}"${lede}>\n${heading}${body}\n    </section>`;
}

/**
 * Build the complete page.
 * @returns {string} the full HTML document, newline-terminated.
 */
export function renderPrivacyHtml() {
  const { title, lastUpdated, sections } = PRIVACY_POLICY;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(
    `Privacy policy for ${PRIVACY_POLICY.appName}: no accounts, no tracking, progress stays on the device.`
  )}">
  <link rel="icon" href="/favicon.ico">
  <!--
    GENERATED FILE — do not edit by hand.
    Source of truth: src/config/privacyPolicy.js
    Regenerate:     node scripts/build-privacy-page.mjs
    A sync test (src/config/__tests__/privacyPolicy.test.js) fails CI if this drifts.

    Deliberately self-contained: no webfonts, no external CSS, no scripts, no images beyond the
    same-origin favicon. This page claims the app makes no network calls; it must not make any
    of its own.
  -->
  <style>
    :root {
      --bg: #f0f9ff;
      --card: #ffffff;
      --ink: #1e293b;
      --muted: #64748b;
      --heading: #3730a3;
      --rule: #e0e7ff;
      --link: #4f46e5;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem 1.25rem 4rem;
      background: var(--bg);
      color: var(--ink);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 17px;
      line-height: 1.65;
      -webkit-text-size-adjust: 100%;
    }
    main {
      max-width: 40rem;
      margin: 0 auto;
      background: var(--card);
      border-radius: 16px;
      padding: 2rem 1.5rem 2.5rem;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.6rem;
      line-height: 1.25;
      color: var(--heading);
    }
    .updated {
      margin: 0 0 1.75rem;
      color: var(--muted);
      font-size: 0.9rem;
    }
    h2 {
      margin: 2rem 0 0.4rem;
      font-size: 1.05rem;
      color: var(--heading);
    }
    p { margin: 0 0 0.9rem; }
    .lede p {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 0 0 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 2px solid var(--rule);
    }
    a { color: var(--link); }
    a:focus-visible { outline: 3px solid var(--link); outline-offset: 2px; }
    @media (min-width: 40rem) {
      body { padding-top: 3rem; }
      main { padding: 2.5rem 2.5rem 3rem; }
      h1 { font-size: 1.9rem; }
    }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p class="updated">Last updated: ${escapeHtml(lastUpdated)}</p>
${sections.map(renderSection).join('\n')}
  </main>
</body>
</html>
`;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function main() {
  const html = renderPrivacyHtml();
  const check = process.argv.includes('--check');

  if (check) {
    const current = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, 'utf8') : null;
    if (current === html) {
      process.stdout.write('privacy.html is up to date\n');
      return;
    }
    process.stderr.write(
      `public/privacy.html is ${current === null ? 'MISSING' : 'STALE'}.\n` +
        'The policy text changed but the generated page was not rebuilt.\n' +
        'Run: node scripts/build-privacy-page.mjs\n'
    );
    process.exitCode = 1;
    return;
  }

  writeFileSync(OUTPUT_PATH, html, 'utf8');
  process.stdout.write(`wrote ${OUTPUT_PATH}\n`);
}

// Only run as a CLI — importing this module (the sync test does) must have no side effects.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
