#!/usr/bin/env node
/**
 * Smoke test (TESTING_PLAN.md §2, Level 0): ON-DEMAND, not wired into CI, gates nothing.
 *
 * Drives a DEPLOYED copy of the app in a real browser, the way a parent and child would, and checks the
 * journeys whose failure would cost families at this stage: the app opens, a session can be played to the
 * end, progress is kept, the parent zone works, and the app opens offline (DECISIONS 2026-11-26, testing).
 * Run it after a web deploy and before each Play upload.
 *
 *   npm run smoke                                   # https://tinku.stringus.com
 *   npm run smoke -- --url http://localhost:4173    # e.g. `npm run build && npm run preview`, or a deploy preview
 *   npm run smoke -- --shots .smoke-shots           # also save a screenshot per step
 *
 * Safe on the live site: the app has no server, accounts or analytics, and every step uses a throwaway
 * browser, so a run changes nothing for any family.
 *
 * Exit code 1 if any check fails; each check prints PASS / FAIL with what it saw.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

/* global document, localStorage, sessionStorage, window */

const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const BASE = `${(arg('--url') || 'https://tinku.stringus.com').replace(/\/$/, '')}/`;
const shotsDir = arg('--shots');
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const PHONE = { width: 390, height: 844 };
const FIRST_SKILL = 'Number Party'; // g1.count.1-9, stop 1 of Class 1 on a fresh install
const MAX_TAPS = 150;               // a full session with every wrong answer and hint is far below this

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

let failed = 0;
function check(name, ok, detail = '') {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch();
const consoleErrors = [];

/** A brand-new browser (empty storage). `seed` is written once, on the first load only, so reloads keep what the step changed. */
async function freshPhone(step, seed = null) {
  const ctx = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${step}: ${m.text()}`); });
  page.on('pageerror', (e) => consoleErrors.push(`${step}: ${e}`));
  if (seed) {
    await page.addInitScript((entries) => {
      if (sessionStorage.getItem('smoke:seeded')) return;
      for (const [k, v] of entries) localStorage.setItem(k, v);
      sessionStorage.setItem('smoke:seeded', '1');
    }, Object.entries(seed));
  }
  return { ctx, page };
}

const shot = (page, name) => (shotsDir ? page.screenshot({ path: join(shotsDir, `${name}.png`) }) : null);
const isShown = (locator) => locator.first().isVisible().catch(() => false);

/** Taps answer tiles in turn until each question moves on, until the session summary appears. */
async function playSession(page) {
  const tiles = page.locator('[data-q="answers"] button');
  const counter = () => page.locator('text=/^\\d+ \\/ \\d+$/').first().textContent({ timeout: 1000 }).catch(() => '');
  let taps = 0;
  let t = 0;
  while (taps < MAX_TAPS) {
    if (await isShown(page.getByText('Great job!'))) return { finished: true, taps };
    const n = await tiles.count();
    if (n === 0) { await page.waitForTimeout(400); taps++; continue; }
    const before = await counter();
    await tiles.nth(t % n).click({ timeout: 1500 }).catch(() => {});
    taps++;
    await page.waitForTimeout(1300);
    if ((await counter()) === before) t++; // still the same question: try the next tile
    else t = 0;
  }
  return { finished: await isShown(page.getByText('Great job!')), taps };
}

// ── 1–3. First run → a full session → progress is kept ──────────────────────────────────────────
{
  const { ctx, page } = await freshPhone('first run');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const bundle = await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/index-')) ?? '');
  console.log(`Smoke test against ${BASE} (${bundle.split('/').pop() || 'bundle not found'})\n`);

  check('first run: the class picker shows', await isShown(page.getByText('Which class is your child in?')));
  await shot(page, '1-first-run');
  await page.getByRole('button', { name: /Class 1/ }).first().click();
  await page.waitForTimeout(1000);
  const firstStop = page.getByRole('button', { name: FIRST_SKILL, exact: true });
  check('first run: picking Class 1 opens Home with the skill path', await isShown(firstStop));
  check('first run: Home and Parent tabs show', await isShown(page.getByRole('button', { name: 'Home' })) && await isShown(page.getByRole('button', { name: 'Parent' })));

  await firstStop.click();
  await page.waitForTimeout(1000);
  check('session: a question with answer tiles opens', (await page.locator('[data-q="answers"] button').count()) > 0);
  const played = await playSession(page);
  check('session: plays to the end ("Great job!")', played.finished, `${played.taps} taps`);
  check('session: the bottom bar comes back on the summary', await isShown(page.getByRole('button', { name: 'Parent' })));
  await shot(page, '2-session-done');

  const saved = await page.evaluate(() => ({
    skills: JSON.parse(localStorage.getItem('tinku:v1:skills') ?? '{}').skills ?? {},
    days: JSON.parse(localStorage.getItem('tinku:v1:practiceDays') ?? '{}').days ?? [],
  }));
  const skill = Object.values(saved.skills).find((s) => s.attempts > 0);
  check('progress: the played skill is saved', !!skill, skill ? `${skill.skillId}, ${skill.attempts} attempts` : JSON.stringify(Object.keys(saved.skills)));
  check('progress: today is saved as a practice day', saved.days.length === 1, saved.days.join(', '));

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Parent' }).click();
  await page.waitForTimeout(800);
  const last = await page.getByText(/Last practised:/).first().textContent().catch(() => '');
  check('progress: after a reload, Parent shows "Last practised: today"', /today/.test(last), last);
  const days = await page.getByTestId('practice-days').textContent().catch(() => '');
  check('progress: after a reload, Parent shows "Days practised: 1"', /Days practised:\s*1(?!\d)/.test(days), days);
  await ctx.close();
}

// ── 4. Parent zone (DECISIONS 2026-11-26: Progress / Settings tabs) ─────────────────────────────
{
  const skill = (id, level, misconceptions = {}) => ({ skillId: id, level, difficulty: 2, maxDifficulty: 3, attempts: 12, correct: 9,
    lastSeen: daysAgo(1), nextReview: null, reviewInterval: 0, recentParams: [], misconceptions, difficultyStreak: 0 });
  const { ctx, page } = await freshPhone('parent zone', {
    'tinku:v1:testSettings': JSON.stringify({ version: 1, theme: 'wonder', grade: 1, bridgeEnabled: false, gradeChosen: true }),
    'tinku:v1:skills': JSON.stringify({ version: 1, skills: {
      'g1.count.1-9': skill('g1.count.1-9', 5),
      'g1.count.1-20': skill('g1.count.1-20', 3),
      'g1.add.within20': skill('g1.add.within20', 2, { 'crossing-ten-misstep': 4, 'operator-mixup': 2 }),
    } }),
    'tinku:v1:practiceDays': JSON.stringify({ version: 1, days: [daysAgo(3), daysAgo(1)] }),
  });
  const tabs = () => page.$$eval('[role="tab"]', (ts) => ts.map((t) => `${t.textContent}:${t.getAttribute('aria-selected')}`).join(' '));
  const heading = () => page.locator('h1').first().textContent().catch(() => '');
  const ON_PROGRESS = 'Progress:true Settings:false';
  const ON_SETTINGS = 'Progress:false Settings:true';

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Parent' }).click();
  await page.waitForTimeout(800);
  check('parent: opens on Progress', (await tabs()) === ON_PROGRESS, await tabs());
  check('parent: Progress shows the report (Tinku Noticed, skills)', await isShown(page.getByTestId('tinku-noticed-card')) && (await page.locator('[data-skill-id]').count()) > 0);
  check('parent: no settings on Progress', !(await isShown(page.getByRole('button', { name: /Set Parent Passcode|Export progress/ }))));
  await shot(page, '3-parent-progress');

  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.waitForTimeout(400);
  check('parent: Settings tab and heading', (await tabs()) === ON_SETTINGS && (await heading()) === 'Settings', `${await tabs()} / ${await heading()}`);
  const y = async (locator) => (await locator.first().boundingBox())?.y ?? NaN;
  const order = [
    await y(page.getByRole('button', { name: /Class 2/ })),
    await y(page.getByText('Colours', { exact: true })),
    await y(page.getByText('Parent lock', { exact: true })),
    await y(page.getByText('Progress backup', { exact: true })),
  ];
  check('parent: Settings order is Class, Colours, Parent lock, Progress backup', order.every((v, i) => i === 0 || order[i - 1] < v), order.map(Math.round).join(' < '));
  await shot(page, '4-parent-settings');

  await page.getByRole('button', { name: /Sunset/ }).click();
  await page.waitForTimeout(300);
  check('parent: Colours re-themes the app', await page.evaluate(() => document.body.className.includes('sunset')));
  await page.getByRole('button', { name: /Wonder/ }).click();

  await page.getByRole('button', { name: /Class 2/ }).click();
  await page.getByRole('tab', { name: 'Progress' }).click();
  await page.waitForTimeout(400);
  const ids = await page.$$eval('[data-skill-id]', (els) => els.map((e) => e.dataset.skillId));
  check('parent: switching to Class 2 lists Class 2 skills', ids.length > 0 && ids.every((id) => id.startsWith('g2.')), `${ids.length} skills`);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /Class 1/ }).click();

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
    page.getByRole('button', { name: /Export progress/ }).click(),
  ]);
  check('parent: Export progress downloads a backup file', !!download, download?.suggestedFilename() ?? 'no download');

  await page.getByRole('button', { name: /Read the full privacy policy/ }).click();
  await page.waitForTimeout(400);
  check('parent: the privacy policy opens', /Privacy Policy/.test(await heading()), await heading());
  await page.getByRole('button', { name: /Back/ }).first().click();
  await page.waitForTimeout(400);
  check('parent: Back from the policy lands on Settings', (await tabs()) === ON_SETTINGS, await tabs());

  const typePin = async (pin) => { for (const d of pin) await page.getByRole('button', { name: d, exact: true }).click(); };
  await page.getByRole('button', { name: /Set Parent Passcode/ }).click();
  await page.waitForTimeout(500);
  await typePin('1234');
  await page.waitForTimeout(400);
  await typePin('1234');
  await page.waitForTimeout(800);
  check('parent: setting a passcode works', await isShown(page.getByRole('button', { name: /Change Passcode/ })));
  await page.getByRole('button', { name: 'Home' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Parent' }).click();
  await page.waitForTimeout(600);
  const gated = await isShown(page.getByText('For Parents Only'));
  await typePin('1234');
  await page.waitForTimeout(900);
  check('parent: the gate asks for the PIN, then opens on Progress', gated && (await tabs()) === ON_PROGRESS, `gate ${gated ? 'shown' : 'missing'}, ${await tabs()}`);

  await page.setViewportSize({ width: 360, height: 640 });
  for (const tab of ['Progress', 'Settings']) {
    await page.getByRole('tab', { name: tab }).click();
    await page.waitForTimeout(300);
    const fit = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      small: [...document.querySelectorAll('button, a, label')]
        .map((e) => ({ text: e.textContent.trim().slice(0, 25), h: Math.round(e.getBoundingClientRect().height) }))
        .filter((c) => c.h > 0 && c.h < 48),
    }));
    check(`parent: ${tab} fits a 360x640 phone, every control >= 48 px`, !fit.overflow && fit.small.length === 0, fit.small.length ? JSON.stringify(fit.small) : '');
  }
  await ctx.close();
}

// ── 5. Opens offline (the service worker serves the app after one visit) ───────────────────────
{
  const { ctx, page } = await freshPhone('offline', {
    'tinku:v1:testSettings': JSON.stringify({ version: 1, theme: 'wonder', grade: 1, bridgeEnabled: false, gradeChosen: true }),
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const sw = await page.evaluate(() => (!('serviceWorker' in navigator)
    ? 'not supported'
    : Promise.race([navigator.serviceWorker.ready.then(() => 'ready'), new Promise((r) => setTimeout(() => r('not ready after 20 s'), 20000))])));
  check('offline: the service worker is installed', sw === 'ready', sw);
  await page.reload({ waitUntil: 'networkidle' }); // the next load is controlled by the service worker
  const before = consoleErrors.length;
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1500);
  check('offline: the app opens with no network', await isShown(page.getByRole('button', { name: FIRST_SKILL, exact: true })));
  check('offline: the offline banner shows', await isShown(page.getByText(/You're offline/)));
  await shot(page, '5-offline');
  consoleErrors.splice(before); // failed network requests are expected while offline
  await ctx.close();
}

// ── 6. Console errors on any step ────────────────────────────────────────────────────────────
check('no console errors on any step', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

await browser.close();
console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll smoke checks passed.');
process.exit(failed ? 1 : 0);
