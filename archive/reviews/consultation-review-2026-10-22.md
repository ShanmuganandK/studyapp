# Tinku Math: Product Architecture Consultation (third pass: go-live readiness)

**Date:** 2026-10-22
**Reviewed at:** `master` @ `18a61dc`. That is 24 commits (12 substantive) after the second pass at `e6d3039` (2026-10-19).
**Question asked:** *"Is it all good for the final phase, go-live?"*

---

## 1. Verdict

**The code is ready for the closed test. The product is not yet ready for public go-live, and the reason is no longer code.**

Every code-side finding from the 2026-10-19 review was either fixed or explicitly decided within three days. What remains is a sequence of founder steps, the first of which (the signed release build) has **never been run**. Play's rules also mean "go-live" is not one step:

> **Release build → internal test → closed test (12 testers × 14 continuous days) → production review → public link.**

So the realistic public launch is **at least ~3–4 weeks away** from the day the first release AAB uploads, and it is conditional on the closed test meeting the success bar. The "final phase" you're entering is the **closed test**, not go-live itself.

---

## 2. What was verified on this pass

All of this was run locally on `18a61dc` after a clean `npm ci`:

| Check | Result |
|---|---|
| Tests | **694 passed**, 2 skipped, 55 files (up from 602). **Green on the first cold run**: the flake I flagged is fixed (`b6c6dc0`). |
| Lint | 0 errors, 3 warnings (unused `eslint-disable` directives, harmless) |
| `lint:hex` | Clean |
| `privacy:check` | `privacy.html` up to date |
| Build | Passes; precache **768 KB** |
| Android | `targetSdkVersion = 36` (meets Play's API 36 rule), `minSdk 24`, no permissions in the manifest, portrait lock |
| Ready skills | 17 (Grade 1: 7, Grade 2: 10), unchanged |

---

## 3. Previous findings: status

| # | Finding (2026-10-19) | Now | Assessment |
|---|---|---|---|
| 4.1 | Grade 2 suggested path never reached 2-digit add/sub | ✅ **Fixed** (`f0ff437`): the composer skips prerequisites that have no recipe yet. DECISIONS 2026-10-19 records it, and 2026-10-20 labels it an **interim patch**, with place value as the real fix. | Exactly the right shape: the curriculum graph stays truthful, and the patch is honestly labelled. |
| — | (new) Suggestions were not grade-scoped | ✅ **Fixed** (`408a6c1`): a Class 2 child starts on Class 2 skills. | Good. See §5.2 for the caveat this creates. |
| 4.3 | No success bar, no measurement | ✅ **Fixed.** L8 is written down: *"≥7 of 12 children practise on ≥3 different days in week 1 and ≥2 in week 2."* Practice days are recorded on the device and shown in the parent zone ("Days practised", "First week: a of 7"). The dates are included in the export file. | This is the most important change since last time. The closed test is now readable, and the privacy model is untouched: just bare dates, no identifiers, nothing sent. |
| — | Tester protocol | ✅ **Drafted**: `TESTER-PROTOCOL.md`. It recommends recruiting 16–20 for 12 opted in. | Good. It is honest about what's unconfirmed in Play Console. |
| 4.5 | Correct-green contrast 2.28:1 | ✅ **Fixed** (DS-2): now `#16a34a`, measured 3.30:1, which passes the large-text floor. Deep Sea, the failing dark theme, was **removed** rather than shipped broken. | Right calls. DS-1 (an `on-primary` text token) is still open, but is now only needed to bring Deep Sea back. |
| 4.7 | Grade picker layout bug | ✅ **Fixed** (`9623ab8`): Tinku is sized from the hero. | The first screen a family sees is now on the layout system. |
| 4.7 | Cold-run test flake | ✅ **Fixed** (`b6c6dc0`) | Confirmed on my cold run. |
| — | Tester-only controls visible to public parents | ✅ **Fixed** (`de92d02`): "Test settings" is gone, "Colours" is a real parent setting, and the warm-up toggle exists only in builds made with `VITE_TESTER_TOOLS` (the debug APK). The release build excludes it, and a test asserts that. | Removes a confusing "for testing" panel from the public product. |
| — | Monetisation | ✅ **Recorded as a deferred roadmap** (DECISIONS 2026-10-20): free stays a complete learning product, premium is parent conveniences only, nothing is built before the closed test. | Sound principles. "Never paywall the gentler learning path" is the right line. |
| 4.6 | TRACKER L6 drift | ✅ Fixed | — |
| 4.4 | Data Safety answer for Android auto-backup | ❌ **Still open.** `play-data-safety-form.md` does not mention backup at all. | **Blocks L7.** See §4.1. |
| 4.4 | "No INTERNET permission" marked unverified | ⚠️ **Effectively verified but not recorded.** The runbook says the debug APK loaded and played on an S25 Ultra on 2026-10-18, and the manifest has no permissions, so the app works without INTERNET. DECISIONS 2026-10-16 and the manifest comment still say "UNVERIFIED". | A one-line doc fix, and it's a marketable fact. See §4.2. |
| 4.2 | Content is arithmetic-only; teacher review not scheduled | ❌ Unchanged (17 skills) | Acceptable for a closed test. Matters for the listing copy. See §5.1. |
| 4.6 | Documentation volume | ⚠️ Grew again (new `TESTER-PROTOCOL.md`, a longer runbook) | The new docs are *useful* ones, so I'd now call this a P3. |

**Scorecard:** 10 fixed, 1 effectively fixed but unrecorded, 2 open. Two of the three still-open or unrecorded items are small.

---

## 4. Blockers before testers can start (in order)

### 4.1 Decide the Data Safety answer for auto-backup (founder, before L7)
DECISIONS 2026-10-16 turned Android auto-backup **ON** and disclosed it in the privacy policy. But the Data Safety draft, which Play checks against your app and policy, still says only "no data collected, no data shared" with no backup reasoning. In a Designed-for-Families review, a mismatch between the policy and the form is a classic rejection reason, and each rejection costs a review cycle.

- **Action:** read Google's current Data Safety help on Android system backup, decide the answer, and write the answer plus its source URL into `play-data-safety-form.md`.
- **The safe alternative**, if the guidance is ambiguous: turn backup OFF for the closed test. That makes "nothing leaves the device" literally true, and export/import still covers moving phones.

### 4.2 Record the INTERNET-permission result (Code, 5 minutes)
Update DECISIONS (a verified-fact append, with your approval) and the manifest comment: the app runs with no permissions on a real device. Then the store listing can truthfully say *"Works fully offline. Requests no permissions."*

### 4.3 The first signed release build (founder, runbook steps 2–4)
The release build is the biggest remaining **unknown**. It has never run: the upload key, the 4 secrets and the release signing are all untested. Do it **now, while L2 verification is pending**, so any failure surfaces before Play is ready rather than after. The runbook already says this; I'm underlining it.

### 4.4 Play account verification (L2, founder)
This is outside the repo. It is also where the one unverified external assumption lives: **that Play accepts "Stringus" as the public developer name on a personal account.** If it doesn't, the privacy-policy operator line has to change to match (`OPERATOR_LINE` plus `privacy:build`), and that's a small but real re-publish. Find this out before the store listing is written.

### 4.5 Internal test, then the phone walk on the Play build (L5)
Install from the Play internal-test link, not `adb`, and run runbook Part A again. This also settles whether the "App not installed" sideload failure ever affects a Play install (it shouldn't).

---

## 5. Risks to manage during the closed test (not blockers)

### 5.1 Listing copy must match 17 arithmetic skills
`AGENTS.md` already forbids implying "the CBSE syllabus". Hold the store listing (L7) to the same rule, e.g. *"Number and arithmetic practice for Classes 1–2: counting, comparing, add and subtract (with carry and borrow), 3-digit numbers, tables of 2, 5 and 10."* For a closed test of friends and family, the gaps are fine. For the **production** listing, they set parent expectations, and missing shapes, time and money will be the first review complaint.

### 5.2 Class 2 now starts on 2-digit work with no place-value lesson
Grade-scoping (correct) plus the prerequisite-skip patch (correct for now) means a Class 2 child goes straight to 2-digit addition. The assumption is "Class 1 is already cleared". That holds for an on-level Class 2 child, but is weaker for the **average learner**, the stated tie-breaker.

- **Watch** the Class 2 testers' week-1 practice days against the Class 1 testers'. A gap there is the signal to prioritise `g1.num.21-99` and `g1.place.tens-ones`.
- **Tell testers** that Class 2 starts at Class 2 level, and that they can switch the device to Class 1 if it's too hard.

### 5.3 Keep the test clean
- **Freeze engine and pacing changes during the 14 days.** Ship only crash or blocking fixes. Each Android change is a new Play build that every tester must update, and mid-test pacing changes make the L8 result unreadable.
- **Remember: web progress ≠ Android progress.** Testers who tried the website first will start over in the app. `TESTER-PROTOCOL.md` should say this in the first message, not a footnote.
- **The success bar is small-sample.** 7 of 12 is a go/no-go gate, not a statistic. Read the tester comments alongside it.

### 5.4 Content bottleneck after the test
The teacher review of `misconceptions-reference.md` (T95) still gates every new skill, and it is not scheduled. Book it **during** the closed test so content work can start the day the test ends.

---

## 6. Go-live roadmap from here

| Phase | Steps | Owner | Gate to next |
|---|---|---|---|
| **Now** (this week) | §4.1 backup answer · §4.2 INTERNET fact · §4.3 first release AAB · chase L2 · confirm "Stringus" is accepted | Founder (+ Code for §4.2) | A release AAB exists; L2 is verified |
| **Internal test** (days) | Create the app (`com.stringus.tinku` is permanent), upload to Internal testing, install from Play, phone walk (L5) | Founder | It installs and plays from Play |
| **Listing** (overlaps) | L7: honest-scope copy, screenshots (now with the new green), Data Safety, content rating, ages 6–8, Families declarations | Founder | Closed-track review passes |
| **Closed test** (14+ days) | Recruit 16–20, run `TESTER-PROTOCOL.md`, collect day-7 and day-14 practice-day screenshots or exports, freeze tuning, book the teacher review | Founder | L8 met or missed |
| **Decision** | Met: apply for production → public link. Missed: read feedback and practice days before building anything. | Founder | — |
| **After launch** | Place value (`g1.num.21-99`, `g1.place.tens-ones`), which retires the interim composer patch; then money, time, shapes; then Grade 3. Monetisation only after retention is proven, per DECISIONS 2026-10-20. | Code / Antigravity / Chat | — |

---

## 7. Bottom line

The second review asked whether the closed test would teach you anything. **It now will.** The Grade 2 path works, the success bar is a number, the app measures it on the device without breaking the privacy promise, and testers have a protocol.

From the engineering side you are clear for the final phase. What's left is mostly paperwork, and none of it is code:

1. Run the release build once.
2. Get verified on Play.
3. Make the Data Safety form agree with the backup decision.

Do them in that order, and the 14-day clock can start.
