# TASK-INDEX.md — the T-number dictionary

> **This file holds NO status.** Nothing here is "done", "in progress" or "blocked".
> It exists for one reason: `DECISIONS.md` and `TRACKER.md` refer to work by number
> (T9, T52, T91, T109, T111–T115) and without this file those references are unresolvable.
>
> **Status lives in `claude-chat/TRACKER.md`. Only there.**
> If you want to write "T9 is done", that belongs in TRACKER, not here.
>
> Strategy material — roadmap decision gates, kid-test evidence, research briefs, work split,
> parked ideas — is **not in this repo**. It lives in Google Drive, maintained by the human and
> Claude Chat. Claude Code cannot read Drive and does not need to.

_Origin: extracted 2026-08-15 from the Google Drive "Tinku_Math_Tracker" workbook, which had
fragmented into five diverging copies plus a loose patch file — an artefact of maintaining a
task list without write access to the repo. Shrunk to a dictionary 2026-08-16._

---

## MVP scope line

> The MVP must do ONE thing excellently: a child in Grades 1–3 practises CBSE maths,
> struggles safely, improves over days, and a parent can see it working.
> Everything that doesn't serve that loop is Phase 2+.

**⚠️ Narrowed on 2026-08-14.** Accounts, cloud sync, paywall, subscriptions and analytics were
all in the original launch bar and are now deliberately out of scope — see `DECISIONS.md`.
The *learning-loop* half of the bar below still stands; the *account/money* half does not.

**Still the launch bar:** skill map (G1–3) · generated questions with misconception-tagged
distractors · remediation ladder with the mood floor (never end a session on failure) ·
spaced repetition + session composer · adaptive difficulty within sessions · progress that
survives refresh and reinstall · Tinku wired into feedback moments · Wonder theme with tokens
ready for Explorer · Play packaging + Families Policy + store listing · **kid testing before
public launch**.

**Never in scope — cut deliberately, do not re-add:** multiplayer / social · video lessons ·
custom backend · gendered themes.

**Phase 2+:** Explorer band (G4–5) · TTS / audio · Hindi and regional languages · supporting
cast · WhatsApp stickers · paid campaigns · family plans · exam-season packs · A/B infra.
**Phase 3–4:** iOS · B2B schools · state boards · direct web billing · second subject / G6–8.

---

## The index

⚠️ **Whole workstreams below are deferred by `DECISIONS.md` 2026-08-14** — Auth & Accounts,
Monetization and Analytics are out of MVP scope. They are listed because the names still need
resolving, **not because they are queued.**

### Learning engine
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

### Auth & accounts *(deferred — DECISIONS 2026-08-14)*
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
| T35 | Free/premium tier matrix |
| T36 | Kid-side premium perks |
| T37 | Weekly parent progress summary |
| T38 | Exam-season upgrade triggers |
| T39 | Soft-limit UX rules |
| T40 | Sibling/family plan logic |
| T81 | ₹ pricing + remove fake social proof |

### Parent dashboard
| ID | Task |
|---|---|
| T4 | Parent dashboard (free summary + premium detail) |

### Mascot & brand
| ID | Task |
|---|---|
| T9 | Repo hygiene — `CBSC` → `CBSE`, LICENSE, private. **Scope includes the Netlify site name**, which still carries the typo in the public URL. |
| T41a | Mascot v0 (Tinku) — 6 poses |
| T41b | Mascot full expression set |
| T42 | Character-driven feedback layer |
| T43 | Sound design pack |
| T44 | Daily quests + streak system |
| T45 | Parent-directed streak notifications |
| T48 | Hinglish character voice/copy |
| T49 | Mascot WhatsApp stickers / share cards |
| T50 | Supporting cast (v2) |
| T52 | **Tinku name check (Play Store + IP)** — unresolved; upstream of publishing, since the policy and listing both name it |
| T79 | Integrate Tinku into ALL screens |
| T90 | Tinku integration (Mascot component) |

### Theming & bands
| ID | Task |
|---|---|
| T5 | Theme token architecture |
| T24 | Explorer band (Grades 4–5) |
| T25 | Child-selectable skins per band |
| T80 | Light theme for Wonder band |

### Content architecture
| ID | Task |
|---|---|
| T1 | Skill map + templates as code |
| T86 | Migration scaffolding (flags + folders, strangler-fig) |

### Feel & interaction
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
| T110 | UI overhaul — design direction locked *(scope fence: reskin only; auth/onboarding quarantined — this is why `ProfileSetup.jsx` and `ProfileSelector.jsx` exist but are unrendered)* |
| T111 | UI Screen 1 — Quiz + design tokens |
| T112 | UI Screen 2 — Session-end celebration |
| T113 | UI Screen 3 — Skill-select / home |
| T114 | UI Screen 4 — Parent dashboard |
| T115 | UI Screen 5 — Sweep (nav / loading / transitions / errors) |

### Packaging & launch
| ID | Task |
|---|---|
| T10 | Google Play Console — individual account (UAE identity) |
| T11 | Families Policy compliance *(start early — longest external wait)* |
| T12 | Wrap PWA for Play Store (Capacitor / TWA) |
| T15 | Verify Play tax settings for India |
| T16 | Cross-border CA consultation |
| T27 | iOS launch |
| T96 | Compliance build items (strip AD_ID, no ad personalisation, no contacts perms, targetSdk 34+, parental gate, grievance contact) |
| T97 | Indian privacy lawyer consult (DPDP) |
| T107 | Accurate privacy-reassurance notice |

### Go-to-market
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
