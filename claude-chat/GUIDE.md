# GUIDE.md — Tinku Math: stable reference

> **This file holds NO status.** Nothing here is "done", "in progress" or "blocked".
> It is the stable layer: what the tasks are called, what the launch bar is, what the
> decision gates are, what real kids did, and what is deliberately parked.
>
> **Current status lives in `TRACKER.md`. Only there.**
>
> If you find yourself wanting to write a status into this file, that belongs in
> `TRACKER.md`. If you find yourself wanting to look up what "T109" means or whether
> an idea was already considered and parked, you are in the right place.

_Origin: consolidated 2026-08-15 from the Google Drive "Tinku_Math_Tracker" workbook
(last edited 2026-07-17), which had accumulated five diverging copies plus a loose
patch file. That fragmentation was a pre-git-MCP artefact — multiple files maintained
without write access to the repo. It is resolved by this file existing here._

---

## The one rule

Until Month 6, measure success by **retention and reviews, not revenue**.
**D7 retention is the number that decides everything.**

## Priority legend

| Term | Means |
|---|---|
| High | Critical path — blocks launch or other work |
| Medium | Important but not launch-blocking |
| Quick win | Small effort, do whenever |
| Later | Post-launch / future version |

---

## MVP principle

> The MVP must do ONE thing excellently: a child in Grades 1–3 practices CBSE math,
> struggles safely, improves over days, and a parent can see it working.
> Everything that doesn't serve that loop is Phase 2+.

**⚠️ The original MVP cut line was narrowed on 2026-08-14.** Accounts, cloud sync,
paywall, subscriptions and analytics were all in the original launch bar and are now
deliberately out of scope — see `DECISIONS.md` 2026-08-14. The *learning-loop* half of
the bar below still stands; the *account/money* half does not.

**Still the launch bar:**
- Skill map (G1–3), generated questions, misconception-tagged distractors
- Remediation ladder with the mood floor — never end a session on failure
- Spaced repetition + session composer — the daily dose that makes kids return
- Adaptive difficulty within sessions
- Progress that survives refresh and reinstall
- Tinku wired into feedback moments
- Wonder-band theme, tokens ready for Explorer
- Play packaging, Families Policy, store listing
- **Kid testing before public launch**

**Never in scope (cut deliberately to ship — do not re-add):**
multiplayer / social · video lessons · custom backend · gendered themes

**Phase 2+:** Explorer band (G4–5) · TTS / audio instructions · Hindi and regional
languages · supporting character cast · WhatsApp stickers · influencer and paid
campaigns · family-plan billing · exam-season packs · A/B infrastructure

**Phase 3–4:** iOS · B2B school sales · state boards (Maharashtra/UP) · direct web
billing · second subject / Grades 6–8

---

## Roadmap decision gates

The stop-or-continue framework. Targets, not status.

| Quarter | Focus | Target | Gate |
|---|---|---|---|
| Pre-launch | Build MVP, kid-tests, store review | Review passed; 3 kid-tests; D7 measurable | Do kids return on day 2 unforced? Yes → launch. No → fix the loop first. |
| Q1 | Launch, prove retention, chase reviews | 200–2000 installs; **D7 ≥ 20%**; 20+ reviews at 4.3+; revenue ₹0–25k (**₹0 is fine**) | **D7 ≥ 20% → expand. 15–20% → fix first. < 15% → STOP, Plan B.** |
| Q2 | Explorer band; post-Diwali school push; first ads test | 3–10k installs; retention holding; 1–2 school deals | Revenue growing MoM **and** retention holding? Both yes → scale. Else fix monetisation or pivot B2B. |
| Q3 | Audio + Hindi; iOS; referral | 10–30k installs; a profitable channel found | Profitable channel found? Yes → Year 2 scale. Growing but not there → lifestyle fork. Stalled → Plan B/C. |
| Q4 | Consolidate; 2nd school window; tech debt | Few thousand active kids; 5–20 school accounts | Choose Year 2 path: scale fork or lifestyle fork. |
| Year 2 | Second board (engine leverage); Grades 6–8; B2B; Indian entity | — | Scale fork (team, capital) vs lifestyle fork (solo, niche). |

**The `< 15% → STOP` line is the most important row in this table.** It is the
pre-committed answer to "should I keep going", written before the data arrived.

---

## Kid-test evidence to date

Method: watch behaviour, not words. Don't help. Trust *"wants to play again"* over
*"said it was fun."* Target band is Grades 1–3 (~6–9); off-band kids give floor and
ceiling context, not signal.

| # | Age / grade | Band | What happened | Read |
|---|---|---|---|---|
| 1 | 3.5 yrs | Below | Plays with numbers and counting easily; no grasp of subtraction or compare (age-appropriate) | **Content floor works** — even a pre-schooler finds a way in |
| 2 | 9 yrs / Gr 4 | Above | Plays everything; says "too easy" | **Correctly levelled.** Confirms Explorer-band (G4–5) appetite |
| 3 | **Gr 1** | ✓ **TARGET** | Still weak at subtraction — and is **happy to play** | ★ **THESIS VALIDATED.** A target-age child struggling at a skill still *wants* to play. The most important signal so far. |
| 4 | KG | Below | Engaged specifically with counting, stayed with it | Second below-band child entering via counting → **KG band signal**; possible wider top-of-funnel |

**Caveat that matters: only ONE target-band child so far.** Kids 1, 2 and 4 are
context. More Grade 1–3 children is the single highest-value thing kid-testing can
produce.

### Watch-list for future sessions

- Do they come **back**? (wants to play again tomorrow = D7 in miniature)
- Does adaptive difficulty **ease** on their weak skill, or is it the same wall?
- Do hints and retry actually **teach**, or do they just guess?
- Did they notice and react to Tinku? Did sound land? Could they use it **without an
  adult explaining**?
- Watch firsthand where possible — body language and "do they want more" beat reports.
- **Home A/B:** card-list vs journey-path. Watch fingers — first reach, find-next-skill
  unprompted under 5s, scroll-to-explore. Alternate which is shown first per child.
  **Never ask "which is nicer".**
- Does the kid follow Tinku's pointer, or route around it?
- Does a backward (review) suggestion visibly deflate motivation?
- With no onboarding screen, does a child know what to do on first launch?
- Does progress loss (cleared data, new device) happen in practice, and do parents
  notice? — tests whether export/import is sufficient

---

## Work split

> **Rule:** Claude Code builds the FIRST of a kind (engine, money, auth, data).
> Antigravity REPLICATES the rest (UI, styling, template expansion, config).
> You review every diff.

| Owner | Scope |
|---|---|
| **Claude Code** | Architecture-critical: expensive-if-buggy, interconnected logic, data models, money, auth |
| **Antigravity** | Well-defined and replicable: UI components, styling, repetitive content, configs, scripts — always given a Claude-built example to copy |
| **You** | Human / account / legal / testing work no AI can do — plus reviewing every diff before merge |

---

## Research briefs

Topics defined in `research-briefs-pack.md`. Outsourceable in parallel with the build.
Review every output before acting — research can be confidently wrong.

| Brief | Topic | Why it matters |
|---|---|---|
| A | Families Policy + DPDP compliance | How auth/data get built; kids' apps get rejected |
| B | Marketing: ASO + competitor teardown + review mining | Listing keywords; review-mining reveals positioning gaps |
| C | Pricing research | Real ₹ price points instead of a guess |
| D | Mom-community map + seeding playbook | Where to find the first 50–100 parents organically |
| **E** | **Privacy policy + terms requirements** | Required for Play submission |
| **F** | **Play Store launch runbook** | Full launch sequence + asset checklist |
| G | B2B / school sales playbook | Fastest-rupee lever; how schools actually buy |
| H | Mom micro-influencer landscape | Target list, rates, outreach |
| I | UAE↔India tax & structure | Preps the CA hour |
| J | CBSE/NCERT curriculum verification | Bulletproofs the "CBSE-aligned" claim |

**Already researched — do not re-run:** mascot design, wireframes, misconceptions,
analytics event schema, strategy frame, revenue/roadmap model.

---

## Task index (T1–T115)

The vocabulary. `TRACKER.md` and `DECISIONS.md` refer to these by number; this is the key.

⚠️ **Whole workstreams below are deferred by `DECISIONS.md` 2026-08-14** — Auth &
Accounts, Monetization, and Analytics are out of MVP scope. They are listed here
because the names still need resolving, not because they are queued.

### Learning Engine
| ID | Task |
|---|---|
| T2 | Question generator core + templates |
| T6 | Adaptive difficulty (within-session ramp) |
| T8 | Tests for QuizEngine |
| T46 | Remediation ladder (wrong-answer flow, mood floor) |
| T61 | Skill map with prerequisites (G1–G2) |
| T62 | Misconception research per topic |
| T63 | Spaced repetition (Leitner 5-level) — "Tinku's Memory Boxes" |
| T64 | Session composer + mood floor |
| T65 | Indian context bank (names, items, ₹, scenes) |
| T67 | TTS instruction audio (en-IN) |
| T82 | Replace placeholder questions with generator output |
| T83 | Recipe contract + validator foundation |
| T84 | Misconceptions reference (computable, ~68 rows) |
| T85 | Canonical tag vocabulary + validator guard |
| T87 | Recipe factory — foundational batch |
| T88 | Recipe factory — remaining ~29 recipes |
| T93 | Cross-LLM review of misconceptions |
| T94 | Teacher review (pre-launch gate) |
| T95 | `TEACHER-REVIEW.md` running list |
| T101 | Repeat-avoidance in sessionLite |
| T104 | Revert `REVIEW_INTERVALS` from test values before launch |

### Auth & Accounts *(deferred — DECISIONS 2026-08-14)*
| ID | Task |
|---|---|
| T3 | Child profiles + progress persistence |
| T53 | Anonymous auth from first launch |
| T54 | Guest progress persistence check |
| T55 | Account linking (anon → Google, zero progress loss) |
| T56 | Login trigger moments |
| T57 | Parent-framed login screen |
| T58 | Sign-in required at purchase |
| T59 | Auth edge cases |
| T98 | Lock: no child PII during anonymous play |
| T105 | Audit inherited Google login *(resolved by the 2026-08-15 de-Firebase work)* |
| T109 | Auth rebuild — anonymous-first + Firestore ("the big one") |

### Monetization *(deferred — DECISIONS 2026-08-14)*
| ID | Task |
|---|---|
| T13 | Play Billing subscriptions (₹ price points) |
| T22 | Exam-season crash packs |
| T31 | Daily practice limit mechanic |
| T32 | Dashboard teaser (gated insight) |
| T33 | Paywall screen + copy |
| T34 | Mastery-proof upgrade triggers |
| T35 | Final free/premium tier matrix |
| T36 | Kid-side premium perks |
| T37 | Weekly parent progress summary |
| T38 | Exam-season upgrade triggers |
| T39 | Soft-limit UX rules |
| T40 | Sibling/family plan logic |
| T81 | ₹ pricing + remove fake social proof |

### Parent Dashboard
| ID | Task |
|---|---|
| T4 | Parent dashboard (free summary + premium detail) |

### Mascot & Brand
| ID | Task |
|---|---|
| T9 | Repo hygiene (CBSC→CBSE, LICENSE, private) — **scope includes the Netlify site name**, `shan-studyapp-CBSC.netlify.app`, where the typo still lives and is public |
| T41a | Mascot v0 (Tinku) — 6 poses |
| T41b | Mascot full expression set |
| T42 | Character-driven feedback layer |
| T43 | Sound design pack |
| T44 | Daily quests + streak system |
| T45 | Parent-directed streak notifications |
| T48 | Hinglish character voice/copy |
| T49 | Mascot WhatsApp stickers / share cards |
| T50 | Supporting cast (v2) |
| T52 | Tinku name check (Play Store + IP) |
| T79 | Integrate Tinku into ALL screens |
| T90 | Tinku integration (Mascot component) |

### Theming & Bands
| ID | Task |
|---|---|
| T5 | Theme token architecture |
| T24 | Explorer band (Grades 4–5) |
| T25 | Child-selectable skins per band |
| T80 | Light theme for Wonder band |

### Content Architecture
| ID | Task |
|---|---|
| T1 | Skill map + templates as code; state in Firestore |
| T86 | Migration scaffolding (flags + folders, strangler-fig) |

### Feel & Interaction
| ID | Task |
|---|---|
| T71 | CSS animation system (GPU-safe: transform/opacity only) |
| T72 | Capacitor Haptics |
| T73 | Sound-effects pack + audio hook |
| T74 | Framer Motion — only if CSS hits a wall |
| T76 | Human-recorded Tinku catchphrases |
| T77 | Rive/Lottie true character animation |
| T78 | Settings: audio / haptics / voice toggles |
| T89 | Wire engine to playable quiz screen |
| T99 | Tinku expressiveness — bigger reactions for young kids |
| T100 | Auto-advance on correct (remove Next-button friction) |
| T102 | Count-objects clarity (word + bounded tray) |
| T103 | Scroll-position issues (topic list + question page) |
| T106 | Mobile audio unlock (autoplay policy) |
| T108 | In-app feedback channel (parent-zone WhatsApp link) |
| T110 | **UI overhaul — design direction locked** *(scope fence: reskin-only; auth/onboarding quarantined)* |
| T111 | UI Screen 1 — Quiz + design tokens |
| T112 | UI Screen 2 — Session-end celebration event |
| T113 | UI Screen 3 — Skill-select / home |
| T114 | UI Screen 4 — Parent dashboard (premium-calm) |
| T115 | UI Screen 5 — Sweep (nav / loading / transitions / errors) |

### Packaging & Launch
| ID | Task |
|---|---|
| T10 | Google Play Console — individual account (UAE identity) |
| T11 | Families Policy compliance *(start early — longest external wait)* |
| T12 | Wrap PWA for Play Store (Capacitor / TWA) |
| T15 | Verify Play tax settings for India |
| T16 | Cross-border CA consultation |
| T27 | iOS launch |
| T96 | Compliance §A build items (strip AD_ID, no ad personalisation, no contacts perms, targetSdk 34+, parental gate, grievance officer) |
| T97 | Indian privacy lawyer consult (DPDP) |
| T107 | Accurate privacy-reassurance notice |

### Go-to-Market
| ID | Task |
|---|---|
| T17 | ASO listing (keywords + screenshots) |
| T18 | Seed 50–100 parents → reviews |
| T19 | WhatsApp share cards |
| T20 | Mom micro-influencers |
| T21 | Teacher / school outreach |
| T23 | Paid ads test (Google UAC) |
| T28 | State board content |
| T29 | B2B school sales |
| T30 | Direct web billing (Razorpay) |

### Analytics *(deferred — DECISIONS 2026-07-16)*
| ID | Task |
|---|---|
| T47 | Firebase Analytics instrumentation |
| T51 | A/B testing setup (Remote Config) |
| T60 | Auth state in analytics |
| T91 | Analytics wrapper + core events |
| T92 | Analytics schema doc |

### Tooling
| ID | Task |
|---|---|
| T66 | Kid testing rounds |
| T68 | Claude Project setup |
| T69 | Claude Code + Antigravity setup |
| T70 | Decisions log file |

---

## Parked ideas

> **The filter:** *"Does this help a Grade 1–3 child learn math AND come back tomorrow —
> at launch?"* If no, it stays here. Real retention data decides what graduates.

| Idea | Value | Cost / risk | Earliest |
|---|---|---|---|
| **KG1/KG2 band** — first planned expansion | Evidenced by kid-test (two below-band kids engaged via counting); leverages existing counting content; hungry Indian pre-school market | Needs its own pedagogy for pre-readers; do NOT rush into launch scope | Post-launch |
| Pre-school positioning angle (marketing only) | Captures KG demand via messaging at zero build cost | Feeds ASO brief B; positioning, not a build change | Marketing research |
| AI "explain for my child" (Claude API in-app) | On-brand differentiator; deepens parent value | API cost, latency, child-safety review | Phase 2/3 |
| Printable worksheets / homework PDFs | Indian parents love physical practice; shareable | PDF pipeline; zero MVP learning value | Phase 2 |
| Parent WhatsApp progress bot | Reaches parents where they are | WhatsApp Business API + consent; validate app first | Phase 2/3 |
| Multiplayer / friend challenges | Engagement for older kids; viral loop | Meaningless for solo 6-year-olds; moderation + safety load | Phase 3 (Explorer only) |
| Second subject (EVS / English) | More to sell to the same parent | A second BOARD beats a second subject — engine already does math | Year 2 |
| Web / desktop responsive | Near-free second channel; helps B2B (school computer labs); hedge if Play approval drags | Additive layout work, not a rebuild; mobile-first stays priority | Post-launch |
| Design-system component library | Consistency + speed as screens grow; easier band theming | Premature at ~6 screens | Post-kid-test / scale |
| Claymorphism Tinku (3D upgrade) | More premium feel; good marketing hero shots | Harder 3D consistency, heavier files, **lost the math star**, redoes done work | Phase 2 (art) |
| Desktop scrollbar styling | Cosmetic; desktop preview only | Trivial CSS, batch with a polish pass | Polish pass |
| Client-side-encrypted cloud backup | Backup without us reading child data | Open question whether it still counts as processing child personal data | Revisit trigger |
| Use a registered Consent Manager | Outsourced verification path | We cannot BE one (First Schedule Part A); using one is a separate question | Revisit trigger |
