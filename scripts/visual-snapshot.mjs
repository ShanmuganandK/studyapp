#!/usr/bin/env node
/**
 * Visual snapshot tool — ON-DEMAND, manual, NOT wired into CI.
 *
 * Screenshots a handful of representative screens against a real built app (Playwright,
 * `dist/` served via `vite preview`) and byte-compares two labelled captures. Built from the
 * exact ad-hoc workflow used in the 2026-08-20 design-system portability audit (TRACKER) to
 * prove a colour-token refactor was visually invisible.
 *
 * WHY NOT IN CI: there is only one band (Wonder) today, so a committed baseline would just be
 * re-testing "did Wonder change" — already covered by the existing test suite and this repo's
 * own review discipline. Screenshot diffing is also flaky in CI (font/OS rendering drift), and
 * committing baseline PNGs bloats the repo. This tool earns its keep at the moment there is a
 * SECOND thing to compare against — e.g. right before/after a real Explorer-band build, or any
 * refactor of `src/index.css` / `tailwind.config.js` that claims to be visually inert.
 *
 * USAGE
 *   node scripts/visual-snapshot.mjs capture <label>       # build + screenshot, save under .visual-snapshots/<label>/
 *   node scripts/visual-snapshot.mjs diff <labelA> <labelB> # byte-compare two captures, report per screen
 *   node scripts/visual-snapshot.mjs list                   # show saved labels
 *
 * Typical flow around a change:
 *   node scripts/visual-snapshot.mjs capture before
 *   ...make the change...
 *   node scripts/visual-snapshot.mjs capture after
 *   node scripts/visual-snapshot.mjs diff before after
 *   # then open any differing PNGs directly (e.g. via an image viewer, or hand them to an
 *   # agent session to inspect) — this tool flags WHAT changed, a human/agent judges whether
 *   # that's expected.
 *
 * SCREENS CAPTURED (fixed, small, representative — not exhaustive):
 *   01-home              SkillPathScreen — path line, mascot ground, skill-card ring/shadow
 *   02-quiz-question     A quiz question — option-tile shadow/gradient, count-glyph shadow.
 *                         ⚠️ CONTENT IS RANDOM per capture (the recipe seeds fresh each time),
 *                         so this screen will almost always show as "DIFFERS" even with zero
 *                         styling change — open it and eyeball the STYLING, not the content.
 *   03-parent-dashboard  Cards, text, mascot — behind the (ungated, no-passcode) parent zone.
 *   04-parent-gate-modal The "Set a Passcode" modal — a `createPortal(document.body)` surface,
 *                         notable because it sits OUTSIDE #root's DOM subtree (see ARCHITECTURE.md).
 *
 * Captures run with `reducedMotion: 'reduce'` — without it, the mascot's breathe animation and
 * other in-flight transitions land at a different phase every capture and produce a false
 * "DIFFERS", exactly as discovered during the audit this tool was extracted from.
 */

import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_DIR = join(REPO_ROOT, '.visual-snapshots');
const PREVIEW_PORT = 4321;
const BASE_URL = `http://localhost:${PREVIEW_PORT}`;

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Preview server did not respond at ${url} within ${timeoutMs}ms`);
}

async function captureScreens(outDir) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  // eslint-disable-next-line no-undef -- runs inside the BROWSER via page.evaluate, not Node
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(600);

  // 1) Home
  await page.screenshot({ path: join(outDir, '01-home.png') });

  // 2) Quiz question — "Number Party" if present, else the first path node.
  const numberParty = page.locator('button:has-text("Number Party")').first();
  if (await numberParty.count() > 0) {
    await numberParty.click();
  } else {
    await page.locator('button').first().click();
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(outDir, '02-quiz-question.png') });

  // 3) Parent zone → dashboard (ungated, no passcode set on a fresh localStorage)
  await page.click('text=Parent');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, '03-parent-dashboard.png') });

  // 4) Parent gate modal (set-passcode mode) — a createPortal(document.body) surface
  const setBtn = page.locator('button:has-text("Set Parent Passcode")');
  if (await setBtn.count() > 0) {
    await setBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, '04-parent-gate-modal.png') });
  }

  await browser.close();
}

async function cmdCapture(label) {
  if (!label) throw new Error('Usage: node scripts/visual-snapshot.mjs capture <label>');

  console.log('Building...');
  execSync('npm run build', { cwd: REPO_ROOT, stdio: 'inherit' });

  console.log(`Starting preview server on port ${PREVIEW_PORT}...`);
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
    detached: true,
  });

  try {
    await waitForServer(BASE_URL);

    const outDir = join(SNAPSHOT_DIR, label);
    mkdirSync(outDir, { recursive: true });

    console.log('Capturing screens...');
    await captureScreens(outDir);

    const commit = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();
    const dirty = execSync('git status --porcelain', { cwd: REPO_ROOT }).toString().trim().length > 0;
    writeFileSync(
      join(outDir, 'manifest.json'),
      JSON.stringify({ label, capturedAt: new Date().toISOString(), commit, dirty }, null, 2)
    );

    console.log(`✓ Saved to ${outDir}`);
  } finally {
    if (preview.pid) {
      try { process.kill(-preview.pid); } catch { /* already exited */ }
    }
  }
}

function cmdDiff(labelA, labelB) {
  if (!labelA || !labelB) throw new Error('Usage: node scripts/visual-snapshot.mjs diff <labelA> <labelB>');

  const dirA = join(SNAPSHOT_DIR, labelA);
  const dirB = join(SNAPSHOT_DIR, labelB);
  if (!existsSync(dirA)) throw new Error(`No snapshot found for "${labelA}" (expected ${dirA})`);
  if (!existsSync(dirB)) throw new Error(`No snapshot found for "${labelB}" (expected ${dirB})`);

  const filesA = new Set(readdirSync(dirA).filter((f) => f.endsWith('.png')));
  const filesB = new Set(readdirSync(dirB).filter((f) => f.endsWith('.png')));
  const allFiles = [...new Set([...filesA, ...filesB])].sort();

  console.log(`\nComparing "${labelA}" vs "${labelB}":\n`);
  let anyDiffer = false;
  for (const file of allFiles) {
    if (!filesA.has(file)) { console.log(`  ${file}: MISSING in ${labelA}`); anyDiffer = true; continue; }
    if (!filesB.has(file)) { console.log(`  ${file}: MISSING in ${labelB}`); anyDiffer = true; continue; }
    const hashA = sha256(readFileSync(join(dirA, file)));
    const hashB = sha256(readFileSync(join(dirB, file)));
    if (hashA === hashB) {
      console.log(`  ${file}: identical`);
    } else {
      console.log(`  ${file}: DIFFERS — open both and compare:`);
      console.log(`    ${join(dirA, file)}`);
      console.log(`    ${join(dirB, file)}`);
      anyDiffer = true;
    }
  }
  console.log(
    anyDiffer
      ? '\n⚠️  Some screens differ. 02-quiz-question.png differing is EXPECTED (random question content) —\n' +
        '    open it and judge the STYLING, not the content. Any other difference is worth a look.\n'
      : '\n✓ Byte-identical across every captured screen.\n'
  );
}

function cmdList() {
  if (!existsSync(SNAPSHOT_DIR)) { console.log('No snapshots captured yet.'); return; }
  const labels = readdirSync(SNAPSHOT_DIR);
  if (labels.length === 0) { console.log('No snapshots captured yet.'); return; }
  for (const label of labels) {
    const manifestPath = join(SNAPSHOT_DIR, label, 'manifest.json');
    if (existsSync(manifestPath)) {
      const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
      console.log(`  ${label}  (${m.commit}${m.dirty ? '+dirty' : ''}, ${m.capturedAt})`);
    } else {
      console.log(`  ${label}`);
    }
  }
}

const [, , command, ...args] = process.argv;

try {
  if (command === 'capture') await cmdCapture(args[0]);
  else if (command === 'diff') cmdDiff(args[0], args[1]);
  else if (command === 'list') cmdList();
  else {
    console.error('Usage:');
    console.error('  node scripts/visual-snapshot.mjs capture <label>');
    console.error('  node scripts/visual-snapshot.mjs diff <labelA> <labelB>');
    console.error('  node scripts/visual-snapshot.mjs list');
    process.exit(1);
  }
} catch (err) {
  console.error(`\n✖ ${err.message}\n`);
  process.exit(1);
}
