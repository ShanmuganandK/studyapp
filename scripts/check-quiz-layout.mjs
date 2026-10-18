#!/usr/bin/env node
/**
 * Quiz layout check: ON-DEMAND, not wired into CI (CI has no browser installed).
 *
 * Plays real quiz sessions in a real browser at real phone sizes and MEASURES the quiz screen's spacing
 * budget (`.quiz-stage` / `.quiz-grid` in src/index.css, DECISIONS 2026-10-18). It exists because the
 * old layout looked fine in a browser with an address bar and left a third of the screen empty on a tall
 * phone, and nothing measured it. Run it before and after any change to the quiz screen.
 *
 *   npm run build && npm run layout:check
 *   npm run layout:check -- --shots .layout-shots      # also save a screenshot per phone
 *
 * WHAT IT ASSERTS (per phone size, grades 1 and 2, several skills, several questions each):
 *   1. FITS       the answers end inside the stage, and the question area needs no scrolling;
 *   2. HINT MOVES NOTHING   when a hint appears (wrong answer), Tinku's size and the top of the hint
 *                 slot, the question area and the answers are unchanged (the old layout shrank Tinku);
 *   3. TINKU HAS ROOM   on a normal-or-taller stage Tinku is at least 22% of the stage height;
 *   4. NO DEAD VOID  the empty space inside the question area is at most 28% of the stage;
 *   5. TOUCHABLE  every answer tile is at least 44 px tall.
 * (1, 2 and 5 also run on the cramped size; 3 and 4 only where there is room to judge.)
 * Portrait only: this is a portrait app (the Android build should be locked to portrait).
 *
 * Exit code 1 if anything fails, with the offending measurement printed.
 */
/* global document, localStorage */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = 4324;
const URL = `http://localhost:${PORT}`;
const shotsDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

// CSS px, portrait unless named otherwise. The first four are the phones this app is aimed at.
const PHONES = [
  { name: 'iPhone 14/15', w: 390, h: 844 },
  { name: 'S25 Ultra / Pixel Pro', w: 412, h: 915 },
  { name: 'iPhone Pro Max', w: 430, h: 932 },
  { name: 'Galaxy A-series', w: 360, h: 780 },
  { name: 'small floor', w: 360, h: 640, cramped: true },
];
const GRADES = [1, 2];
const SKILLS_PER_GRADE = 3;
const QUESTIONS_PER_SKILL = 3;
const CHROMIUM = process.env.CHROMIUM_PATH || (process.env.PLAYWRIGHT_BROWSERS_PATH ? join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium') : undefined);

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-preview.pid); } catch { /* already gone */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) { try { if ((await fetch(URL)).ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 250)); }

const browser = await chromium.launch(CHROMIUM && process.env.PLAYWRIGHT_BROWSERS_PATH ? { executablePath: CHROMIUM } : {});
const settings = (grade) => JSON.stringify({ version: 1, theme: 'wonder', grade, bridgeEnabled: false, gradeChosen: true });

// Everything measured in the page, in one go, so a measurement is one consistent frame.
const measure = () => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, b: b.bottom }; };
  const q = (n) => document.querySelector(`[data-q="${n}"]`);
  const grid = document.querySelector('.quiz-grid');
  if (!grid) return null;
  const question = q('question');
  const tile = q('answers')?.querySelector('button');
  return {
    grid: r(grid), bar: r(q('bar')), mascot: r(q('mascot')), mascotImg: r(q('mascot')?.querySelector('img')),
    hint: r(q('hint')), question: r(question), answers: r(q('answers')), tile: r(tile),
    questionScrolls: question ? question.scrollHeight - question.clientHeight : 0,
    questionContentH: question?.firstElementChild?.firstElementChild ? question.firstElementChild.firstElementChild.offsetHeight : 0,
    hasBubble: !!document.querySelector('[role="status"]'),
    profile: grid.dataset.profile,
  };
};

const failures = [];
const fail = (where, msg, m) => failures.push(`${where}: ${msg}${m ? `  (${JSON.stringify(m)})` : ''}`);
const rows = [];

async function checkPhone(phone) {
  const stats = { stageH: 0, mascotMin: Infinity, mascotMax: 0, voidMax: 0, measured: 0, hints: 0 };
  for (const grade of GRADES) {
    const ctx = await browser.newContext({ viewport: { width: phone.w, height: phone.h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.addInitScript(([s]) => localStorage.setItem('tinku:v1:testSettings', s), [settings(grade)]);
    await page.clock.install({ time: 1760000000000 });
    await page.goto(URL); await page.clock.runFor(1500);
    const nodes = await page.locator('button[aria-label]').count();
    for (let k = 0; k < Math.min(SKILLS_PER_GRADE, nodes); k++) {
      await page.goto(URL); await page.clock.runFor(1200);
      await page.locator('button[aria-label]').nth(k).click(); await page.clock.runFor(800);
      for (let qn = 0; qn < QUESTIONS_PER_SKILL; qn++) {
        const where = `${phone.name} ${phone.w}x${phone.h} g${grade} skill#${k} q${qn + 1}`;
        const rest = await page.evaluate(measure);
        if (!rest) break; // session ended or the skill has no quiz screen
        stats.measured++; stats.stageH = rest.grid.h;
        stats.mascotMin = Math.min(stats.mascotMin, rest.mascotImg.h); stats.mascotMax = Math.max(stats.mascotMax, rest.mascotImg.h);

        // 1. FITS
        if (rest.answers.b > rest.grid.b + 1) fail(where, 'answers overflow the stage', { answersBottom: rest.answers.b, stageBottom: rest.grid.b });
        if (rest.questionScrolls > 1) fail(where, `question area needs scrolling (${Math.round(rest.questionScrolls)} px)`, { region: rest.question.h });
        // 5. TOUCHABLE
        if (rest.tile.h < 44) fail(where, `answer tile only ${Math.round(rest.tile.h)} px tall`);
        // 3 + 4: only where there is room to judge
        if (!phone.cramped) {
          if (rest.mascotImg.h < 0.22 * rest.grid.h) fail(where, `Tinku is only ${Math.round((100 * rest.mascotImg.h) / rest.grid.h)}% of the stage`, { mascot: rest.mascotImg.h, stage: rest.grid.h });
          const dead = (rest.question.h - rest.questionContentH) / rest.grid.h;
          stats.voidMax = Math.max(stats.voidMax, dead);
          if (dead > 0.28) fail(where, `${Math.round(dead * 100)}% of the stage is empty space in the question area`, { region: rest.question.h, content: rest.questionContentH });
        }
        if (shotsDir && grade === 1 && k === 0 && qn === 0) await page.screenshot({ path: join(shotsDir, `${phone.w}x${phone.h}-rest.png`) });

        // 2. HINT MOVES NOTHING: tap a wrong-ish option; if a bubble appears, compare.
        const tiles = page.locator('[data-q="answers"] button');
        const n = await tiles.count();
        for (let t = 0; t < n; t++) {
          await tiles.nth(t).click({ timeout: 1500 }).catch(() => {});
          await page.clock.runFor(150);
          const m = await page.evaluate(measure);
          if (m?.hasBubble) {
            stats.hints++;
            const d = (a, b) => Math.abs(a - b);
            if (d(m.mascotImg.w, rest.mascotImg.w) > 1 || d(m.mascotImg.h, rest.mascotImg.h) > 1) fail(where, 'Tinku changed size when the hint appeared', { before: rest.mascotImg, after: m.mascotImg });
            for (const part of ['hint', 'question', 'answers']) {
              if (d(m[part].y, rest[part].y) > 1.5 || d(m[part].h, rest[part].h) > 1.5) fail(where, `${part} moved or resized when the hint appeared`, { before: rest[part], after: m[part] });
            }
            if (m.hint.h < 40) fail(where, 'hint slot too small to hold a hint', { slot: m.hint.h });
            const bubble = await page.evaluate(() => { const b = document.querySelector('[role="status"]'); const s = document.querySelector('[data-q="hint"]'); const bb = b.getBoundingClientRect(), sb = s.getBoundingClientRect(); return { over: Math.max(0, bb.height - sb.height), clipped: b.scrollHeight - b.clientHeight }; });
            if (bubble.over > 2 || bubble.clipped > 2) fail(where, 'hint text does not fit the hint slot', bubble);
            if (shotsDir && grade === 1 && k === 0 && qn === 0) await page.screenshot({ path: join(shotsDir, `${phone.w}x${phone.h}-hint.png`) });
            break;
          }
        }
        // finish this question (keep tapping until it advances), then move on
        for (let t = 0; t < 8; t++) {
          const before = await page.locator('text=/\\d+ \\/ \\d+/').first().textContent().catch(() => '');
          await tiles.nth(t % Math.max(1, n)).click({ timeout: 1000 }).catch(() => {});
          await page.clock.runFor(1400);
          const after = await page.locator('text=/\\d+ \\/ \\d+/').first().textContent().catch(() => '');
          if (after !== before) break;
        }
      }
    }
    await ctx.close();
  }
  rows.push({ phone, stats });
}

await Promise.all(PHONES.map(checkPhone));
await browser.close(); stop();

const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('phone', 24)}${pad('stage', 11)}${pad('Tinku px (min-max)', 20)}${pad('Tinku % of stage', 18)}${pad('worst void', 12)}${pad('hints', 7)}checked`);
for (const { phone, stats: s } of PHONES.map((p) => rows.find((r) => r.phone === p))) {
  console.log(`${pad(phone.name, 24)}${pad(`${phone.w}x${Math.round(s.stageH)}`, 11)}${pad(`${Math.round(s.mascotMin)}-${Math.round(s.mascotMax)}`, 20)}${pad(`${Math.round((100 * s.mascotMax) / s.stageH)}%`, 18)}${pad(phone.cramped ? 'n/a' : `${Math.round(s.voidMax * 100)}%`, 12)}${pad(s.hints, 7)}${s.measured}`);
}
if (failures.length) {
  const uniq = [...new Set(failures)];
  console.log(`\n${uniq.length} FAILURE(S):\n - ${uniq.join('\n - ')}`);
  process.exit(1);
}
console.log('\nAll quiz layout checks passed.');
