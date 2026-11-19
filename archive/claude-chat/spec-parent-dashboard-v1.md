# Spec — Parent Dashboard v1 (encouraging progress view)

**Goal:** The first parent-facing screen — a warm, encouraging snapshot of "how is my child doing?" Built from the LOCAL mastery data (already there, anonymous), behind the existing PARENT GATE. Delivers the core reassurance a parent pays for (visible progress) using data we can trust today.

**Scope discipline:** v1 = encouraging progress snapshot. NOT analytics-heavy. The richer "areas to support" (misconception-based) and activity-trends are DEFERRED (see why below). Accounts/cloud are a separate lawyer-gated task — this reads local data behind the parent gate, no login.

---

## Why this depth (not richer)
- **Misconception data isn't teacher-validated yet** — surfacing "your child struggles with X" to parents before the teacher review could give wrong guidance. Defer "areas to support" until misconceptions are validated.
- **Early data is thin** — rich analytics on a few sessions = noise. Simple progress is meaningful even with little data.
- **v1 proves the hook** — does a parent open this and feel "yes, my child is progressing"? Validate that before investing in depth.
- **Tone safety** — a clean progress view is unambiguously positive (the reassurance parents pay for); weakness/engagement analytics is where anxiety-inducing risk lives.

---

## Access
- Lives in the existing **Parent** area, behind the **parent gate** (the existing gate — a kid shouldn't reach it trivially).
- Reads **local mastery data** via `progressStore.loadAllSkillStates()` + the skill map. No account, no cloud, no PII. Build-safe per DPDP posture.

## What to show (encouraging, honest, young-kid-appropriate)

### 1. A warm header
- Friendly, e.g. "How [child] is doing" (or just "Your child's progress" — no name needed since we store no name). Tinku present, light theme, calm/reassuring tone — NOT a report card.

### 2. Progress across skills (the core)
- For each **ready** skill, show its mastery level framed POSITIVELY, not as a score:
  - Level 5 → **"Mastered! ⭐"** (celebrate)
  - Level 3–4 → **"Doing great"** / strong
  - Level 1–2 → **"Learning"**
  - Level 0 / no state → **"Not started yet"** (neutral, inviting — not "failed")
- Use the friendly skill names (displayName) + a visual level indicator (the same pip style as the kid screen, or a small progress bar). Consistent with the app.
- Group or order sensibly (mastered ones together as wins, in-progress next, not-started last) so the parent sees a positive arc.

### 3. A small "wins" highlight
- A short celebratory line: e.g. "[child] has mastered N skills! 🎉" — lead with the positive. If nothing mastered yet, a gentle encouraging line ("Just getting started — every bit of practice helps!").

### 4. "Currently working on"
- The frontier skills (started, not mastered) — "Right now, working on: [skill names]." Tells the parent where the child is focused, framed as effort not deficit.

### 5. One light activity signal
- Something simple and non-pressuring: e.g. "Last practised: today / 2 days ago" (from `lastSeen`), or "Skills practised: N". ONE light signal — not a streak system, not engagement-pressure. (No "your child hasn't played in 3 days!" guilt mechanics.)

## Tone rules (important — young kids)
- Encouraging, never judgmental. No grades, no percentages-as-report-card, no rankings, no comparison to other children, no "behind/ahead."
- "Not started" and "learning" are framed neutrally/positively, never as failure.
- Nothing that pressures a parent to push a 5–7 year old harder.

## What to build
- A `ParentDashboard.jsx` (or section in the existing Parent area) — reads local states, renders the above. Light theme, on-brand, calm.
- A small pure helper (e.g. `src/engine/progressSummary.js` or similar) that turns raw skill states + skill map into the dashboard's view-model (counts of mastered/learning/not-started, frontier list, last-activity) — pure, testable, so the component just renders. Keeps logic out of the component (STANDARDS §2/§8).
- Reuse mastery helpers (isMastered, isUnlockedLevel) and the friendly names from skillMap.

## Tests
- The pure summary helper: correct mastered/learning/not-started buckets from mixed states; frontier list correct; last-activity computed; empty states (brand-new child → all "not started", encouraging empty message).
- Parent-gate: dashboard is behind the gate (not reachable without passing it).
- Existing suites green.

## Verify on phone
- Pass the parent gate → see the dashboard.
- With some progress: skills show correct positive status; mastered ones celebrated; "currently working on" lists the right skills; activity signal correct.
- Brand-new child (no progress): encouraging empty state, not a sad/blank screen.
- Tone check: read it as a parent — does it feel reassuring and positive, not like a report card or a guilt trip?

## Update
- ARCHITECTURE.md: ParentDashboard + the pure summary helper; note it reads local data behind the parent gate; note that misconception-based "areas to support", activity trends, and account/cloud sync are deferred (post-teacher-review / lawyer-gated).

## Explicitly deferred (do NOT build now)
- "Areas to support" / weaknesses from misconception tags → after teacher review validates the misconception data.
- Activity trends, streaks, engagement analytics → after there's meaningful data + signal parents return.
- Parent accounts, login, cloud sync, cross-device → lawyer-gated separate task.
- Multiple child profiles → later (with accounts).
- Exporting/sharing reports → later.

## Why this scope
Delivers the core parent value — "I can see my child is progressing" — warmly, from trustworthy local data, behind the existing gate, with zero dependency on accounts or unvalidated analytics. It's the monetization hook's first honest version; richness comes after validation and return-signal.
