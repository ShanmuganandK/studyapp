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
 * A fresh install only ever plays the EASIEST rung (1-row counting trays), so a second pass seeds progress at the
 * hardest rung of 'Big Number Party' and plays until it has measured a 1-, 2- and 3-row tray: that is where the
 * counting tray was once clipped on a real phone (2026-10-18). It fails if it never gets to see a 3-row tray.
 * A third pass loads a FRESH install and checks the first-run class picker: no scroll, every choice on screen and
 * touchable, Tinku at least 30% of the screen height (and no wider than the hero), at most 30% of the hero empty.
 * A Home pass (TD-15) seeds progress so Tinku's stop is far down the path and checks it is on screen when Home
 * opens, and that a >= 48px "Back to Tinku" button appears when it is scrolled away and brings it back. With motion
 * allowed it also checks the F6 hero and walk: big Tinku starts in the middle, lands on the stop, and a tap skips it.
 * Portrait only: this is a portrait app (the Android build should be locked to portrait).
 *
 * Exit code 1 if anything fails, with the offending measurement printed.
 */
/* global document, localStorage, window */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.LAYOUT_PORT) || 4324;
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
  { name: 'small browser', w: 360, h: 540, cramped: true },
];
const GRADES = [1, 2];
const SKILLS_PER_GRADE = Number(process.env.LAYOUT_SKILLS) || 3;
const HARD_COUNTING_SKILL = /Big Number Party/i;   // g1.count.1-20, the skill with 1-, 2- and 3-row trays
const HARD_QUESTIONS_MAX = 60;
const ONLY = process.env.LAYOUT_ONLY;   // e.g. LAYOUT_ONLY=Galaxy to run one phone while iterating
const QUESTIONS_PER_SKILL = Number(process.env.LAYOUT_QUESTIONS) || 3;   // raise it to sweep more random questions (e.g. every counting tray size)
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
  const barButtons = [...(q('bar')?.querySelectorAll('button') ?? [])].map((b) => {
    const br = b.getBoundingClientRect();
    return { label: b.getAttribute('aria-label') || b.textContent.trim(), w: br.width, h: br.height };
  });
  return {
    grid: r(grid), bar: r(q('bar')), barButtons, mascot: r(q('mascot')), mascotImg: r(q('mascot')?.querySelector('img')),
    hint: r(q('hint')), question: r(question), answers: r(q('answers')), tile: r(tile),
    questionScrolls: question ? question.scrollHeight - question.clientHeight : 0,
    questionContentH: question?.firstElementChild?.firstElementChild ? question.firstElementChild.firstElementChild.offsetHeight : 0,
    hasBubble: !!document.querySelector('[role="status"]'),
    glyphs: document.querySelectorAll('.count-glyph').length,
    profile: grid.dataset.profile,
  };
};

const failures = [];
const fail = (where, msg, m) => failures.push(`${where}: ${msg}${m ? `  (${JSON.stringify(m)})` : ''}`);
const pad = (s, n) => String(s).padEnd(n);
const rows = [];
const pickerRows = [];

// Measures + asserts ONE question on the screen, then answers it so the session moves on. Returns the
// measurement (or null when there is no quiz screen). `shot` saves screenshots for this question.
async function checkQuestion(page, phone, where, stats, shot) {
  const rest = await page.evaluate(measure);
  if (!rest) return null; // session ended or the skill has no quiz screen
  stats.measured++; stats.stageH = rest.grid.h;
  stats.mascotMin = Math.min(stats.mascotMin, rest.mascotImg.h); stats.mascotMax = Math.max(stats.mascotMax, rest.mascotImg.h);

  // 1. FITS
  if (rest.answers.b > rest.grid.b + 1) fail(where, 'answers overflow the stage', { answersBottom: rest.answers.b, stageBottom: rest.grid.b });
  if (rest.questionScrolls > 1) fail(where, `question area needs scrolling (${Math.round(rest.questionScrolls)} px)`, { region: rest.question.h });
  // 5. TOUCHABLE (tiles >= 44px; header controls F1 >= 48px)
  if (rest.tile.h < 44) fail(where, `answer tile only ${Math.round(rest.tile.h)} px tall`);
  for (const btn of rest.barButtons) {
    if (btn.w < 47.5 || btn.h < 47.5) fail(where, `header control "${btn.label}" is ${Math.round(btn.w)}x${Math.round(btn.h)} px (< 48px)`);
  }
  // 3 + 4: only where there is room to judge
  if (!phone.cramped) {
    const minMascotRatio = rest.profile === 'stage' ? 0.18 : 0.22;
    if (rest.mascotImg.h < minMascotRatio * rest.grid.h) fail(where, `Tinku is only ${Math.round((100 * rest.mascotImg.h) / rest.grid.h)}% of the stage`, { mascot: rest.mascotImg.h, stage: rest.grid.h });
    const dead = (rest.question.h - rest.questionContentH) / rest.grid.h;
    stats.voidMax = Math.max(stats.voidMax, dead);
    if (dead > 0.28) fail(where, `${Math.round(dead * 100)}% of the stage is empty space in the question area`, { region: rest.question.h, content: rest.questionContentH });
  }
  if (shotsDir && shot) await page.screenshot({ path: join(shotsDir, `${phone.w}x${phone.h}-rest.png`) });

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
      const bubble = await page.evaluate(() => {
        const b = document.querySelector('[role="status"]');
        const s = document.querySelector('[data-q="hint"]');
        const listen = s?.querySelector('button')?.getBoundingClientRect();
        const bb = b.getBoundingClientRect(), sb = s.getBoundingClientRect();
        return {
          over: Math.max(0, bb.height - sb.height),
          clipped: b.scrollHeight - b.clientHeight,
          listen: listen ? { w: listen.width, h: listen.height, over: Math.max(0, listen.height - sb.height) } : null,
        };
      });
      if (bubble.over > 2 || bubble.clipped > 2) fail(where, 'hint text does not fit the hint slot', bubble);
      if (bubble.listen && (bubble.listen.w < 47.5 || bubble.listen.h < 47.5)) fail(where, `Listen button is ${Math.round(bubble.listen.w)}x${Math.round(bubble.listen.h)} px (< 48px)`);
      if (bubble.listen && bubble.listen.over > 2) fail(where, 'Listen button overflows hint slot', bubble.listen);
      if (shotsDir && shot) await page.screenshot({ path: join(shotsDir, `${phone.w}x${phone.h}-hint.png`) });
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
  return rest;
}

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
        if (!(await checkQuestion(page, phone, where, stats, grade === 1 && k === 0 && qn === 0))) break;
      }
    }
    await ctx.close();
  }

  // HARD COUNTING PASS: progress seeded at the hardest rung, so 2- and 3-row counting trays actually appear.
  {
    const skillState = (id) => ({ skillId: id, level: 3, difficulty: 3, maxDifficulty: 3, attempts: 0, correct: 0, lastSeen: null, nextReview: null, reviewInterval: 0, recentParams: [], misconceptions: {}, difficultyStreak: 0 });
    const hardProgress = JSON.stringify({ version: 1, skills: { 'g1.count.1-20': skillState('g1.count.1-20') } });
    const ctx = await browser.newContext({ viewport: { width: phone.w, height: phone.h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.addInitScript(([s, k]) => { localStorage.setItem('tinku:v1:testSettings', s); localStorage.setItem('tinku:v1:skills', k); },
      [settings(1), hardProgress]);
    await page.clock.install({ time: 1760000000000 });
    await page.goto(URL); await page.clock.runFor(1500);
    await page.getByRole('button', { name: HARD_COUNTING_SKILL }).click(); await page.clock.runFor(800);
    const traySizes = new Set();
    for (let qn = 0; qn < HARD_QUESTIONS_MAX && traySizes.size < 3; qn++) {
      const where = `${phone.name} ${phone.w}x${phone.h} hard-counting q${qn + 1}`;
      const m = await checkQuestion(page, phone, where, stats, false);
      if (!m) { // summary: assert CelebrationScreen CTAs >= 48px (F1), reset progress, then play again
        const celBtns = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => ({ text: b.textContent.trim(), h: b.getBoundingClientRect().height })));
        for (const b of celBtns) {
          if (b.h < 47.5) fail(`${phone.name} ${phone.w}x${phone.h} celebration`, `button "${b.text}" is ${Math.round(b.h)} px tall (< 48px)`);
        }
        await page.evaluate((k) => localStorage.setItem('tinku:v1:skills', k), hardProgress);
        await page.getByRole('button', { name: /play again/i }).click().catch(() => {}); await page.clock.runFor(800); continue;
      }
      if (m.glyphs) traySizes.add(Math.ceil(m.glyphs / 5));
    }
    if (traySizes.size < 3) fail(`${phone.name} ${phone.w}x${phone.h}`, `hard-counting pass only saw tray rows [${[...traySizes]}]: it must see 1, 2 and 3 rows or it proves nothing`);
    await ctx.close();
  }

  // FIRST-RUN PICKER PASS: a fresh install (no saved settings) shows the class picker. It must fit with no
  // scrolling, keep every choice on screen, and give Tinku real room instead of floating in empty space
  // (the picker once used a fixed Tinku size, which left a big void on tall phones).
  {
    const ctx = await browser.newContext({ viewport: { width: phone.w, height: phone.h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.clock.install({ time: 1760000000000 });
    await page.goto(URL); await page.clock.runFor(1500);
    const m = await page.evaluate(() => {
      if (!document.querySelector('h1')) return null;   // the picker's question
      const hero = document.querySelector('.app-frame').firstElementChild;   // brand hero, above the question card
      const hr = hero.getBoundingClientRect();
      const img = hero.querySelector('img').getBoundingClientRect();
      const kids = [...hero.querySelectorAll('p, img')].map((c) => c.getBoundingClientRect());   // title, Tinku, tagline
      const span = Math.max(...kids.map((k) => k.bottom)) - Math.min(...kids.map((k) => k.top));
      const buttons = [...document.querySelectorAll('button')].map((b) => b.getBoundingClientRect());
      return {
        vh: window.innerHeight, heroH: hr.height, tinku: img.height, tinkuW: img.width, heroW: hr.width,
        void: 1 - span / hr.height,
        scrolls: document.documentElement.scrollHeight > window.innerHeight + 1,
        lowest: Math.max(...buttons.map((b) => b.bottom)),
        shortest: Math.min(...buttons.map((b) => b.height)),
      };
    });
    const where = `${phone.name} ${phone.w}x${phone.h} first-run picker`;
    if (!m) fail(where, 'the picker did not show on a fresh install');
    else {
      if (m.scrolls) fail(where, 'the page scrolls', m);
      if (m.lowest > m.vh + 0.5) fail(where, 'a choice is off the bottom of the screen', m);
      if (m.shortest < 44) fail(where, 'a choice is under 44 px tall', m);
      if (m.tinkuW > m.heroW + 0.5) fail(where, 'Tinku is wider than the hero', m);
      if (!phone.cramped && m.tinku / m.vh < 0.3) fail(where, 'Tinku is under 30% of the screen height', m);
      if (!phone.cramped && m.void > 0.3) fail(where, 'more than 30% of the hero is empty', m);
      pickerRows.push(`${pad(phone.name, 24)}${pad(`${phone.w}x${phone.h}`, 11)}${pad(`${Math.round(m.tinku)} px`, 10)}${pad(`${Math.round((100 * m.tinku) / m.vh)}%`, 17)}${phone.cramped ? 'n/a' : `${Math.round(m.void * 100)}%`}`);
    }
    if (shotsDir) await page.screenshot({ path: join(shotsDir, `picker-${phone.w}x${phone.h}.png`) });
    await ctx.close();
  }

  // HOME PASS (TD-15): with Tinku's stop far down the path, Home must open with that stop on screen (without
  // scrolling the page itself); scrolled away, a >= 48px "Back to Tinku" button must appear and bring it back.
  {
    const ctx = await browser.newContext({ viewport: { width: phone.w, height: phone.h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const st = (id, level) => ({ skillId: id, level, difficulty: 1, maxDifficulty: 3, attempts: 10, correct: 8, lastSeen: '2026-11-20', nextReview: null, reviewInterval: 0, recentParams: [], misconceptions: {}, difficultyStreak: 0 });
    // Counting 1–9 at the unlock level and 2D shapes just started → Tinku suggests shapes, stop 15 of 19.
    const seeded = JSON.stringify({ version: 1, skills: { 'g1.count.1-9': st('g1.count.1-9', 3), 'g1.shapes.2d': st('g1.shapes.2d', 1) } });
    await page.addInitScript(([s, k]) => { localStorage.setItem('tinku:v1:testSettings', s); localStorage.setItem('tinku:v1:skills', k); }, [settings(1), seeded]);
    await page.clock.install({ time: 1760000000000 });
    await page.goto(URL); await page.clock.runFor(1200);
    const where = `${phone.name} ${phone.w}x${phone.h} home (TD-15)`;
    const BACK = 'button[aria-label="Back to Tinku"]';
    const homeState = () => page.evaluate((backSel) => {
      const s = document.querySelector('.desktop-phone-content').getBoundingClientRect();
      const rows = [...document.querySelectorAll('ol li')];
      const idx = rows.findIndex((li) => li.querySelector('.path-pulse'));
      const r = rows[idx]?.getBoundingClientRect();
      const b = document.querySelector(backSel)?.getBoundingClientRect();
      return {
        stop: idx + 1,
        inView: !!r && r.top >= s.top - 1 && r.bottom <= s.bottom + 1,
        pageScrollY: window.scrollY,
        back: b ? { h: Math.round(b.height), inView: b.top >= s.top && b.bottom <= s.bottom } : null,
      };
    }, BACK);
    const onLoad = await homeState();
    if (onLoad.stop < 6) fail(where, `seeded suggestion should be far down the path, got stop ${onLoad.stop}`);
    if (!onLoad.inView) fail(where, "Tinku's stop is off-screen on load", onLoad);
    if (onLoad.pageScrollY !== 0) fail(where, 'opening Home scrolled the page itself', onLoad);
    if (onLoad.back) fail(where, '"Back to Tinku" shows while the stop is in view', onLoad);
    await page.evaluate(() => { document.querySelector('.desktop-phone-content').scrollTop = 0; });
    await page.waitForSelector(BACK, { timeout: 3000 }).catch(() => {});
    const away = await homeState();
    if (!away.back) fail(where, '"Back to Tinku" did not appear with the stop scrolled away', away);
    else {
      if (away.back.h < 47.5) fail(where, `"Back to Tinku" is ${away.back.h} px tall (< 48px)`);
      if (!away.back.inView) fail(where, '"Back to Tinku" is not inside the visible area', away);
      await page.click(BACK);
      await page.waitForSelector(BACK, { state: 'detached', timeout: 3000 }).catch(() => {});
      const back = await homeState();
      if (!back.inView || back.back) fail(where, '"Back to Tinku" did not bring the stop back into view', back);
    }
    await ctx.close();

    // HERO + WALK (ROADMAP F6), motion allowed, first Home of an app open: big Tinku starts in the middle of the app on
    // the splash-colour cover with the stop's Tinku hidden, then lands on the stop with the stop on screen; a tap
    // during the hero or mid-walk skips straight to the end.
    const mctx = await browser.newContext({ viewport: { width: phone.w, height: phone.h }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
    const mpage = await mctx.newPage();
    await mpage.addInitScript(([s, k]) => { localStorage.setItem('tinku:v1:testSettings', s); localStorage.setItem('tinku:v1:skills', k); }, [settings(1), seeded]);
    // Paused clock: time moves only when the check says so (a running clock let Playwright's own waits finish the
    // walk before the 'mid-walk' tap, and under load let it start before the 'at start' reading).
    await mpage.clock.install({ time: 1760000000000 });
    await mpage.clock.pauseAt(1760000001000);
    const walkState = () => mpage.evaluate(() => {
      const scroller = document.querySelector('.desktop-phone-content');
      const s = scroller.getBoundingClientRect();
      const row = [...document.querySelectorAll('ol li')].find((li) => li.querySelector('.path-pulse'));
      const r = row?.getBoundingClientRect();
      const w = document.querySelector('[data-tinku="travel"]')?.getBoundingClientRect();
      const app = document.querySelector('.app-frame').getBoundingClientRect();
      const cover = document.querySelector('[data-tinku="hero-backdrop"]');
      const stopTinku = document.querySelector('[data-tinku="stop"]');
      return {
        walker: w ? { heightShare: w.height / s.height, offCentre: Math.abs(w.left + w.width / 2 - (app.left + app.width / 2)) } : null,
        cover: cover && !cover.hidden ? window.getComputedStyle(cover).opacity : null,
        stopTinkuOpacity: stopTinku ? window.getComputedStyle(stopTinku).opacity : null,
        inView: !!r && r.top >= s.top - 1 && r.bottom <= s.bottom + 1,
        scrollTop: Math.round(scroller.scrollTop),
        pageScrollY: window.scrollY,
        back: !!document.querySelector('button[aria-label="Back to Tinku"]'),
      };
    });
    const wwhere = `${phone.name} ${phone.w}x${phone.h} home walk (F6)`;
    await mpage.goto(URL); await mpage.clock.runFor(150);
    const atStart = await walkState();
    if (!atStart.walker) fail(wwhere, 'no big Tinku when Home opens', atStart);
    else if (atStart.walker.heightShare < 0.25 || atStart.walker.offCentre > 4) fail(wwhere, 'hero Tinku is not big and centred', atStart);
    if (atStart.cover !== '1') fail(wwhere, 'hero cover is not showing (Home flashes before the hero)', atStart);
    if (atStart.stopTinkuOpacity !== '0') fail(wwhere, "the stop's Tinku shows while the other one walks (two Tinkus)", atStart);
    if (atStart.scrollTop !== 0) fail(wwhere, 'page jumped before the walk', atStart);
    await mpage.clock.runFor(3300); // hero 1.1 s + walk up to 1.5 s
    const landed = await walkState();
    if (landed.walker || landed.cover) fail(wwhere, 'walking Tinku never landed, or the hero cover stayed', landed);
    if (!landed.inView) fail(wwhere, "Tinku's stop is off-screen after the walk", landed);
    if (landed.stopTinkuOpacity !== '1') fail(wwhere, "the stop's Tinku is not visible after the walk", landed);
    if (landed.back) fail(wwhere, '"Back to Tinku" shows right after landing', landed);
    if (landed.pageScrollY !== 0) fail(wwhere, 'the walk scrolled the page itself', landed);
    // Owner review 2026-11-25: once Tinku has left, the header spot must close up, so scrolling back to the top
    // shows the title at the top, not a blank band where the big Tinku stood.
    const titleGap = () => mpage.evaluate(() => Math.round(
      document.querySelector('h2').getBoundingClientRect().top - document.querySelector('.desktop-phone-content').getBoundingClientRect().top));
    await mpage.evaluate(() => { document.querySelector('.desktop-phone-content').scrollTop = 0; });
    await mpage.clock.runFor(50);
    const farGap = await titleGap();
    if (farGap > 70) fail(wwhere, `blank band above the title after the walk (title ${farGap} px below the top)`);
    // Near stop (fresh install → stop 1): the top is still on screen when Tinku lands, so the page slides up.
    // Init scripts run in order on every load: the first one seeds stop 15, this one clears it (fresh install).
    await mpage.addInitScript(() => localStorage.removeItem('tinku:v1:skills'));
    await mpage.goto(URL); await mpage.clock.runFor(3300);
    await mpage.waitForTimeout(500); // the slide-up is a Web Animation (compositor clock, not the paused page clock)
    const near = await walkState();
    const nearGap = await titleGap();
    if (near.walker || !near.inView) fail(wwhere, 'near stop: Tinku did not land on stop 1', near);
    if (nearGap > 70) fail(wwhere, `near stop: blank band above the title after the walk (title ${nearGap} px below the top)`);
    await mpage.addInitScript(([k]) => localStorage.setItem('tinku:v1:skills', k), [seeded]); // back to stop 15
    // Tap a blank spot (the left padding) by coordinates: no auto-scroll first, and no stop under the finger.
    for (const [label, ms] of [['during the hero', 300], ['mid-walk', 1500]]) {
      await mpage.goto(URL); await mpage.clock.runFor(ms);
      await mpage.mouse.click(8, Math.round(phone.h / 2)); await mpage.clock.runFor(50);
      const skipped = await walkState();
      if (skipped.walker || skipped.cover || !skipped.inView) fail(wwhere, `a tap ${label} did not skip straight to the stop`, skipped);
    }
    await mctx.close();
  }

  // PARENT DASHBOARD PASS (F3, F7): on 360x640, both tabs — zero horizontal overflow, Tinku Noticed card on Progress,
  // the passcode control on Settings, and >= 48px controls.
  if (phone.w === 360 && phone.h === 640) {
    const ctx = await browser.newContext({ viewport: { width: phone.w, height: phone.h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const seededSkills = JSON.stringify({
      version: 1,
      skills: {
        'g1.add.within20': { skillId: 'g1.add.within20', level: 2, difficulty: 2, maxDifficulty: 3, attempts: 10, correct: 7, lastSeen: '2026-11-20', nextReview: null, reviewInterval: 0, recentParams: [], misconceptions: { 'crossing-ten-misstep': 4, 'operator-mixup': 2 }, difficultyStreak: 0 },
      },
    });
    const seededDays = JSON.stringify({ version: 1, days: ['2026-11-19', '2026-11-20', '2026-11-21'] });
    await page.addInitScript(([s, k, d]) => {
      localStorage.setItem('tinku:v1:testSettings', s);
      localStorage.setItem('tinku:v1:skills', k);
      localStorage.setItem('tinku:v1:practiceDays', d);
    }, [settings(1), seededSkills, seededDays]);
    await page.clock.install({ time: 1760000000000 });
    await page.goto(URL); await page.clock.runFor(1200);
    await page.click('text=Parent'); await page.clock.runFor(600);
    // Both tabs (DECISIONS 2026-11-26): Progress opens first, Settings is one tap away.
    for (const tab of ['Progress', 'Settings']) {
      if (tab === 'Settings') { await page.click('[role="tab"]:has-text("Settings")'); await page.clock.runFor(300); }
      const parentReport = await page.evaluate(() => {
        const noticed = document.querySelector('[data-testid="tinku-noticed-card"]')?.getBoundingClientRect();
        const controls = [...document.querySelectorAll('button, a, label')].map((el) => {
          const r = el.getBoundingClientRect();
          return { text: el.textContent.trim().slice(0, 35), h: r.height, right: r.right };
        });
        return {
          vw: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          hasNoticed: !!noticed,
          noticedRight: noticed ? noticed.right : 0,
          hasPasscode: controls.some((c) => c.text.includes('Set Parent Passcode')),
          under48: controls.filter((c) => c.h > 0 && c.h < 47.5),
          overflowRight: controls.filter((c) => c.right > window.innerWidth + 1),
        };
      });
      const where = `${phone.name} ${phone.w}x${phone.h} parent ${tab} tab (F3/F7)`;
      if (parentReport.scrollWidth > parentReport.vw + 1) fail(where, 'horizontal overflow', parentReport);
      if (tab === 'Progress' && !parentReport.hasNoticed) fail(where, 'Tinku Noticed card did not render');
      if (tab === 'Settings' && !parentReport.hasPasscode) fail(where, 'Settings tab did not show the passcode control');
      if (parentReport.noticedRight > parentReport.vw + 1) fail(where, 'Tinku Noticed card overflows right edge', parentReport);
      if (parentReport.under48.length) fail(where, 'parent controls under 48px', parentReport.under48);
      if (parentReport.overflowRight.length) fail(where, 'parent controls overflow right edge', parentReport.overflowRight);
    }
    await ctx.close();
  }
  rows.push({ phone, stats });
}

await Promise.all(PHONES.filter((p) => !ONLY || p.name.includes(ONLY)).map(checkPhone));
await browser.close(); stop();

console.log(`${pad('phone', 24)}${pad('stage', 11)}${pad('Tinku px (min-max)', 20)}${pad('Tinku % of stage', 18)}${pad('worst void', 12)}${pad('hints', 7)}checked`);
for (const { phone, stats: s } of PHONES.filter((p) => !ONLY || p.name.includes(ONLY)).map((p) => rows.find((r) => r.phone === p))) {
  console.log(`${pad(phone.name, 24)}${pad(`${phone.w}x${Math.round(s.stageH)}`, 11)}${pad(`${Math.round(s.mascotMin)}-${Math.round(s.mascotMax)}`, 20)}${pad(`${Math.round((100 * s.mascotMax) / s.stageH)}%`, 18)}${pad(phone.cramped ? 'n/a' : `${Math.round(s.voidMax * 100)}%`, 12)}${pad(s.hints, 7)}${s.measured}`);
}
console.log(`\n${pad('first-run picker', 24)}${pad('size', 11)}${pad('Tinku', 10)}${pad('Tinku % of screen', 17)}hero void`);
pickerRows.forEach((r) => console.log(r));
if (failures.length) {
  const uniq = [...new Set(failures)];
  console.log(`\n${uniq.length} FAILURE(S):\n - ${uniq.join('\n - ')}`);
  process.exit(1);
}
console.log('\nAll quiz layout checks passed.');
