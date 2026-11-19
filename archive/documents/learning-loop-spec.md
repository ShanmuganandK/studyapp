# Learning Loop Specification — CBSE Math App (Tinku)

The core 5 minutes: how questions are generated, what happens on wrong answers, and how learning is retained over weeks. This is the heart of the product — everything else (auth, billing, mascot) scaffolds this.

---

## 1\. The Big Picture

                    ┌─────────────────────────────┐

                    │       SESSION COMPOSER       │

                    │  picks today's question mix  │

                    │  (new skill \+ due reviews)   │

                    └──────────────┬──────────────┘

                                   │

                    ┌──────────────▼──────────────┐

                    │     QUESTION GENERATOR       │

                    │  skill template \+ difficulty │

                    │  → infinite fresh questions  │

                    └──────────────┬──────────────┘

                                   │

                 ┌─────────────────▼─────────────────┐

                 │            CHILD ANSWERS           │

                 └───────┬───────────────────┬───────┘

                         │ correct           │ wrong

            ┌────────────▼─────────┐  ┌──────▼──────────────────┐

            │  Tinku celebrates    │  │  REMEDIATION LADDER      │

            │  mastery level ↑     │  │  hint → visual → retry   │

            │  difficulty adapts ↑ │  │  misconception logged    │

            └────────────┬─────────┘  └──────┬──────────────────┘

                         │                   │

                    ┌────▼───────────────────▼────┐

                    │      MASTERY TRACKER         │

                    │  per-skill level (0–5)       │

                    │  schedules future reviews    │

                    │  feeds parent dashboard      │

                    └─────────────────────────────┘

**Three principles driving every decision below:**

1. **Skills, not questions.** The unit of learning is a *skill* ("2-digit addition with carry"), never a stored question. Questions are disposable instances generated from skills.  
2. **Wrong answers are the product.** The remediation ladder is where teaching happens. A wrong answer must never feel like punishment and never be wasted.  
3. **Mastery is demonstrated over time, not in one session.** A skill isn't "done" until it survives reviews days and weeks later. This is also exactly what the parent dashboard sells.

---

## 2\. Skill Map (the curriculum backbone)

Every grade's syllabus is broken into atomic **skills** with explicit prerequisites. This replaces the flat topic list in `syllabus.js`.

// skills.js — excerpt for Grade 1–2 number work

export const SKILLS \= {

  "g1.count.1-20":      { name: "Counting 1–20",                  grade: 1, prereqs: \[\] },

  "g1.count.21-50":     { name: "Counting 21–50",                 grade: 1, prereqs: \["g1.count.1-20"\] },

  "g1.add.within10":    { name: "Addition within 10",             grade: 1, prereqs: \["g1.count.1-20"\] },

  "g1.add.within20":    { name: "Addition within 20",             grade: 1, prereqs: \["g1.add.within10"\] },

  "g1.sub.within10":    { name: "Take away within 10",            grade: 1, prereqs: \["g1.count.1-20"\] },

  "g2.place.tens-ones": { name: "Place value: tens & ones",       grade: 2, prereqs: \["g1.count.21-50"\] },

  "g2.add.2d-nocarry":  { name: "2-digit addition (no carry)",    grade: 2, prereqs: \["g1.add.within20", "g2.place.tens-ones"\] },

  "g2.add.2d-carry":    { name: "2-digit addition (with carry)",  grade: 2, prereqs: \["g2.add.2d-nocarry"\] },

  "g2.mul.intro":       { name: "Multiplication as repeated add", grade: 2, prereqs: \["g1.add.within20"\] },

  "g2.mul.table2":      { name: "Table of 2",                     grade: 2, prereqs: \["g2.mul.intro"\] },

  // ... map full NCERT syllabus this way (\~25–35 skills per grade)

};

**Why prerequisites matter:** when a child fails "2-digit addition with carry" repeatedly, the system checks prereqs — maybe the real gap is place value. Remediation can step *down* the graph instead of hammering the same skill. This is also dashboard gold: *"Aanya's addition trouble traces back to place value — practicing that first."* No competitor app at your price point explains a child's struggle causally.

Mapping work: \~1 evening per grade with the NCERT textbook open. Do Grade 1 \+ 2 now; the structure scales to any grade or board later (state boards \= different skill maps, same engine).

---

## 3\. Question Generator

### 3.1 Template anatomy

Each skill has 1–3 **templates**. A template \= parameter ranges \+ answer logic \+ distractor logic \+ presentation hints.

// templates/g2.add.2d-carry.js

export default {

  skillId: "g2.add.2d-carry",

  formats: \["numeric", "visual", "word"\],   // presentation variety

  generate(difficulty, rng) {

    // difficulty 1–3 maps to parameter ranges

    const ranges \= {

      1: { aMin: 15, aMax: 49, bMin: 15, bMax: 49 },  // small numbers

      2: { aMin: 25, aMax: 79, bMin: 25, bMax: 79 },

      3: { aMin: 45, aMax: 99, bMin: 45, bMax: 99 },  // bigger, double carry possible

    }\[difficulty\];

    let a, b;

    do {

      a \= rng.int(ranges.aMin, ranges.aMax);

      b \= rng.int(ranges.bMin, ranges.bMax);

    } while ((a % 10\) \+ (b % 10\) \< 10);   // MUST require a carry — that's the skill

    return { params: { a, b }, answer: a \+ b };

  },

  distractors({ a, b }, answer) {

    return dedupe(\[

      (Math.floor(a/10) \+ Math.floor(b/10)) \* 10 \+ ((a \+ b) % 10\) \- 10 \>= 0

        ? a \+ b \- 10 : answer \+ 10,        // ① forgot the carry  ← the classic error

      answer \+ 10,                          // ② carried twice / carried into wrong column

      a \+ b \- (b % 10\) \+ rng.int(1, 3),     // ③ ones-digit slip

    \], answer);

  },

  // misconception tags, index-matched to distractors above

  misconceptions: \["forgot-carry", "extra-carry", "ones-slip"\],

  wordProblem({ a, b }, ctx) {

    // ctx pulls from an Indian-context phrase bank

    return \`${ctx.name} has ${a} ${ctx.item}. ${ctx.friend} gives ${ctx.gender \=== 'f' ? 'her' : 'him'} ${b} more. How many ${ctx.item} now?\`;

    // e.g., "Meera has 47 marbles. Arjun gives her 38 more. How many marbles now?"

  },

};

**The three non-obvious design points:**

- **Distractors encode misconceptions.** The wrong options aren't random numbers — each is *the answer a child gets by making a specific known mistake*. When a child picks "75" for 47+38, you know they forgot the carry. This single idea powers the entire remediation and dashboard story. (Sources for misconception lists: NCERT teacher handbooks \+ any primary-math pedagogy reference list the common errors per topic — worth one research evening per grade.)  
- **Constraint loops guarantee the skill is exercised.** The `do...while` ensures every generated question genuinely requires a carry. Without it, RNG produces questions that don't test the skill.  
- **Seeded RNG, exhaustion-aware.** Seed the RNG per child per day, and log recently used `params` hashes per skill to avoid serving 47+38 twice in a week. A simple `recentParams: string[]` (last 20\) per skill in local state is enough.

### 3.2 Indian context bank (for word problems & visuals)

export const CONTEXT\_BANK \= {

  names:  \["Meera", "Arjun", "Diya", "Kabir", "Anaya", "Vihaan", "Zoya", "Ishaan"\],

  items:  \["marbles", "mangoes", "stickers", "laddoos", "kites", "crayons", "shells"\],

  money:  \["₹1 coin", "₹2 coin", "₹5 coin", "₹10 note"\],   // g2 money skills use real Indian denominations

  scenes: \["school bus", "tiffin box", "cricket ground", "mela", "garden"\],

};

Costs nothing, and it's the localization parents notice: their child counting laddoos and ₹5 coins instead of dollars and cookies.

### 3.3 Format rotation

Same skill, three skins — rotate to prevent answer-pattern memorization and to keep sessions fresh:

| Format | Example for 47 \+ 38 | When used |
| :---- | :---- | :---- |
| `numeric` | "47 \+ 38 \= ?" with 4 options | default drill |
| `visual` | bundles of tens-sticks \+ ones to count/tap | first exposure & remediation |
| `word` | Meera's marbles story | mastery levels 3+ (reading-dependent: Wonder band gates this behind audio, see §7) |

### 3.4 Coverage estimate

\~30 skills/grade × 1–2 templates \= **40–50 templates per grade**. Each is 30–60 lines. With focused work that's 2–3 weeks for Grades 1–2 — and then content is *solved permanently*: infinite questions, zero content-update deploys, trivially extended to new grades.

Prioritize templates in this order: numbers/counting → addition → subtraction → place value → multiplication → money/time/measurement (these last ones are more template-fiddly; fine to launch with smaller pools).

---

## 4\. Wrong-Answer Remediation Ladder

What happens when the child answers wrong. Never punishing, never wasted.

WRONG \#1 ─→ Tinku (encourage pose): "Almost\! Try once more 💪"

            \+ targeted HINT based on the misconception tag of the chosen distractor

            same question stays on screen

                │

WRONG \#2 ─→ Tinku: "Let's solve it together\!"

            → WORKED EXAMPLE / VISUAL MODE of the \*same numbers\*

              (e.g., tens-sticks animation showing the carry happening)

            → then auto-retry with NEW numbers, same skill, difficulty −1

                │

WRONG \#3 ─→ no third strike on the same concept this session

            → mark skill "needs-help", drop from today's queue

            → Tinku: "Great trying\! Let's play something you're awesome at 🌟"

            → next question from a HIGH-mastery skill (guaranteed win to restore mood)

            → skill re-enters tomorrow at difficulty 1, visual-format first

            → if prereqs exist with mastery \< 3 → tomorrow serves the PREREQ instead

**Misconception-targeted hints** (this is what the distractor tags buy you):

| Tag picked | Hint shown |
| :---- | :---- |
| `forgot-carry` | "Look at the ones: 7 \+ 8 makes more than 9\! Where does the extra ten go? 👀" |
| `ones-slip` | "So close\! Count the ones again: 7 \+ 8 \= ?" |
| `extra-carry` | "Check the tens — did we carry one ten or two?" |

Rules that keep this kid-safe:

- **The mood floor:** a session never ends on a failure. The "guaranteed win" question after Wrong \#3 is non-negotiable design.  
- **No streak/pet damage from wrong answers.** Streaks reward showing up; wrongness is just learning.  
- **Tinku never shows disappointment** — encourage pose only, "let's try together" language only.  
- Every wrong answer logs `{skillId, misconceptionTag, difficulty, ts}` — this is the raw material for the dashboard's "weak areas" (and the premium teaser: "⚠️ one area needs attention").

---

## 5\. Spaced Repetition — "Tinku's Memory Boxes"

Full SM-2/Anki algorithms are overkill and tuned for adults. Use a **5-level Leitner system per skill** — simple to build, simple to explain to parents, and pedagogically sound for this age.

### 5.1 Mastery levels & review intervals

| Level | Meaning | Reviewed after | Dashboard label |
| :---- | :---- | :---- | :---- |
| 0 | Not started | — | Locked/New |
| 1 | Introduced (saw the lesson) | 1 day | Learning |
| 2 | Practicing | 2 days | Learning |
| 3 | Getting it | 4 days | Practicing |
| 4 | Strong | 7 days | Strong |
| 5 | Mastered | 21 days (maintenance) | Mastered 🏆 |

### 5.2 Update rules (deliberately simple)

function updateMastery(skill, sessionResult) {

  // sessionResult \= correct/total for this skill in today's session (min 3 questions)

  const ratio \= sessionResult.correct / sessionResult.total;

  if (ratio \>= 0.8)      skill.level \= Math.min(5, skill.level \+ 1);

  else if (ratio \>= 0.5) /\* level unchanged — more practice at same level \*/;

  else                   skill.level \= Math.max(1, skill.level \- 1);

  skill.lastSeen \= today();

  skill.nextDue  \= addDays(today(), INTERVALS\[skill.level\]);  // \[\_,1,2,4,7,21\]

}

Key choices: promotion needs 80% in a *batch* (single lucky guesses don't promote); demotion is gentle (one bad day drops one level, never to zero); level 5 still gets maintenance reviews every 3 weeks — "mastered" decays in 7-year-olds, and catching that decay is precisely the retention proof the dashboard sells.

### 5.3 Session Composer (the daily mix)

Each session ≈ 10 questions, \~4–5 minutes:

function composeSession(child) {

  const due      \= skillsDueForReview(child);          // nextDue \<= today, sorted by most overdue

  const current  \= currentFrontierSkill(child);        // lowest-level unlocked skill on the path

  const strong   \= randomHighMasterySkill(child);      // confidence material

  return \[

    ...questionsFor(strong,  1),                       // 1 warm-up — start with a win

    ...questionsFor(current, 5),                       // 5 new-learning (the frontier)

    ...due.slice(0, 2).flatMap(s \=\> questionsFor(s, 2)),// up to 4 review questions

  \];                                                    // ≈ 10 total

}

Mix rationale: **\~50% frontier / \~40% review / 10% warm-up.** Interleaved review is one of the most robust findings in learning science — and it's invisible to the child; it just feels like variety. If nothing is due, fill with frontier \+ one prereq refresher.

The **daily limit (item 31\)** \= 1–2 composed sessions for free users. Premium \= unlimited *additional* sessions, which the composer fills with more review \+ frontier. Note the elegance: the free tier delivers a pedagogically complete daily dose — your "generous free tier" promise is literally the algorithm.

### 5.4 Adaptive difficulty within a session

Per skill, within a session: 2 consecutive correct at current difficulty → difficulty \+1 (max 3); the remediation ladder already handles downshifts. Carry the ending difficulty into the skill record so tomorrow starts where today ended.

---

## 6\. Firestore Data Model

users/{uid}/

  children/{childId}/

    profile: { name, grade, avatar, themePref, createdAt }

    skills/{skillId}: {

      level: 0–5,

      difficulty: 1–3,            // carried between sessions

      lastSeen, nextDue,          // timestamps

      attempts, correct,          // lifetime counters (dashboard)

      misconceptions: {           // counters per tag — weak-area engine

        "forgot-carry": 4,

        "ones-slip": 1

      },

      recentParams: \[hash, ...\]   // last 20, repeat-avoidance

    }

    sessions/{sessionId}: {       // one doc per completed session (dashboard \+ analytics)

      date, durationSec,

      questions: \[{ skillId, difficulty, correct, misconceptionTag?, timeMs }\]

    }

    streak: { current, longest, lastActiveDate }

Notes:

- Templates and the skill map ship **in the app bundle** (they're code, tiny, and needed offline). Only *child state* lives in Firestore. This supersedes the earlier "move questions to Firestore" plan (item 1\) — with a generator, there are no question banks to host; item 1 collapses into "ship skill map \+ templates as code, state in Firestore." Simpler than the original plan.  
- Enable Firestore **offline persistence** — sessions complete offline (school commute, no-wifi homes), sync later. Free with the SDK.  
- Everything hangs under the auth UID — anonymous first, surviving the `linkWithCredential` switchover (items 53–55) untouched.

---

## 7\. Audio Dependency (flagging it now)

The word-problem format and all instruction text assume reading ability that Grade 1 children largely don't have. Practical sequencing:

- **Launch:** Wonder band defaults to `numeric` \+ `visual` formats only; `word` format unlocks at Grade 2+ or when audio ships.  
- **Fast follow:** pre-generated TTS for instruction strings (Google Cloud TTS, Indian English voice `en-IN`; Hindi later). Because templates are finite, the *sentence frames* are finite — record/generate once per template, splice numbers as audio or show numbers visually while the frame is spoken.

This keeps audio off the launch critical path without blocking Grade 1 usability.

---

## 8\. Build Order (within this spec)

| Step | What | Effort | Unblocks |
| :---- | :---- | :---- | :---- |
| 1 | Skill map for Grades 1–2 (NCERT open, one file) | 2 evenings | everything |
| 2 | Generator core: template interface, RNG, 5 templates (counting, add-within-10/20, sub, place value) | 3–4 days | playable loop |
| 3 | Remediation ladder in QuizEngine (hints, visual fallback, mood floor) | 2–3 days | the pedagogy |
| 4 | Mastery tracker \+ Firestore writes | 2 days | retention \+ dashboard data |
| 5 | Session composer \+ daily limit hookup | 1–2 days | freemium mechanics (item 31\) |
| 6 | Remaining templates to cover Grade 1, then Grade 2 | 1–2 weeks, parallelizable | full curriculum |
| 7 | Kid testing round \#1 (3 children, 20 min each) | this month | reality check on all of it |

Steps 1–5 ≈ two focused weeks and produce a *complete vertical slice*: a child can learn, struggle, get helped, and be re-tested days later — with every event feeding the parent dashboard.

---

## 9\. Action Tracker Updates

| \# | Item | Change |
| :---- | :---- | :---- |
| 1 | Content out of code | **Revised:** skill map \+ templates ship as code; only child state in Firestore |
| 2 | Question generator | **Expanded** into §3 of this spec (templates, distractors, misconceptions, context bank) |
| 6 | Adaptive difficulty | **Expanded** into §5.4 \+ remediation ladder §4 |
| 61 | **NEW** Skill map w/ prerequisites (G1–G2) | 🔴 High — first task, 2 evenings |
| 62 | **NEW** Misconception research per topic | 🟡 Medium — NCERT teacher handbooks, 1 evening/grade |
| 63 | **NEW** Spaced-repetition Leitner system | 🔴 High — §5, pairs with mastery tracker |
| 64 | **NEW** Session composer \+ mood floor | 🔴 High — §4–5.3 |
| 65 | **NEW** Indian context bank | 🟢 Quick win — one file |
| 66 | **NEW** Kid testing round \#1 (3 kids × 20 min) | 🔴 High — schedule this month, repeats monthly |
| 67 | **NEW** TTS instruction audio (en-IN) | 🟡 Medium — fast-follow, unblocks word format for G1 |

