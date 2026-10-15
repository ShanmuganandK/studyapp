# Android build plan: Capacitor (TRACKER L4)

> **Status: plan only. No `android/` project or Capacitor dependency exists yet.** The route is
> **decided: Capacitor from the first build**, recorded in `DECISIONS.md` (2026-10-15), which also holds
> the TWA alternatives considered and the binding constraints. `TRACKER.md` L4 is the status source.

## Why this is the long pole
The closed test (L9: 12 testers x 14 days, personal Play account) needs an **uploaded build**, so the
14-day clock cannot start until phase 3 below produces a signed AAB. Phases 1-2 are safe to do in
parallel with L2 (account verification) and L7 (listing).

## Constraints that shape every phase
- **Privacy claim must stay true.** No network client, analytics, ads or accounts. Every Capacitor
  plugin is a new privacy surface, so plugins are **allow-listed** (phase 2 guard).
- **Origin changes.** Inside the app the origin is `https://localhost` (Capacitor), so `localStorage`
  is **separate from the web app**. Existing web progress does not carry over; the existing
  export/import is the migration path. Say so in the tester notes.
- **Offline from install.** The app bundles `dist/` (0.9 MB), so it works with no first online load.
- **Target API 36**, AAB, Play App Signing (new apps from 2026-08-31).
- **This sandbox cannot build Android** (Google's SDK/Maven hosts are unreachable). Builds run in
  GitHub Actions or on the founder's machine.
- Production web origin `tinku.stringus.com` is untouched. Android is an additional delivery, and
  iOS stays later (DECISIONS: "Android first, iOS later").

## Phase 1: Prepare the web code (no Android needed, fully testable here)
1. **Export/import via Capacitor** behind the *same* `useProgressBackup` API (ARCHITECTURE "Capacitor
   gap"). Add a small `services/fileTransfer.js` seam: web = today's Blob/`<a download>`/file input;
   native = `@capacitor/filesystem` write to cache + `@capacitor/share` share sheet, and the
   WebView's file input for import (Android WebView supports it; verify on device).
2. **Service worker in the WebView:** the PWA SW is unnecessary inside Capacitor and can interfere
   with updates. Do not register it when `Capacitor.isNativePlatform()`.
3. **Haptics (T72)** via `@capacitor/haptics`, only if T72 is still wanted. Decide before adding.
4. **Back button:** Android hardware back must not exit mid-session. Use `@capacitor/app`
   `backButton` to route to the in-app "leave session?" path. Confirm the current behaviour first.
5. Tests for the seam in both modes (mock the Capacitor global).

## Phase 2: Add the Android project and guards
1. `npm i @capacitor/core @capacitor/cli @capacitor/android` plus only the plugins from phase 1.
   `capacitor.config.ts`: `appId` (**founder decision**, permanent once on Play, e.g.
   `com.stringus.tinku`), `appName` from `brand.js` (`Tinku Math`), `webDir: 'dist'`, no `server.url`
   (never load a remote URL), `androidScheme: 'https'`.
2. `npx cap add android` and commit `android/` (without `local.properties`, `build/`, keystores).
3. **Guards (prove each RED first):**
   - plugin allow-list test: `package.json` may only contain the listed `@capacitor/*` packages;
   - `AndroidManifest.xml` permission test: only the permissions we expect. Remove `INTERNET` if the
     app truly needs none. **Unverified:** confirm the WebView still serves the bundled app without
     it before relying on this, and keep the Data Safety form consistent with whatever ships;
   - `capacitor.config` has no `server.url` / cleartext;
   - `distLean` keeps guarding what goes into the bundle.
4. Android resources from Tinku art: launcher icon (adaptive, from the maskable PNG), splash (Tinku on
   `--color-primary-soft`), status/nav bar colours from tokens. Extend `scripts/build-icons.py`.
5. Disable Android auto-backup of app data, or decide to allow it: **founder decision** (progress is
   child data on the device; the privacy policy says nothing leaves the device, and cloud backup would
   contradict that unless the policy says so).

## Phase 3: Build, sign, ship to the closed test
1. **GitHub Actions** `android.yml`: Node 22, JDK 17, Android SDK, `npm ci`, `npm run build`,
   `npx cap sync android`, `./gradlew bundleRelease`. Upload the AAB as an artifact. Runs on tag or
   manual dispatch, not every PR.
2. **Signing:** use **Play App Signing**. Generate an *upload key*, keep it and its password in GitHub
   Actions secrets only (**never in the repo**; the keystore is gitignored). The founder creates the
   key; Code wires the workflow.
3. Upload the AAB to an **internal testing** track first (no review), then the closed test (L9).
4. Verify on a real low-end Android phone: install, offline launch, full session, parent gate,
   export/import via the share sheet, back button, rotation, launcher icon, splash.

## Phase 4: Store compliance (L7, human-led, Code supplies facts)
- Data Safety: "no data collected/shared", true only if phase 2 guards pass and the built manifest has
  no unexpected permissions. **Measure the built APK/AAB**, don't infer.
- Designed for Families requirements, content rating questionnaire, target audience (children).
- Privacy policy URL: `https://tinku.stringus.com/privacy.html` (already live).
- Store text must describe what exists (CLAUDE.md "Don't over-claim content").

## Open decisions for the founder
1. `appId` / package name (permanent).
2. Auto-backup on or off (see phase 2.5).
3. Haptics now or later (T72).
4. Who runs the first build: GitHub Actions (recommended; reproducible) or a local Android Studio.
5. Play will show the developer name from the account profile. Confirm "Stringus" is accepted for a
   personal account (unverified).

## Suggested PR order
1. This plan + TRACKER/DOCMAP pointers (this PR).
2. Phase 1 (web seams, tests). Mergeable and deployable with no Android project.
3. Phase 2 (`android/`, config, guards, resources).
4. Phase 3 (workflow). Then the first AAB goes to internal testing.
