# Spec — Wire Mastery into Gameplay + Local Persistence (anonymous, build-safe)

**Goal:** Connect the pure mastery engine to actual gameplay and make progress survive between sessions — so a child plays a quiz, mastery updates, it's saved on-device, and next time the app remembers. All ANONYMOUS, on-device, no account, no PII — which keeps it fully build-safe under our DPDP posture (no child personal data processed). Cloud/account sync is a SEPARATE later task (lawyer-gated).

**This makes mastery VISIBLE for the first time** — after this, playing actually moves and remembers progress.

---

## Scope split (important)

**IN scope (build now — anonymous, no legal questions):**
- Wire the mastery engine into the session start + end.
- Persist mastery state LOCALLY on-device (anonymous, no account, no PII).
- A minimal "your progress" surface so you can SEE it working (can be simple).

**OUT of scope (separate later task — lawyer-gated):**
- Cloud persistence (Firestore), parent accounts, auth, cross-device sync. (Needs the verifiable-parental-consent answer.)
- Full parent dashboard. (This task = a minimal progress view to verify mastery works, not the polished dashboard.)

---

## What to build

### 1. A persistence service — `src/services/progressStore.js`
The single place mastery state is saved/loaded. Abstract the storage backend so cloud (Firestore) can replace/augment it later WITHOUT touching callers (same swap-point pattern as sound/analytics).
- `loadAllSkillStates() → { [skillId]: skillState }` — read all saved states (empty object if none).
- `loadSkillState(skillId) → skillState | null`
- `saveSkillState(skillId, skillState)` — persist one skill's state.
- Backend NOW: on-device storage (the standard browser persistent store). Wrap it so the *callers* never touch the storage API directly — only this service does. (STANDARDS: keep components/recipes/engine pure; persistence lives in this service, which is the sanctioned place for storage — this does NOT violate the "no localStorage in components/engine" rule.)
- **Anonymous + no PII:** keyed by skillId under an anonymous local namespace. No name, email, account, or identifier. Behaviour/progress only. (DPDP-safe per DECISIONS.)
- Error handling per §8: storage can fail (quota, disabled) — catch, degrade gracefully (a child can still play; progress just won't persist this session), never crash.
- Versioning: store a small schema version with the data so future shape changes can migrate cleanly.

### 2. Wire into the session loop (useQuizSession / sessionLite)
- **On session start:** load the skill's saved state (via progressStore). Use `nextWorkingDifficulty(skillState)` to set the starting difficulty (so a child resumes at their adapted level, not always difficulty 1). If no saved state, start fresh (`emptySkillState`).
- **On session end:** build the `sessionResult` (skillId, difficultyPlayed, questionsTotal, questionsCorrect, misconceptionTags, date=today), call `applyResult(skillState, sessionResult, MASTERY)`, then `saveSkillState` the new state.
- Pass today's date in (the wiring layer reads the real clock here and passes it to the pure engine — the engine stays clock-free).
- The `maxDifficulty` for the skill comes from skillMap at this wiring layer (the wiring layer may import skillMap — it's not the pure engine) and is stored in the skill state via `emptySkillState(skillId, maxDifficulty)` on first play.
- Repeat-avoidance: the skill state's `recentParams` can now persist across sessions (optional nicety) — or keep session-local for now; your call, note which.

### 3. A minimal progress surface (to SEE it work — not the full dashboard)
Just enough to verify mastery is updating and persisting:
- On the SkillSelectScreen, show each skill's mastery level subtly — e.g. small filled stars/dots (level 0–5) or a tiny "Level 3" / a progress pip on each skill card. Reads from progressStore.
- Optionally mark skills "due for review" (isDueForReview) with a small indicator.
- Keep it SIMPLE and on-theme — this is a verify-it-works surface, not the polished parent dashboard (that's later). But it should look intentional, not debug-ugly, since kids/parents may see it.
- **Reward stars caution:** if showing mastery as stars, make sure it reads as *progress* and doesn't collide with the reward-star meaning. A distinct treatment (filled pips, a small level badge) may be cleaner than stars. Use judgment.

### 4. Flag (optional)
- If safer, put the "use persisted mastery" behind a flag so you can A/B it during testing. Or default-on since it's additive and anonymous. Use judgment; note what you chose.

---

## Tests
- `progressStore`: save→load round-trips; load-missing returns null/empty; handles storage failure gracefully (mock a throwing storage); version field present.
- Wiring: session-end builds the correct sessionResult and persists the applyResult output (can test the wiring logic with a mocked store + the real pure engine — no DOM needed for the logic).
- Resume: starting a skill with a saved state uses nextWorkingDifficulty (not always difficulty 1).
- Existing suites stay green.

## Verify on phone (THIS is the visible milestone)
- Play a skill, do well → finish → reopen the skill / the skill-select screen → mastery level shows increased and PERSISTS after closing/reopening the app (local persistence working).
- Do poorly → level holds/drops gently (per the engine).
- Difficulty resumes at the adapted level on replay, not always easy.
- Progress survives an app restart (close the tab/app, reopen — progress still there).
- Confirm: no account, no login, no PII — fully anonymous.

## Update
- ARCHITECTURE.md: the progressStore service (its swap-point for future cloud), the session wiring, the minimal progress surface, and that cloud/account persistence is the separate lawyer-gated next task.

## Why this scope
This delivers the full satisfying loop — play, progress moves, it's remembered — ANONYMOUSLY and compliantly, with zero dependency on the auth/consent question. It also makes mastery finally VISIBLE and phone-testable. Cloud sync and the real parent dashboard build on this later, when the legal answer is in.
