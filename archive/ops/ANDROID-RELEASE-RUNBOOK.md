# Android release runbook (founder steps)

> Companion to `ANDROID-BUILD-PLAN.md` (Phase 3). **Steps for the human; Claude Code cannot do these.**
> The workflow is `.github/workflows/android.yml` (debug builds run automatically on each merge to master; the release build is started by hand). Play Console screens change, so where a
> step names a Play screen, check the wording against what you see. Never paste a password, the keystore, or
> its base64 into a chat, an issue, a commit or a PR.

## Status (2026-10-28)

Steps 1-4 below are **done**: the upload key exists (kept outside the repo), the `android-release` environment
and its 4 secrets are set, and the first `release` run built and signed `app-release.aab` (run 40740533738).
Play identity verification (L2) completed 2026-10-27. **Next is step 5**: create the app in Play Console and
upload the AAB to Internal testing. Part A was walked **in part** on 2026-10-28 (ticked below); the unticked
items are not yet checked.

**Debug APKs are signed with a different key on each CI run.** `adb install -r` over an older copy fails with
`INSTALL_FAILED_UPDATE_INCOMPATIBLE`; run `adb uninstall com.stringus.tinku` first (this deletes the app's
on-device progress, so export it first if it matters). This is also the likely reason the phone's own installer
once said "App not installed" (not confirmed).

## The short version (2026-10-21)

Parts A-D below hold the detail; this is the order. **You** do every step: Claude Code cannot make the key, set
the secrets or use Play Console, and no secret should ever be pasted into a chat.

| # | Step | Where | Needs |
|---|---|---|---|
| 1 | Walk the latest **debug** APK on a phone (Part A) | GitHub Actions + `adb install -r` | nothing |
| 2 | Make the **upload key** and back it up in two places (Part B) | your computer, outside the repo | a JDK |
| 3 | Create the `android-release` **environment** and its **4 secrets** (Part C) | GitHub → Settings → Environments | step 2 |
| 4 | **Run workflow → `build_type: release`**, approve it, download `tinku-release-aab` (Part D 1-2) | GitHub Actions | step 3 |
| 5 | **Create the app** in Play Console, upload the AAB to **Internal testing**, install from the Play link, repeat the Part A checklist (Part D 3) | Play Console | L2 (account verified) |
| 6 | Store listing, **Data Safety**, content rating, target audience, Families declarations (TRACKER L7) | Play Console | step 5 |
| 7 | **Closed testing**: 12+ testers for 14 days; run it with `TESTER-PROTOCOL.md` (TRACKER L9) | Play Console + email | step 6 |

Steps 1-4 do not need Play verification (L2), so do them while it is pending. **Not verified yet:** the
workflow has only ever built the **debug** APK. `bundleRelease` (signing, release build type) has **never been
run**, so the first release run may fail for a reason nobody has seen; if it does, send the failing step's log
text (not any secret) to Claude Code. The Play Console wording is also unconfirmed (screens change).

The **release** bundle is built without `VITE_TESTER_TOOLS`, so it has no warm-up toggle (only the debug APK has
it; `androidWorkflow.test.js` checks this). Everything else (Class, Colours, practice days) is in both.

## Part A: Test the app on a phone first (no key needed)

1. GitHub → **Actions** → **Android build** → **Run workflow** → `build_type: debug`.
2. When it finishes, open the run. Two things to look at:
   - **Summary → "Measured APK permissions"**: the permissions read out of the real APK. The only line
     should be `...DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (an app-private one that every AndroidX app
     has). If the run **failed** on an unexpected permission, tell Claude Code: do not upload anything.
   - **Artifacts → `tinku-debug-apk`** (download the zip, unzip it: `app-debug.apk`).
3. Put `app-debug.apk` on an Android phone and walk through it. **`adb install -r <full path to app-debug.apk>`
   is the route proven to work** (Android Studio → Running devices over wireless debugging; a Samsung S25 Ultra
   installed this way on 2026-10-18). Sending the file to the phone and installing through its own installer
   (Files, Samsung's installer) **failed with "App not installed"** on that phone; the cause was never found,
   and the APK itself was proven valid. If you must sideload by hand and it fails, use `adb` instead.
   Then walk through it:
   - [x] The class picker appears and the app loads. **Verified 2026-10-18 on a Samsung S25 Ultra:** the debug
     APK has no INTERNET permission and still loads and plays quizzes. (A blank white screen on another phone
     = tell Claude Code; the fix would be one line.)
   - [ ] A quiz plays, sound works, Tinku shows. **No Home/Parent bar during a question** (it returns on the
     "Great job!" summary), and **rotating the phone does not rotate the app** (portrait lock).
     *2026-10-28: quiz plays, Tinku shows, no Home/Parent bar during a question verified; sound, the summary
     bar and the rotation lock not yet checked.*
   - [ ] A counting question with 11-15 objects (3 rows) fits without clipping.
   - [x] **First launch (fresh install):** the class picker shows a large Tinku with nothing cut off (2026-10-20 layout).
   - [x] A **correct** answer tile reads clearly in the deeper green (2026-10-20).
   - [ ] Parent zone shows **Class** and **Colours** sections (no "Test settings"), and **"Days practised"** after you
     finish one round. The **Warm-up** toggle shows **only in this debug APK**, never in a Play build.
   - [x] A fresh install set to **Class 2** suggests **Hundreds Club** first (2026-10-20).
   - [ ] Parent zone → **export progress** opens the phone's share sheet and a file can be saved.
   - [ ] The **Back** button: closes the parent PIN box; leaves a quiz or the parent zone for the skill
     list; only leaves the app from the skill list.
   - [ ] The launcher icon is Tinku; the splash shows Tinku on a pale background.
   - [ ] Switch to airplane mode, kill the app, reopen: it still works.
4. Report what you saw (screenshots help). The debug APK is for you only: **do not upload it to Play**.

## Part B: Make the upload key (once)

You need a JDK for `keytool` (any recent one; or use the one inside Android Studio). Run in a **private
folder outside the repo** (not inside `studyapp/`):

```
keytool -genkeypair -v -keystore tinku-upload.jks -alias tinku-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

It asks for a keystore password, a key password and some identity fields (name/organisation are free
text; use `Stringus`). **Write the two passwords down in a password manager now.**

**Back up `tinku-upload.jks` and both passwords in two places** (password manager attachment + an
encrypted drive). With Play App Signing the upload key *can* be reset through Play support if lost, but
that is slow and manual; it is not something to rely on.

This is an **upload** key. Google holds the real app-signing key once you enrol in Play App Signing
(Part D), so a leaked upload key can be replaced, but treat it as a secret anyway.

## Part C: Give the key to GitHub (secrets)

1. Turn the keystore into one line of text:
   - macOS: `base64 -i tinku-upload.jks | tr -d '\n' | pbcopy`
   - Linux: `base64 -w0 tinku-upload.jks`
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("tinku-upload.jks")) | Set-Clipboard`
2. GitHub repo → **Settings → Environments → New environment** → name it exactly `android-release`.
   Optional but recommended: tick **Required reviewers** and add yourself, so each release needs an
   approval click.
3. In that environment → **Environment secrets → Add secret**, four of them, **exact names**:

   | Secret | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | the one line from step 1 |
   | `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
   | `ANDROID_KEY_ALIAS` | `tinku-upload` |
   | `ANDROID_KEY_PASSWORD` | the key password |

4. Clear your clipboard. Do **not** put these in repository-level secrets (the environment keeps them
   away from every other job) and never in a file in the repo (`.gitignore` blocks `*.jks`/`*.keystore`,
   and a test fails the build if one is committed).

## Part D: First signed build and Play

1. **Run workflow** → `build_type: release` (approve if you added a reviewer). The `debug` job and its
   permission check run first; then `release` builds the signed AAB.
2. Download **Artifacts → `tinku-release-aab`** (`app-release.aab`).
3. In Play Console (personal account; L2 verification must be complete first):
   - **Create app**: name from `src/config/brand.js` ("Tinku Math"), free, app (not game), the
     declarations Play asks for. Package name is fixed by the first upload: **`com.stringus.tinku`**.
   - Choose **Play App Signing** (the default for new apps) when you upload.
   - Upload the AAB to **Internal testing** first, add yourself as a tester, install from the Play link,
     and repeat the Part A checklist on that install.
   - Fill the store listing, **Data Safety**, content rating, target audience (children) and the
     Designed-for-Families declarations (TRACKER L7). **Data Safety**: copy the measured permission list
     from the workflow summary; the answer about the phone-level backup (DECISIONS 2026-10-16) is yours.
     Privacy policy URL: `https://tinku.stringus.com/privacy.html`.
   - Then **Closed testing** with 12+ testers for 14 days (TRACKER L9).
4. Every later upload needs a higher version code. The workflow sets it to the run number automatically.

## If something goes wrong

- **Release job says `ANDROID_KEYSTORE_BASE64 is not set`**: the secrets are on the wrong place (repo vs
  `android-release` environment) or the environment name is misspelled.
- **Release job fails at signing**: a password or the alias is wrong. Re-add the secret (secrets can't
  be read back, only replaced).
- **You think a secret leaked**: delete the four secrets, make a new upload key (Part B), and ask Play
  support/Console to register the new upload key; the old one can then be retired.
