// Regenerates design-handoff/screenshots against a built app (npm run build first).
// Usage: node design-handoff/capture.mjs   (from repo root; uses vite preview on :4322)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
const URL = 'http://localhost:4322';
const preview = spawn('npx', ['vite', 'preview', '--port', '4322', '--strictPort'], { stdio: 'ignore', detached: true });
for (let i = 0; i < 60; i++) { try { if ((await fetch(URL)).ok) break; } catch { /* wait */ } await new Promise(r => setTimeout(r, 300)); }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const shot = (page, name) => page.screenshot({ path: join(OUT, `${name}.png`) });
const settings = (o) => JSON.stringify({ version: 1, theme: 'wonder', grade: 1, bridgeEnabled: false, gradeChosen: true, ...o });
const skill = (id, level, extra = {}) => ({ skillId: id, level, difficulty: 1, maxDifficulty: 3, attempts: 16, correct: 13, lastSeen: '2026-10-01', nextReview: null, reviewInterval: 0, recentParams: [], misconceptions: {}, difficultyStreak: 0, ...extra });
const progress = JSON.stringify({ version: 1, skills: {
  'g1.count.1-9': skill('g1.count.1-9', 5, { nextReview: '2026-10-10', reviewInterval: 1 }),
  'g1.count.1-20': skill('g1.count.1-20', 3),
  'g1.add.within-10': skill('g1.add.within-10', 1, { misconceptions: { 'count-all-again': 2 } }),
} });

async function ctx(w, h, seed = {}, theme) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  const p = await c.newPage();
  await p.addInitScript(([s, pr]) => { if (s) localStorage.setItem('tinku:v1:testSettings', s); if (pr) localStorage.setItem('tinku:v1:skills', pr); }, [seed.settings ?? null, seed.progress ?? null]);
  await p.goto(URL); await p.waitForTimeout(900);
  return p;
}

// 1. First-run grade picker (fresh device)
let p = await ctx(390, 844); await shot(p, '01-grade-picker'); await p.context().close();

// 2. Home — journey path (default), fresh and with progress; cards variant
p = await ctx(390, 844, { settings: settings() }); await shot(p, '02-home-path-fresh'); await p.context().close();
p = await ctx(390, 844, { settings: settings(), progress }); await shot(p, '03-home-path-progress');
await p.evaluate(() => window.scrollTo(0, 0));
await p.context().close();
p = await ctx(390, 844, { settings: settings(), progress }); await p.goto(URL + '/?home=cards'); await p.waitForTimeout(900); await shot(p, '04-home-cards-progress'); await p.context().close();
p = await ctx(320, 568, { settings: settings(), progress }); await shot(p, '05-home-path-320x568'); await p.context().close();

// 3. Quiz: question, wrong -> hint, celebration
const SKILL_BTN = { 'Number Party': 0, 'Big or Small': 2, 'Add a Little': 3 }; // path nodes are emoji-only buttons, in order
async function startSkill(name, seedProgress) {
  const pg = await ctx(390, 844, { settings: settings(), progress: seedProgress });
  await pg.locator('button').nth(SKILL_BTN[name]).click(); await pg.waitForTimeout(800);
  return pg;
}
for (const [name, file] of [['Number Party', 'count'], ['Big or Small', 'compare'], ['Add a Little', 'add']]) {
  try {
    const pg = await startSkill(name, progress);
    await shot(pg, `06-quiz-${file}-question`);
    if (file === 'count') {
      const opts = pg.locator('button').filter({ hasNotText: /Skills|🔊|🔇|HOME|PARENT/ });
      await opts.first().click(); await pg.waitForTimeout(500); await shot(pg, '07-quiz-after-first-tap');
      await opts.nth(1).click().catch(() => {}); await pg.waitForTimeout(500); await shot(pg, '08-quiz-hint-or-reveal');
    }
    await pg.context().close();
  } catch (e) { console.log('skip', name, e.message.split('\n')[0]); }
}
// celebration: tap through
{
  const pg = await startSkill('Number Party', progress);
  for (let i = 0; i < 70; i++) {
    if (await pg.locator('text=/Great job/i').count()) break;
    const btns = pg.locator('button').filter({ hasNotText: /Skills|🔊|🔇|HOME|PARENT/ });
    const n = await btns.count(); if (!n) break;
    await btns.nth(i % Math.min(n, 4)).click({ timeout: 800 }).catch(() => {}); await pg.waitForTimeout(1350);
  }
  await pg.waitForTimeout(600); await shot(pg, '09-celebration'); await pg.context().close();
}

// 4. Parent zone
p = await ctx(390, 844, { settings: settings(), progress }); await p.click('text=Parent'); await p.waitForTimeout(500); await shot(p, '10-parent-dashboard-top');
await p.context().close();
// Full-length dashboard: the app scrolls an inner div, so use a very tall viewport instead of fullPage.
p = await ctx(390, 2600, { settings: settings(), progress }); await p.click('text=Parent'); await p.waitForTimeout(500); await shot(p, '11-parent-dashboard-full');
const setBtn = p.locator('button:has-text("Set Parent Passcode")');
if (await setBtn.count()) { await setBtn.click(); await p.waitForTimeout(400); await shot(p, '12-parent-gate-set-passcode'); }
await p.context().close();

// 5. Alternate palettes (parent test instrument)
for (const t of ['sunset', 'bubblegum', 'deepsea']) {
  p = await ctx(390, 844, { settings: settings({ theme: t }), progress }); await shot(p, `13-theme-${t}-home`); await p.context().close();
}
// 6. Privacy page
p = await ctx(390, 844, { settings: settings() }); await p.goto(URL + '/privacy.html'); await p.waitForTimeout(500); await shot(p, '14-privacy-page'); await p.context().close();

await browser.close();
try { process.kill(-preview.pid); } catch { /* done */ }
