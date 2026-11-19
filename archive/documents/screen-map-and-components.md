# Screen Map & Component Inventory — Tinku Math

The shared blueprint for both AIs. Defines **what screens exist**, **what components build them**, **how they connect**, and **what data each needs** — at wireframe-in-words level. Visual polish (colour, spacing, exact Tinku placement, animation timing) is deliberately left flexible and tuned during build \+ after kid-testing.

**Legend:**

- 🟢 **HAVE** — you likely already built a version of this on Netlify; reuse/refactor, don't rebuild  
- 🟡 **PARTIAL** — probably exists but needs rework for MVP scope  
- 🔴 **NEW** — build from scratch

---

## 1\. Screen Inventory & Flow

                          ┌─────────────────┐

                          │  SPLASH/LOADING │ 🔴

                          │   (Tinku waves) │

                          └────────┬────────┘

                                   │ first launch → anonymous auth (silent)

                                   ▼

                          ┌─────────────────┐

                          │  GRADE SELECT   │ 🟡   (first run only; remembered after)

                          │  pick 1,2,3...  │

                          └────────┬────────┘

                                   ▼

        ┌──────────────────────────────────────────────────┐

        │                  HOME / MAP        🟡             │◄────────────┐

        │  Tinku greeting · today's session · streak ·      │             │

        │  topic list/path · parent-area button             │             │

        └──┬───────────────┬───────────────────┬────────────┘             │

           │               │                   │                          │

           ▼               ▼                   ▼                          │

   ┌──────────────┐ ┌──────────────┐  ┌──────────────────┐                │

   │ LESSON/INTRO │ │ QUIZ/SESSION │  │ PARENT GATE      │ 🔴             │

   │ (visual      │ │  SCREEN  🟡  │  │ (math Q to keep  │                │

   │  concept) 🟡 │ │  the core    │  │  kids out)       │                │

   └──────┬───────┘ │  loop        │  └────────┬─────────┘                │

          │         └──────┬───────┘           ▼                          │

          └────────────────┤           ┌──────────────────┐               │

                           ▼           │ PARENT DASHBOARD │ 🔴            │

                    ┌──────────────┐   │ progress·streaks │               │

                    │ SESSION END  │🔴 │ ·weak areas·     │               │

                    │ /RESULT      │   │  upgrade·settings│               │

                    │ Tinku reacts │   └───┬─────────┬────┘               │

                    │ stars earned │       ▼         ▼                    │

                    └──────┬───────┘  ┌─────────┐ ┌──────────┐            │

                           │          │ PAYWALL │ │ SETTINGS │ 🔴         │

                           │   🔴     │   🔴    │ │ (sound/  │            │

                           │          └────┬────┘ │ haptics/ │            │

                           │               │      │  voice)  │            │

                           └───────────────┴──────┴──────────┴────────────┘

                                   back to HOME

   DAILY-LIMIT screen 🔴 (Tinku sleeping) interrupts at session start when free quota used.

   LOGIN/LINK screen 🔴 appears at value moments (save streak / dashboard / purchase), parent-framed.

---

## 2\. Screen-by-Screen (inventory level)

### 2.1 Splash / Loading 🔴

- **Purpose:** brand moment while anonymous auth \+ data load happen silently.  
- **Components:** `MascotReaction` (waving), `AppLogo`, `LoadingDots`.  
- **Data in:** none. **Triggers:** anonymous sign-in, profile fetch.  
- **Note:** keep \<2s; never block on network (offline-first).

### 2.2 Grade Select 🟡

- **Purpose:** first-run grade pick; sets band (Wonder 1-3 / Explorer 4-5 later).  
- **Components:** `GradeCard` (x3-5), `MascotReaction` (happy).  
- **Data in:** none. **Data out:** `profile.grade`. **Shown:** first run only, editable later in settings.

### 2.3 Home / Map 🟡 *(you likely have a version)*

- **Purpose:** the hub. Launch today's session, see streak, pick topics.  
- **Components:** `MascotGreeting`, `StreakBadge`, `TodaysSessionButton` (primary CTA), `TopicList`/`TopicPath`, `ParentAreaButton` (corner, low-emphasis), `StarBalance`.  
- **Data in:** child profile, streak, skill levels (for topic states: locked/learning/mastered), whether daily session done.  
- **Key logic:** the big button reflects state — "Start today's practice" / "One more round?" / (if limit hit) routes to Daily-Limit.

### 2.4 Lesson / Concept Intro 🟡

- **Purpose:** teach a new skill visually before quizzing (the visual modules you have — emoji addition, fraction pies).  
- **Components:** `VisualConceptModule` (per skill type), `MascotReaction` (thinking/encourage), `ContinueButton`.  
- **Data in:** current skill. **Shown:** when a skill is newly introduced (level 0→1) or on remediation Wrong\#2.

### 2.5 Quiz / Session Screen 🟡 — **THE CORE LOOP**

- **Purpose:** where learning happens. One question at a time.  
- **Components:** `QuestionCard` (renders numeric/visual/word format), `OptionButton` (x3-4), `MascotReaction` (thinking while solving → celebrate/encourage on answer), `ProgressBar` (position in session), `HintBubble` (on Wrong\#1), `StarBurst` (correct).  
- **Data in:** composed session (list of questions from `SessionComposer`), current difficulty.  
- **Data out:** per-question result `{skillId, correct, misconceptionTag, timeMs}`.  
- **Key logic:** the remediation ladder lives here (Wrong\#1 hint → Wrong\#2 visual+retry → Wrong\#3 park+guaranteed-win). Mood floor enforced.

### 2.6 Session End / Result 🔴

- **Purpose:** celebrate, show what was earned, never end on failure.  
- **Components:** `MascotReaction` (celebrate), `StarsEarned`, `SessionSummary` (got X right, skill progress), `StreakUpdate`, `ContinueButton` / `OneMoreButton` (→ may hit limit), share hook (Phase 2).  
- **Data in:** session results, updated mastery, streak.  
- **Key logic:** triggers mastery updates \+ spaced-rep scheduling; may trigger upgrade prompt IF mastery milestone reached (not before).

### 2.7 Daily-Limit Screen 🔴

- **Purpose:** soft free-tier cap. The kid-side conversion nudge.  
- **Components:** `MascotReaction` (**sleeping** Tinku \+ Zzz), message ("Tinku's resting — new questions tomorrow\! 🌙"), `AskParentButton` (→ Paywall via Parent Gate), `BackHomeButton`.  
- **Key logic:** only at *session start* when quota used — NEVER mid-quiz. This is T31/T39.

### 2.8 Parent Gate 🔴

- **Purpose:** keep kids out of parent area / purchases (Families Policy \+ practical).  
- **Components:** `ParentGateChallenge` (simple math/hold-button an adult can do, a child can't easily), `MascotReaction`.  
- **Shown:** before Parent Dashboard, Paywall, Settings.

### 2.9 Parent Dashboard 🔴 — **THE PAID HOOK**

- **Purpose:** what parents pay for. Progress \+ insight.  
- **Components:** `ChildSwitcher` (siblings), `ProgressOverview` (free: summary), `WeakAreaCard` (free: teaser "⚠️ one area needs attention — unlock"; paid: detail \+ prerequisite tracing), `StreakCalendar`, `MasteryByTopic` (paid detail), `UpgradeCard`, `SettingsButton`, `ManageSubscriptionButton`.  
- **Data in:** aggregated session/mastery/misconception data per child.  
- **Key logic:** the free-summary vs premium-detail split (T4/T32). Free shows enough to prove value; gates the depth.

### 2.10 Paywall 🔴

- **Purpose:** convert at the value moment.  
- **Components:** `TierComparison` (free vs premium matrix), `PriceOptions` (monthly/annual, annual emphasised), `TuitionAnchorCopy` ("less than one tuition class/month"), `SiblingValueCopy`, `SubscribeButton` (→ Play Billing), `RestorePurchaseButton`.  
- **Key logic:** requires sign-in at purchase (T58); shows only parent-side.

### 2.11 Login / Link 🔴

- **Purpose:** upgrade anonymous → Google at value moments, zero progress loss.  
- **Components:** `ParentFramedHeader` ("Parents: sign in to save progress & view reports"), `GoogleSignInButton`, `SkipForNowLink`.  
- **Key logic:** `linkWithCredential` migration (T55-57). Parent-framed for DPDP.

### 2.12 Settings 🔴

- **Purpose:** parent controls.  
- **Components:** `ToggleRow` (sound / haptics / voice-over — T78), `ChangeGradeRow`, `ManageChildrenRow`, `ManageSubscriptionRow`, `PrivacyPolicyLink`, `SignOutRow`.

---

## 3\. Reusable Component Inventory (build these in isolation)

This is the answer to "build components separately so coding is easy." Build \+ test each standalone, then assemble into screens. Owner per Work Split in parentheses.

### Core interactive

- **`MascotReaction`** (Claude defines emotion-state API; AG styles) — takes `emotion` prop, shows right Tinku \+ animation. Used on nearly every screen.  
- **`QuestionCard`** (Claude — renders generator output) — switches numeric/visual/word format.  
- **`OptionButton`** (AG) — tappable answer, states: default/selected/correct/wrong.  
- **`VisualConceptModule`** (Claude logic \+ AG visuals) — the teach-a-concept widgets; one per skill family.  
- **`HintBubble`** (AG) — misconception-targeted hint text from Tinku.

### Progress & reward

- **`StreakBadge`** / **`StreakCalendar`** (AG, on T63 data)  
- **`StarBalance`** / **`StarsEarned`** / **`StarBurst`** (AG)  
- **`ProgressBar`** (AG) — position within a session.  
- **`MasteryByTopic`** / **`WeakAreaCard`** (Claude data \+ AG presentation)

### Navigation & shell

- **`TodaysSessionButton`** (AG, reads session state)  
- **`TopicList` / `TopicPath`** (AG, reads skill levels)  
- **`GradeCard`**, **`ChildSwitcher`**, **`ParentAreaButton`** (AG)  
- **`AppShell`/layout** \+ theme tokens (AG — T5)

### Gating & money

- **`ParentGateChallenge`** (Claude logic)  
- **`TierComparison`**, **`PriceOptions`**, **`UpgradeCard`** (AG \+ provided copy)  
- **`ToggleRow`** (AG)

### Feel (cross-cutting)

- **`useHaptics`** hook (Claude — PWA-safe), **`useSound`** hook (AG — Howler.js), CSS animation utilities (AG — T71).

---

## 4\. What you likely already HAVE vs NEW (the blend)

| Likely HAVE (reuse/refactor) 🟢🟡 | Definitely NEW 🔴 |
| :---- | :---- |
| Grade select | Session End / Result screen |
| Home/map (some form) | Daily-Limit (sleeping Tinku) screen |
| Quiz screen \+ scoring (needs generator \+ remediation rework) | Parent Gate |
| Visual concept modules (emoji add, fraction pie) | Parent Dashboard (the paid hook) |
| Basic question rendering | Paywall |
| Some Tailwind/styling base | Login/Link (anon→Google) |
|  | Settings (toggles) |
|  | Most reward components (stars/streak as data-driven) |

**Refactor flag:** your current Quiz screen almost certainly uses hardcoded questions and flat scoring. The MVP version must (a) consume the `SessionComposer` output, (b) implement the remediation ladder, (c) emit per-question results for mastery/dashboard. So the *screen* is HAVE but the *guts* are substantially NEW — budget for that, don't assume it's done.

---

## 5\. Build sequence implication (how this plugs into Work Split)

The dependency order stays the same; the screen map just clarifies the contracts:

1. **Claude** builds data/logic: skill map → generator → composer → mastery → the component **data contracts** (`MascotReaction` API, `QuestionCard` input shape, dashboard data shape).  
2. **Antigravity** builds the **visual components** against those contracts (`OptionButton`, `StreakBadge`, `TierComparison`, CSS animations…).  
3. **Assemble** screens from finished components — trivial once both halves exist.  
4. **You** assemble \+ test on a real phone \+ run kid-testing, then tune visual polish (the deliberately-deferred part).

**The contract that makes parallel work safe:** Claude publishes each component's prop/data shape in the decisions log (T70) the moment it's defined; Antigravity reads it before styling. No guessing, no collisions.

---

## 6\. Deliberately deferred (don't design now)

- Exact colours, spacing, final mascot placement, animation curves — tune during build.  
- Explorer-band (4-5) screens — same inventory, reskinned later.  
- Share cards, onboarding tutorial polish, empty-states beyond basics.  
- Anything on the Parked Ideas tab.

