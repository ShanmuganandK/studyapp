# Tinku Math: Product Architecture Consultation (second pass)

**Date:** 2026-10-19
**Reviewed at:** `master` @ `e6d3039`. That is 84 commits and ~8.8k changed lines after the first pass, which was at `776ee28` (2026-09-26).
**Perspective:** an outside product architect, reading the repo cold and checking claims against the code.

---

## 1. Executive summary

**The verdict has changed.** On the first pass the main risk was that engineering polish was outrunning the launch, and the launch was stalled. That risk is now largely retired:

- The domain is live.
- The operator is named.
- A real Android build exists and has run on a phone.
- The README is honest.
- `AGENTS.md` now opens with a frank "content coverage is partial" snapshot.

The project went from *"can this ship?"* to *"what exactly is shipping, and how will we know if it worked?"*

Three things now stand between Tinku and a launch worth having:

1. **The suggested Grade 2 path is still broken.** The composer never recommends 2-digit add/subtract or 3-digit numbers, because they depend on a skill that is never built. This was flagged on 2026-08-22 and again in my first pass. It is still unfixed, and it is now the most important code issue.
2. **There is no measurement plan.** The project now says "Ship, then learn" and "kid-testing is **not** a launch gate". That is a reasonable call, but only if something does the learning. The success bar (L8) is unwritten, the on-device session log is still blocked on a decision, and there are no analytics by design. As things stand, you would ship and learn nothing.
3. **The remaining critical path is all on the founder.** L2 (Play verification), the signed release build, L5, L7, L8 and L9 are human tasks. Code is no longer the bottleneck, and activity spiked in mid-October (22 commits on 10-16 alone) on Android, layout and Tailwind work. The release build is the next code-adjacent gate.

---

## 2. What changed since the first pass

| Area | 2026-09-26 | 2026-10-19 | My read |
|---|---|---|---|
| Domain (L1) | Open | ✅ `tinku.stringus.com`, privacy page verified live | Done right. The "permanent origin" warning is wise, because moving the origin wipes progress. |
| Operator / contact (L6) | Policy named no operator | ✅ "operated by Stringus, based in the UAE", `tinku@stringus.com` | Done. **The TRACKER L6 row still shows open** (minor tracker drift). |
| Android (L4) | Unknown; no project existed | ✅ Capacitor 8, `com.stringus.tinku`, debug APK built in CI on every master merge, run on an S25 Ultra | Big step. The guards are good: a plugin allow-list, a test asserting the manifest permissions, no remote URL or OTA updates. **The signed release AAB has never been built.** |
| Android route | Undecided | LOCKED: Capacitor from the first build (DECISIONS 2026-10-15) | Right call for children's data: no later migration that strands progress. The cost is that every content change needs a Play release. |
| Auto-backup | n/a | ON, disclosed in the policy, guarded by a test | Good, honest trade-off. **The Play Data Safety answer for backup is still undecided.** See §4.4. |
| Workflow | Direct commits to master | PRs (#18–#56), Dependabot, CI on Android | Much healthier. This closes the "unreviewed push to master" risk structurally, not just by rule. |
| Build size | 2.2 MB precache, 225 KB JS | **765 KB precache** (with a size guard), 237 KB JS | Excellent for low-end Android. |
| Tailwind | v3 | v4, verified with an 18-screen screenshot diff | Well executed. Removes 11 build-time audit advisories. |
| Quiz layout | Ad hoc | One spacing budget, no bottom nav during a question, portrait lock, `layout:check` | Real-device feedback acted on fast. **Only the quiz and summary use it.** The grade picker has a known layout bug. |
| README / AGENTS.md | Stale, over-claimed | Honest; Grade 3 "coming soon"; content gaps listed | Strong. This is the trust posture a kids' listing needs. |
| Design system | Tokens only | `design-system/` DS-1…DS-8, handoff pack | Good audit. **DS-2 is an accessibility defect, not a nice-to-have** (§4.5). |
| Tests | 534 | **602 pass**, 2 skipped, 49 files | Healthy. On the first run right after `npm ci`, 3 tests failed; three reruns were all green. Probably a cold-run timing flake. Worth tracking, since one was fixed before (#9a). |
| Grade 2 suggested path | Broken | **Still broken** | See §4.1. |
| Content coverage | 17 ready / 35 planned | **17 ready / 35 planned** (unchanged) | No new skills in a month. See §4.2. |
| Kid-test log / success bar | Blocked / unwritten | **Still blocked / unwritten** | See §4.3. |
| Frozen legacy code | Present | Still present (`QuizEngine`, `AdventureLadder`, `utils/*`, `modules/*`) | No change. Lower priority now that the bundle is small. |
| Markdown volume | ~8.3k lines | **~9.6k lines** (plus 6 new top-level docs) | Still growing faster than the product. See §4.6. |

---

## 3. What is working (keep doing this)

1. **The engine.** Questions come from recipes, wrong-answer options encode misconceptions, and difficulty is capped per skill. Nothing in the last month needed engine changes, which is a sign it's stable.
2. **The privacy position as a moat.** Fully offline, **no Android permissions requested at all** (not even INTERNET; the decision record marks this unverified on a device), no analytics, and guarded by tests. Even the backup trade-off was disclosed rather than hidden. For a Designed-for-Families listing aimed at Indian parents, this is a competitive feature. Say it in the store copy.
3. **Founder decisions are written down with their trade-offs.** The Capacitor-vs-TWA entry is a model decision record: it gives the options, the costs, the irreversible parts (appId, origin) and a revisit trigger.
4. **Turnaround on device feedback.** The S25 Ultra issues (empty space, mascot shrinking, tray overflow) became a layout algorithm plus a guard proven to fail first, within two days.
5. **Honesty about scope.** Showing Grade 3 as "coming soon", and the explicit "do not imply CBSE syllabus" instruction, protect the asset that matters most: parent trust.

---

## 4. What is not working (in priority order)

### 4.1 P0: the suggested Grade 2 path never reaches the core Grade 2 skills
`src/recipes/skillMap.js`:
- `g2.num.3digit`, `g2.add.2d-nocarry` and `g2.sub.2d-noborrow` require `g1.place.tens-ones`.
- `g1.place.tens-ones` is `planned` and requires `g1.num.21-99`, which is also `planned`.
- `composer.js` treats a missing prerequisite as locked.

**Effect:** a Grade 2 child who follows Tinku's suggestion is walked only through ×2, ×5 and ×10. Two-digit add/subtract with carry and borrow (the heart of Class 2) only appears if someone taps the card by hand. On the home path, the "next" node a parent sees will look wrong to anyone who knows the syllabus.

TRACKER has recorded this as "intended trip behaviour, not a bug" since 2026-08-22. That framing expired when the launch became public. **It needs a DECISIONS entry and a fix before the closed test**, because a closed test on a broken path produces misleading retention data.

Options, cheapest first:
1. **Composer rule:** a `planned` prerequisite counts as satisfied (or is skipped) when suggesting. It's one function plus tests, and the curriculum graph stays truthful.
2. **Rewire the edge now:** have the 2-digit skills depend on `g1.add.within20` / `g1.sub.within20` until place value ships.
3. **Build `g1.num.21-99` and `g1.place.tens-ones`.** These are pedagogically right, but blocked on misconception tables and the teacher review.

Recommendation: do (1) now and (3) next. (1) also stops the same class of bug from recurring as more planned skills appear.

### 4.2 P1: content coverage and the listing claim
There are 17 ready skills, all number and arithmetic. Shapes, measurement, time, money, data, patterns and place value are absent, and no skills shipped this month. `AGENTS.md` already instructs agents to describe only what exists. Make sure the **store listing** (L7) follows the same rule: position it as **"Number & arithmetic practice for Classes 1–2"**, not a full CBSE companion.

Then plan the next content in this order: place value, money (₹ is a local differentiator), clock time, then shapes. All are gated on the teacher review of `misconceptions-reference.md` (T95), which nothing currently schedules. **Put the teacher review on the calendar.** It is the content bottleneck.

### 4.3 P1: "ship, then learn" has no "learn"
The stance changed from "kid-testing is the gate" to "the launch is the signal source." Fine. But:
- **L8 (success bar) is unwritten.**
- **The kid-test session log is still blocked** on a DECISIONS entry (TRACKER, Testing framework).
- With no analytics (by design), the only retention data is what testers tell you.

A 12-tester × 14-day closed test can only be read if you agree up front what counts as success, and how each tester's number reaches you. A minimum viable answer that keeps the privacy model intact:
1. Write L8 as one sentence. For example: "≥7 of 12 children practise on ≥3 separate days in week 1 and ≥2 days in week 2."
2. Show **days practised** and **last practised** in the parent dashboard (computed on-device, no identifiers).
3. Testers send a screenshot or the existing progress export on day 7 and day 14. **No new data path needed.**
4. Ship the fuller session log later, as already scoped (default off, parent-exported).

### 4.4 P1: Play Data Safety and the backup answer
Auto-backup is ON and disclosed in the policy, which is good. The Data Safety form still has to say whether data is "collected" or "shared". This is an open founder decision (TRACKER line ~269). Read Google's current Data Safety guidance on Android system backup **before** L7, and record the answer and its source in `play-data-safety-form.md`. A Designed-for-Families rejection over a form mismatch costs a review cycle.

Also: the "no INTERNET permission" claim is marked **unverified on a device**, yet the debug APK has now run on a phone. Record the result. If it ran without INTERNET, that's a verified, marketable fact; if INTERNET was added back, the Data Safety basis changes.

### 4.5 P1: accessibility of the "correct" state (DS-2)
White text on correct-green is **2.28:1**, below even the 3:1 floor for large text, and Deep Sea CTA text is 2.06:1. This is the most frequent positive moment in the app, and it fails contrast for exactly the users with less-than-perfect vision. DS-1 + DS-2 (an `on-success` token and a deeper green, keeping the locked colour meaning) is a small change. Do it before the store screenshots are taken, so the listing doesn't show the defect.

### 4.6 P2: documentation load
There are now ~9.6k lines of markdown plus `AGENTS.md`, a `CLAUDE.md` stub, `ANDROID-BUILD-PLAN.md`, `ANDROID-RELEASE-RUNBOOK.md`, `design-handoff/` and `design-system/`. TRACKER passed 1,700 lines, and already has drift: the L6 row shows open while AGENTS.md says done. The PR workflow now captures history, so:
- Trim `TRACKER.md` to Launch / Now / Blocked / Next. Move the "Done" narratives to PR descriptions or an archive file.
- Use one rule: if git log or a PR holds it, the tracker links to it rather than repeating it.

The discipline that produced this process was right. The volume is now a tax on a solo founder's attention.

### 4.7 P2: smaller items
- **Grade picker layout bug** (content stops half-way). It's the *first* screen a new family sees, so move it onto the spacing budget before L5.
- **Phone installer sideload failure** ("App not installed"; `adb` works). Testers on Play won't hit it, but anyone sideloading a link will. Note it in tester instructions, or find the cause (often a signature or versionCode conflict with a prior install).
- **The cold-run test flake.** Track it; don't let CI become "rerun until green".
- **Frozen legacy code.** Set a deletion milestone, e.g. "after the closed test".
- **The `STANDARDS.md` mascot-shrink clause** is superseded by DECISIONS 2026-10-18 but not updated (the entry itself says Chat/founder should update it).

---

## 5. Roadmap

### Phase A: release-ready (≈1–2 weeks)
| # | Step | Owner |
|---|---|---|
| A1 | Finish Play Console identity verification (L2). Confirm Play accepts "Stringus" on a personal account. | Founder |
| A2 | Generate the upload key, add the 4 secrets, run the **release AAB** workflow once, and upload to internal testing. | Founder (runbook exists) |
| A3 | **Fix the Grade 2 suggestion path** (§4.1, option 1) with a DECISIONS entry. | Founder decides → Code |
| A4 | DS-1 + DS-2 contrast fix; grade picker onto the spacing budget. | Code |
| A5 | Record the INTERNET-permission result from the real device; decide and document the Data Safety backup answer. | Founder + Code |
| A6 | Mark L6 done in TRACKER; update the STANDARDS §5 wording. | Code / Chat |

### Phase B: listing and measurement (≈1 week, can overlap A)
| # | Step | Owner |
|---|---|---|
| B1 | **Write L8**, the success bar, as one sentence with numbers. | Founder |
| B2 | Show "days practised / last practised" in the parent dashboard (on-device only). | Code |
| B3 | Tester protocol: install notes (Android progress ≠ web progress), day-7/day-14 check-in, what to send. | Founder |
| B4 | Store listing (honest scope copy, screenshots *after* A4), Data Safety, content rating, ages 6–8, Designed-for-Families (L7). | Founder |
| B5 | Phone regression walk on the release build and the new domain (L5). | Founder |

### Phase C: closed test (14+ days)
| # | Step | Owner |
|---|---|---|
| C1 | 12 testers × 14 days (L9), ideally including several families outside your own circle. | Founder |
| C2 | **Freeze engine tuning during the test.** Collect only bug fixes and tester comments. | All |
| C3 | Unblock and build the session log in parallel, for post-launch kid tests. | Chat → Code |

### Phase D: decide from evidence
| # | Step |
|---|---|
| D1 | Met the bar: apply for production; public link; resume kid-testing in India. |
| D2 | Missed the bar: read tester feedback and dashboards before writing features. Likely levers: the session length and opening, the reward loop, the suggested path. |
| D3 | Content track (after the teacher review): `g1.num.21-99` and `g1.place.tens-ones` (which also properly fixes §4.1), then money, time and shapes. Then Grade 3. |
| D4 | Deferred tier (accounts, sync, paywall) only after traction. Budget DPDP counsel then; Rule 10 commences 13 May 2027. |

---

## 6. Bottom line

A month ago the question was "can a solo founder actually ship this?" The answer is now clearly yes. The infrastructure, Android build, privacy story and honesty of the copy are launch-grade.

The new question is **"will the closed test teach us anything?"** Today it wouldn't, for two reasons: the suggested Grade 2 path is broken, and nobody has written down what success looks like. Both are small fixes: one composer rule, and one sentence in L8. Do those two before you spend 14 days of 12 families' time.
