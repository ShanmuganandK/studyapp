# TESTING_PLAN.md — App-Level Testing: What Runs Today, and Plans Held for Later

> **Scope (Single Source of Truth):** testing of the app as a whole (a real browser or the Android app, driven like a user), above the unit suite. What is in use today, and the candidate levels discussed for later.
> - Unit, component and guard tests, and the commands that run them, live in [`AGENTS.md`](AGENTS.md) (§ commands). Test blind spots found in code live in [`TECH_DEBT.md`](TECH_DEBT.md).
> - Evidence about real children (personas, kid-test protocol, recalibration) is the Calibrated Testing Framework in [`ROADMAP.md`](ROADMAP.md) §4. Nothing in this document is evidence about how children learn.
> - Release steps (web deploy checks, Play uploads) live in [`CURRENT_STATE.md`](CURRENT_STATE.md) §3.
>
> **Origin:** a planning session on `2026-11-26` (owner + Claude), recorded in [`archive/decisions/DECISIONS.md`](archive/decisions/DECISIONS.md) `2026-11-26` (testing).
>
> **Status rule — read before acting on anything here.** Only **Level 0 (smoke test)** is in use. Every other level in §3 is a plan written down from that session, **not a commitment**: no order, no date, and no promise that it will ever be built. Several of them change how or when code reaches families, and some can **stop a deploy**. Each level must be agreed by the owner and recorded in `DECISIONS.md` before any work on it starts (checklist in §6). Each will be started as and when it is needed.

---

## 1. What Runs Today

Facts as of `2026-11-26`.

| Check | What it proves | How and when it runs | What it cannot see |
|---|---|---|---|
| Vitest unit / component suite (`69` files, `921` passed) | Logic and single screens behave, in a simulated browser (jsdom) | CI (`.github/workflows/ci.yml`) on every push and pull request | A real browser, the built app, the deployed site, the Android app |
| Guards: `lint`, `lint:hex`, `privacy:check`, `noFirebaseAuth` / `distLean` | Code style, colour tokens, privacy page in sync, no network SDK in the build | CI, every push and pull request | Behaviour |
| `npm run layout:check` | The production build in a real browser at 6 phone sizes: quiz fit, hint stability, tap sizes, first-run picker, Home, both parent tabs | On demand, by hand (`npm run build` first). Not in CI: CI has no browser installed | Journeys beyond layout; the deployed site |
| `npm run visual:capture` / `visual:diff` | Screenshots of 5 screens, compared byte for byte | On demand | Judges nothing by itself; a person reads the diff |
| **`npm run smoke` (Level 0, §2)** | The core journeys work on a deployed site | On demand: after a web deploy and before each Play upload | The Android app; layout at every phone size |
| Android debug APK build | The Android project compiles; the manifest asks for no permissions | CI (`android.yml`) on every push to `master` | Nothing drives the built app |
| Phone walk (`L5` in `CURRENT_STATE.md`) | The installed Android app on a real phone | By hand | Only what the person checks that day |
| Closed kid test (`L9`) | Whether real children come back | Real families, 14 days | Not a regression check |

Two facts that shape the plans below:
- **Netlify publishes `master` about 20 seconds after a push, whether or not CI has passed** (observed `2026-11-26`). Nothing stops a red build reaching the website.
- **Closed-test families get the app only from Play**, through a signed release that is started by hand. A push to `master` reaches the website, not their phones.

---

## 2. Level 0 — Smoke Test (in use)

**Command:** `npm run smoke` (`scripts/smoke.mjs`). Defaults to `https://tinku.stringus.com`; `npm run smoke -- --url <address>` checks another copy (a Netlify deploy preview, or `npm run preview` on `http://localhost:4173`). `-- --shots <dir>` saves a screenshot per step.

**When to run it:**
- after a web deploy, once Netlify shows the new deploy as published;
- before each Play upload (the web build of the same commit is live by then).

**What it covers** (each step in its own fresh browser, phone size `390×844`):
1. **First run:** a brand-new visitor sees the class picker, picks Class 1, and lands on Home with the skill path.
2. **Play a full session:** opens the first skill, answers every question until "Great job!", and the bottom bar comes back.
3. **Progress is kept:** after the session the skill and today's practice day are saved, survive a reload, and the Parent screen shows "Last practised: today" and "Days practised: 1".
4. **Parent zone:** opens on Progress; Settings holds Class, Colours, Parent lock and Progress backup in that order; changing Colours and Class works; Export progress downloads a file; the privacy policy opens and Back returns to Settings; setting a passcode works, and coming back through the gate opens on Progress again; both tabs fit a `360×640` phone with every control at least `48 px`.
5. **Opens offline:** after one visit, the app opens with the network switched off.
6. **No console errors** on any step.

**Safe on the live site.** The app has no server, accounts or analytics, and each step uses a throwaway browser, so a run changes nothing for any family.

**What it does not cover:** the Android app (share-sheet export, Back button, portrait lock, splash, sound), every phone size and quiz layout (that is `layout:check`), and whether anything is pleasant or understandable for a child.

**Verified `2026-11-26`:** all `28` checks passed against the live site (bundle `index-U5NkIyJb.js`, about 60 seconds) and against `npm run preview` of the same commit.

**Reading a failure:** each line prints `PASS` or `FAIL` with what it saw. Exit code `1` means at least one check failed. A failure right after a deploy can be a stale service worker or a deploy that has not finished: confirm the published commit first (`CURRENT_STATE.md` §3.1).

---

## 3. Candidate Levels (discussed `2026-11-26`, not agreed)

None of these is scheduled. Each entry records what was discussed so a later decision does not start from nothing. "Triggers discussed" are the conditions mentioned in the session as reasons to reconsider a level; they are not agreed thresholds.

### Level 1 — Journey tests and `layout:check` in CI, before deploy
- **What:** run the smoke journeys and `layout:check` in CI against the production build of each push (`vite preview`), not the live site.
- **Would catch:** a broken journey or layout before anyone opens the site.
- **How it could work:** install Chromium in the CI job, build, start `vite preview`, run both scripts against it.
- **Effect on deployment:** none by itself, because Netlify does not wait for CI (§1). A red run is a warning only, unless Level 3 is also agreed. Adds several minutes to every CI run.
- **Triggers discussed:** a bug reaches a real family; someone other than the owner commits code.
- **To agree:** which branches run it; how long a run may take; whether a failure blocks anything.

### Level 2 — Tests against Netlify deploy previews (pull requests)
- **What:** run the smoke journeys against the preview copy Netlify builds for a pull request.
- **Would catch:** problems that appear only on real hosting: the service worker and offline cache, headers, redirects, `privacy.html`.
- **How it could work:** a CI job waits for the preview address, then runs `npm run smoke -- --url <preview>`.
- **Effect on deployment:** changes the way of working. Today changes are committed straight to `master`; previews exist only for pull requests, so this level needs work to go through pull requests first.
- **Triggers discussed:** none specific; it pairs with Level 3.
- **To agree:** whether to move to pull requests; whether the preview check is required before merge.

### Level 3 — Deploy gate: publish only after tests pass
- **What:** the website is published only after the checks pass.
- **Would catch:** stops a broken build reaching families instead of reporting it afterwards.
- **How it could work:** turn off Netlify's automatic publishing and let a GitHub Action deploy after CI passes, or run the checks inside the Netlify build so a failure fails the deploy.
- **Effect on deployment:** **the most serious level: it can hold or stop a release**, including an urgent fix. It needs an agreed emergency bypass and someone who keeps the checks green.
- **Triggers discussed:** paying users; real families relying on the website rather than Play.
- **To agree:** which checks gate; the bypass and who may use it; how flaky checks are handled.

### Level 4 — After-deploy and scheduled checks on the live site
- **What:** `npm run smoke` runs automatically after each published deploy and on a schedule.
- **Would catch:** a bad deploy or a site that has broken since, without anyone remembering to look.
- **How it could work:** a GitHub Action triggered after the deploy and on a timer, reporting a failure by email.
- **Effect on deployment:** none (it only reports), but it produces alerts that someone must act on.
- **Triggers discussed:** real families relying on the website.
- **To agree:** who receives alerts; how often it runs.

### Level 5 — Android app flows on an emulator
- **What:** drive the real Android app the way a child and parent would.
- **Would catch:** what only exists in the Android app: export through the share sheet (the web version downloads a file instead), the Android Back button, portrait lock, splash and icon, a cold start with no network, sound.
- **How it could work:** a mobile test tool (for example Maestro or Appium) running scripted flows on an Android emulator in GitHub Actions, using the debug APK that `android.yml` already builds.
- **Effect on deployment:** slow (emulator start-up) and more prone to flaky failures than browser tests. It could gate Play releases, which are already started by hand.
- **Triggers discussed:** a Play production launch; Play releases every week or more often.
- **To agree:** which tool; which flows; whether it gates a Play release.

### Level 6 — Performance and real low-end phones
- **What:** measure loading and responsiveness, and check the feel on an inexpensive phone.
- **Would catch:** slow start-up, janky animation, heavy pages.
- **How it could work:** an automated web performance audit (for example Lighthouse in its mobile mode) against a deployed copy; a real low-end phone, owned or from a device-testing service.
- **Effect on deployment:** none unless thresholds are agreed as a gate.
- **Triggers discussed:** none specific in the session.
- **To agree:** which numbers matter; and if a third-party device service is considered, whether giving it the app fits the privacy position (it would not receive any child data, because the app collects none, but it is still an outside party handling the build).

---

## 4. Where the Tests Could Live

Also discussed, not decided.

| Option | What it means | For | Against |
|---|---|---|---|
| **A. In this repo** (today: `scripts/`) | Test scripts sit next to the app code | A screen change and its test update land in one commit (moving the parent settings behind a tab on `2026-11-26` needed 21 test updates in the same change) | The app repo grows; test-only dependencies sit beside app code (the repo already guards the built app's contents, e.g. `distLean.test.js`) |
| **B. A separate test repo** for Tinku | A second repo that points at a deployed address or an APK | Tests any deployed build without touching the app repo; its own pace and tools | Tests and app drift apart: every screen change needs a second change in a second repo; running it on each deploy needs cross-repo triggers |
| **C. A shared testing toolkit repo** plus per-app journeys | Reusable runner and helpers used by several projects | Reuse across future projects | The most set-up; worth it only with more than one project to test |

Discussed as a rule whichever option is chosen: **test code stays outside the shipped app.** Nothing in the app build tests itself.

---

## 5. What Automation Does Not Replace

Automated checks tell you something **broke**. They do not tell you something is **good**:
- whether a 6–8 year old understands a screen (kid test, `L9`);
- how motion, sound and timing feel on an inexpensive phone (a person with the phone);
- store review and policy questions (Play Console).

---

## 6. Agreement Checklist (before any Level in §3 starts)

1. **Why now:** which trigger fired, or what else made it worth doing, with the date.
2. **What it can block or slow:** deploys, Play releases, merges; and the emergency bypass.
3. **Where it runs and who keeps it green**, including what happens with a flaky failure.
4. **Cost:** CI minutes, any paid service, and a privacy check for any outside service that sees the app.
5. **Recorded** in `archive/decisions/DECISIONS.md`; the level's entry here moves from §3 to §1 / §2 as in use.
