# CURRENT_STATE.md — Live Status, Release & Closed-Test Operations

> **Scope (Single Source of Truth):** Current shipped state, live web/Android release status, active Play Console / Data Safety / Designed-for-Families operations, and the closed-test protocol.
> - System design & storage schemas live in [`ARCHITECTURE.md`](ARCHITECTURE.md).
> - Product/curriculum/design future direction lives in [`ROADMAP.md`](ROADMAP.md).
> - Identified code, flag, boundary, lint, and test-coverage issues live in [`TECH_DEBT.md`](TECH_DEBT.md).
> - Historical sprint logs and superseded plans live in `archive/` (do not revive them as active status).

_Last verified against codebase: `2026-11-23`._

---

## 1. Current Shipped Baseline

- **Product & Scope:** **Tinku Math** (`tinku-math`, Android package `com.stringus.tinku`, Grades 1–2, region-neutral `🪙` currency, no `"CBSE"` in app name or description — see `src/config/brand.js`).
- **Curriculum:** **`36 / 36` `ready` skills** (`19` Grade 1, `17` Grade 2, `0` Grade 3) across `27` recipe modules (`src/recipes/skillMap.js`, `src/engine/sessionLite.js`), `11` top-level question formats (`+ 16` `mcq` `render.kind` sub-archetypes), **`85 / 85` concise spoken-ready misconception hints** (`<= 10` words, `src/engine/hints.js`), **`84 / 84` diagnostic parent coaching tips** (`src/engine/parentCoaching.js`), and **`36 / 36` kid-first SVG skill medallions** drawn from the `--color-illo-*` illustration palette (`src/components/SkillIcon.jsx`).
- **Privacy & Network Posture:** 100% device-local (`localStorage`), zero accounts, zero cloud sync, zero analytics, zero ads, zero payments, zero off-origin requests, and **zero Android OS `<uses-permission>` entries** (only AndroidX's app-private `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` in the merged APK manifest, verified on a real Samsung S25 Ultra running without `INTERNET`).
- **Web PWA:** Live at `https://tinku.stringus.com` (Netlify serving `dist/`), with public privacy policy at `https://tinku.stringus.com/privacy.html` (generated from `src/config/privacyPolicy.js`; operator line: `"operated by Stringus, based in the UAE"`, contact: `tinku@stringus.com`).
- **Automated Verification Baseline:** `68 / 68` Vitest files (`889` passed, `2` intentional `dist/`-presence conditional skips = `891` total), `npm run lint` (`0` errors, `0` warnings), `npm run lint:hex` clean, `npm run privacy:check` clean. All `TD-1`–`TD-8` tech-debt items resolved (`archive/legacy-code/` holds archived legacy modules and `?home=cards`).

---

## 2. Launch Order & Release Status

| # | Milestone | Status | Notes |
|---|---|---|---|
| L1 | Permanent web origin (`https://tinku.stringus.com`) | **Done** (`2026-09-29`) | Live over HTTPS; `/privacy.html` verified and excluded from SW navigation fallback. |
| L2 | Play Console personal account + identity verification | **Done** (`2026-10-27`) | Identity verified for Stringus developer account; developer name must match `OPERATOR_LINE` in `src/config/privacyPolicy.js`. |
| L3 | First-run grade picker + Grades 1–2 positioning | **Done** (`2026-09-26`) | `GradePickerScreen` gates first launch (`!gradeChosen`). |
| L4 | Android Capacitor 8 wrapper + signed release AAB | **AAB built** (`2026-10-28`) | Upload key stored outside repo; GitHub `android-release` environment + 4 secrets configured; signed `app-release.aab` built via `.github/workflows/android.yml` (`build_type: release`) and verified with `jarsigner`. |
| L5 | Internal / phone regression walk on Play build | **Partial** | Core quiz, picker, green contrast, and Back navigation verified on Samsung S25 Ultra (debug APK). Still unchecked on Play install: sound, rotation lock, 11–15 object counting tray, Parent screen full walk + `Days practised`, share-sheet export, Back from skill list & PIN modal, icon/splash, airplane mode cold reopen. |
| L6 | Privacy policy operator line + contact | **Done** (`2026-10-13`) | `"operated by Stringus, based in the UAE"`, `tinku@stringus.com`. |
| L7 | Store listing, Data Safety, content rating, target age (`Ages 6–8`), Designed for Families | **In progress / verify** | Confirm Android `allowBackup="true"` Data Safety alignment (§4 below) and Play listing copy (no `"CBSE"` in name/description; honest Grades 1–2 scope). |
| L8 | Closed-test success bar + on-device measurement | **Done** (`2026-10-20`) | Bar: **>= 7 of 12 real-child testers** practise on **>= 3 distinct days in week 1** and **>= 2 distinct days in week 2**. Measured on-device via `tinku:v1:practiceDays` and exported in `tinku-math-progress-*.json`. |
| L9 | Closed test (`12+` testers × `14` continuous days) | **Active** (started `2026-11-11`) | Freeze engine/pacing changes during the 14-day window; ship crash/blocking fixes only. Protocol in §5 below. |

---

## 3. Deploy & Release Operations

### 3.1 Web PWA Deploy Verification (Standing Rule)
A stale service-worker cache and a stale Netlify deploy produce identical symptoms. After every deploy:
1. Open `https://tinku.stringus.com` in a **private/incognito window** first (bypasses the service worker).
2. Confirm the Netlify **Published** deploy commit SHA matches `master` `HEAD`.
3. To clear a stale installed PWA on mobile: uninstall from home screen → clear site data → revisit.

### 3.2 Android Builds (`.github/workflows/android.yml`)
- **Debug APK (auto on `master` push, or manual `build_type: debug`):** Builds with `VITE_TESTER_TOOLS=true` (enables the Parent Zone warm-up toggle) and verifies via `aapt2` that the merged manifest contains only `com.stringus.tinku.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Note: each CI debug run signs with a fresh debug key, so `adb install -r` over an older CI debug APK requires `adb uninstall com.stringus.tinku` first (export progress beforehand if needed).
- **Signed Release AAB (manual `workflow_dispatch` → `build_type: release`):** Runs in the protected `android-release` environment using the 4 secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) without `VITE_TESTER_TOOLS`. Never paste keys/passwords into chat, issues, or commits. Every Play upload requires a higher `versionCode` (set automatically from the workflow run number).
- **Sideloading debug APKs:** Use `adb install -r <path-to-app-debug.apk>` rather than a phone's file-manager installer.

---

## 4. Play Console Data Safety & Designed-for-Families Reference

Every answer below rests on live build guards (`noFirebaseAuth.test.js`, `distLean.test.js`, `analytics.test.js`, `androidProject.test.js`, `privacyPolicy.test.js`). **If any future build adds a network call, SDK, account, or purchase, re-answer this section before shipping.**

| Play Console Field | Answer | Verified Basis |
|---|---|---|
| Does your app collect or share required user data? | **No** | Zero accounts, zero analytics/ads/third-party network SDKs, zero off-origin requests, zero OS `<uses-permission>` entries. Progress stays in device-local `localStorage` (`tinku:v1:*`). |
| Account creation / deletion | **App does not allow account creation** | Auth seam (`src/services/localAdapter.js`) is an inert null-user adapter. |
| Privacy policy URL (store listing + Data Safety) | `https://tinku.stringus.com/privacy.html` | Public HTTPS page generated from `src/config/privacyPolicy.js`; also readable offline inside Parent Zone. |
| Listing title & description | Title: `Tinku Math: Maths for Kids` (26/30) | Matches `PRODUCT_NAME` (`Tinku Math`) in `src/config/brand.js`. Keep `"CBSE"` out of both title and description (`brand.test.js:78-84`). |
| Target age band | **Ages 6–8** (Grades 1–2) | Declared only in Play Console (omitted from privacy policy to prevent drift). |
| External link (Parent Zone `mailto:tinku@stringus.com`) | Parent-initiated, behind `ParentGateModal` | App transmits nothing; opens parent's email app. Confirm current Designed-for-Families external-link wording on submission. |
| **Open check — Android Auto Backup (`allowBackup="true"`)** | **Verify against Google Data Safety backup guidance before production submission** | `android/app/src/main/AndroidManifest.xml:5` enables `android:allowBackup="true"` (disclosed in `src/config/privacyPolicy.js:109-112` as Google-managed device backup). Confirm whether Play Data Safety requires no extra disclosure (OS-level backup) or if `allowBackup` should be toggled `false` to keep "nothing leaves the device" strictly literal alongside Parent Zone export/import. |
| Platform logs / Play Vitals | Not app collection | Hosting logs and Play Vitals are platform-delivery records disclosed in the privacy policy's "Standard technical information" section, not Data Safety app collection. |

---

## 5. Closed-Test Protocol (L9)

- **App measurement (code-verified):** Completing a session records the phone's local `YYYY-MM-DD` date in `tinku:v1:practiceDays` (no names, skills, or timestamps). Week 1 = first practice day + next 6 days; Week 2 = following 7 days. Parent Zone displays `Days practised`, `First week: a of 7 days`, and (after day 7) `Second week: b of 7 days`, and includes `practiceDays` in the JSON backup export.
- **Cohort & rules:** Recruit `16–20` testers to maintain `>= 12` opted in for `14` continuous days. One child per phone (shared phones are marked non-scorable). Assign anonymous tester codes (`T01`, `T02`, …) stored **outside the repo**; never collect a child's name or photo. All tester replies go to `tinku@stringus.com` with the tester code in the subject. Note to testers upfront that web PWA progress does not transfer automatically to the Android Play install.
- **Who counts toward L8:** Only testers confirming a real child in Grade 1 or 2 used the app count toward the `7 / 12` retention bar (`week 1 >= 3 days` and `week 2 >= 2 days`). Developer/swap testers help catch crashes/layout bugs and are tracked separately. Fewer than 12 real-child testers = `"not enough signal"`, not pass/fail.
- **Touchpoints:**
  - **Day 0:** Send Play opt-in link, tester code, one-child-per-phone & do-not-uninstall/clear-data note, and ask whether a Grade 1–2 child will use it.
  - **Day 3:** Optional install-check nudge only if they have not opened the app (never nudge to play more often).
  - **Day 7:** Request a Parent Zone screenshot (`Days practised` + `First week`).
  - **Day 14:** Request Parent Zone → `Export progress` JSON file (fallback: screenshot) plus 3 optional questions: *(1) Did your child ever ask to play without being told? (2) Too easy, too hard, or about right? (3) Did anything confuse you or your child?*
  - **Day 15+:** Score against the pre-committed cohort rule; if missed, treat as a product signal (not a bug) before changing pacing or building new features.
