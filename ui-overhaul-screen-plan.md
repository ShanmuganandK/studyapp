# UI Overhaul — Screen-by-Screen Plan

**How to run this:** One screen per task/branch, in this order (kid-impact first). Each screen: build → phone-test → commit → next. Every screen follows `ui-overhaul-design-direction.md` (read it each task). RESKIN ONLY — no logic changes. Tokens created in Screen 1, reused after.

**Order (by kid-impact):**
1. Quiz screen (where kids live)
2. Session-end celebration (the reward event)
3. Skill-select / home (the front door)
4. Parent dashboard + parent zone (the paying customer)
5. Sweep: nav bar, gate, loading states, transitions
**Quarantined (do NOT design now):** onboarding / auth / consent screens — lawyer-gated.

---

## Screen 1 — Quiz Screen (SessionPlayer + QuestionView) — the heart

**Why first:** kids spend 90% of their time here; it's where delight matters most. Also where the tokens get created.

**Build:**
- **Establish the design tokens** (color/type/space/radius/shadow per the direction doc) in Tailwind config / tokens file. All Screen-1 styling uses them; later screens reuse.
- **Layout (keep the proven structure):** top bar (back + progress + mute) / Tinku / question / options — the fit-one-viewport flex structure stays EXACTLY as-is (it's tested); this is a visual dressing of it.
- **Tinku zone:** Tinku hosted in a subtle "stage" (soft ground shadow/platform so he feels IN the world, not floating). Breathe + cross-fade stay.
- **Question presentation:** big, friendly question text (token type). Count-objects tray becomes a warm bounded card (soft fill, rounded) — ten-frame grid stays. Compare format: the two numbers get playful weight, the answer box inviting. On a correct answer the operator animates into the blank so the full statement completes (e.g. "5 < 15") before the question transitions out (green success tone); the wrong-#2 reveal also fills the blank with the correct sign but in the sky/learn "here's how" tone (teaching, not a win). The dashed placeholder stays in resting/wrong/hint states; the blank never shows a wrong sign.
- **Option buttons → `<KidButton>` primitive:** big, soft-rounded, slight elevation; **press = squish** (transform scale ~0.96); correct = success pop (scale bounce + color) syncing with the chime; wrong = gentle shake-free encourage tint (NO harsh red, no aggressive shake).
- **Hint = `<TinkuBubble>`:** the hint renders as Tinku's speech bubble (tail pointing to him), animates in (pop/slide, opacity+transform), clearly THE teaching moment. (Representation already improved — this makes it fully on-design.)
- **Progress indicator:** friendly (e.g. small filled dots/stars-of-progress — but NOT reward-stars; keep meanings distinct) instead of bare "3 / 8" if it reads better; keep it subtle.
- **Micro-motion:** question transitions (old slides/fades out, new in, 200ms), option stagger-in on new question (tiny, fast).
- **Feedback completes the visible statement where one exists:** for a format that renders a blank (compare now, text-input later), the correct answer fills the blank so the statement reads complete; formats without a blank (mcq, count-objects) keep the option-pop feedback. View-state only (no new data plumbed from the hook/recipe).

**Verify:** phone; fit-one-viewport holds at 360×640 AND 320px; all three formats (mcq / count-objects / compare); press/correct/wrong/hint feels; low-end smoothness (no jank); tests green (no logic touched).

---

## Screen 2 — Session-End Celebration — the reward event

**Why second:** the celebration is what makes a kid want to play AGAIN. Currently functional; must become an EVENT.

**Build:**
- **Celebration sequence** (a beat-by-beat moment, not a static screen): Tinku celebrate pose pops in → **confetti/star burst** (CSS/lightweight canvas, GPU-safe, brief) → stars/score count up with little pops → "Great job!" big and warm → buttons (Play again / Home) arrive last.
- Pairs with the existing `complete` fanfare sound.
- **Mood floor holds:** ALWAYS celebratory regardless of score (existing logic — untouched).
- Show earned stars/progress warmly; if a skill leveled up or got MASTERED, make that a special extra beat ("You mastered Pop the Balloons! ⭐" with amber celebration) — reads from existing state, no new logic.
- `<KidButton>` reuse; celebration components built as reusable primitives (mastery-up moments can reuse later).

**Verify:** phone; the sequence feels JOYFUL (watch it as a kid would); works on low-end (no jank — keep particle counts modest); replay flows correctly; tests green.

---

## Screen 3 — Skill-Select / Home — the front door

**Why third:** first impression + daily return screen.

**Build:**
- **Header:** Tinku welcoming (waving pose), warm greeting ("What shall we practise?" stays — it's good), the world's colors.
- **Skill cards → `<Card>` primitive:** bigger, friendlier — icon prominent, displayName big, subtitle small, mastery pips integrated cleanly; soft elevation; press squish; slight stagger-in on load.
- **"Tinku suggests" highlight:** make the recommended card feel gently special (soft glow/pulse once, a small Tinku-points badge or "Tinku suggests!" ribbon) — inviting, not shouty; review (↻) styling for due reviews.
- **Locked/coming-soon skills** (when more recipes land): a friendly locked style (soft, "coming soon" — not punitive grey).
- **Footer:** the privacy line (already added) styled subtly on-theme; bottom nav polished (Screen 5 finalizes).
- Scroll: clean (thin/hidden bar per earlier decision), peek affordance if natural.

**Verify:** phone; front-door feel ("would a kid want to tap in? would a parent think 'quality'?"); pips/suggestion/review states all read clearly; fit + smoothness.

---

## Screen 4 — Parent Dashboard + Parent Zone — the paying customer

**Why fourth:** the parent decides to pay; the surface must feel PREMIUM-calm (warm-professional, not babyish).

**Build:**
- Same token family, **calmer register:** more whitespace, less motion (subtle fades only), informational hierarchy.
- **Progress section:** the positive framing stays; upgrade the visual — clean per-skill rows with refined pips/mini-bars, the celebratory "N skills mastered! 🎉" as a warm highlight card, "currently working on" neat.
- **Gate screen:** styled on-theme (calm, clearly for-parents).
- Feedback link + privacy notice + passcode styled consistently.
- A parent should close it feeling: *this is a thoughtfully made, trustworthy product.*

**Verify:** phone; read it AS a parent — premium-calm? reassuring? nothing babyish or cluttered; tests green.

---

## Screen 5 — Sweep: Nav, Gate, Loading, Transitions — the connective tissue

**Build:**
- **Bottom nav:** polished on-theme (icons, active states, maybe a subtle active pill).
- **Loading states:** any spinner/blank becomes a friendly beat (Tinku thinking / soft skeleton) — never a dead white screen.
- **Screen transitions:** consistent gentle slide/fade between screens (200ms, GPU).
- **Error/edge states:** offline or failure → gentle Tinku message, never a raw error (child-safe failure, per §8).
- Final consistency pass: any straggler screens/elements onto tokens; delete dead styles.

**Verify:** phone; walk the ENTIRE app end-to-end as a kid then as a parent — one coherent world, no seams, no unstyled corners; all tests green; fit + perf hold everywhere.

---

## After all five screens
- **Full regression:** all suites green; play every skill; parent flows; persistence; suggestion; sounds; hints.
- **Update ARCHITECTURE.md** (tokens file, primitives, any new components) — same commits as the work.
- **Then:** India testing happens on THIS — the real, attractive product. Kid feedback tunes tokens/dials, not structure.

## Standing reminders for every screen task
- Read `ui-overhaul-design-direction.md` + STANDARDS §5/§8 + docs/responsive.md first.
- Reskin only; logic untouched; tests must stay green.
- Tokens, not raw values; primitives when repeated 3+.
- Phone-test before commit; small phone (360/320) included.
- Auth/onboarding/consent screens stay quarantined.
