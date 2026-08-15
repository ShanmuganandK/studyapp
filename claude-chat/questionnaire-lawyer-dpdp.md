# Written Questionnaire — Indian Data-Protection Counsel (DPDP Act 2023)
**Re: "Tinku Math" — children's math-practice app (Google Play, India market)**

## How to use this document
This questionnaire is designed for **written responses**. Please answer each numbered
question directly beneath it. Where the law is unsettled (pending DPDP Rules), please
say so explicitly and give your recommended *defensible-today* position plus the
trigger that should prompt re-review. Where a question doesn't apply, a one-line
"N/A because ___" is perfect. Questions are ordered by build impact — Sections A and
B gate active development; C–F can follow later if needed.

## Factual background (please read before answering)

1. **Operator:** solo founder, **Indian citizen resident in the UAE** (NRI), no
   Indian entity, no Indian presence. App distributed via Google Play to users in
   India. Revenue (future) via Google Play Billing subscriptions in ₹. Please flag
   any answer where my Indian citizenship changes the analysis versus a foreign
   operator.
2. **Users:** children in Grades 1–3 (ages ~6–9) use the app; parents supervise
   install and manage settings.
3. **Current state ("Layer 1" — live):** completely anonymous. No sign-up, no name,
   email, phone, or photo. Progress is stored **only on the device**, keyed by a
   randomly generated UUID. **As of 2026-07-16: analytics have been removed
   entirely from the MVP build — no Firebase Analytics SDK ships, zero telemetry
   for guest sessions.** (This section originally described a behavioural-analytics
   layer; that layer has since been cut from MVP scope — see item 6.)
4. **Planned state ("Layer 2" — NOT built, gated on your answers):** a parent-framed
   account step ("Parents: sign in to save progress & view reports") using Google
   sign-in by the parent. This would enable: cloud backup of progress (Firestore,
   Google infrastructure, servers likely outside India), cross-device sync, multiple
   child profiles under one parent account, and a paid subscription.
5. **Data intended to be stored in Layer 2 per child:** a nickname or generic label
   ("Child 1"), grade band, skill-progress numbers, streak counts. Deliberately NOT
   intended: full name, DOB, photo, school, location, contacts.
6. In-app: a parental gate (arithmetic challenge / passcode) guards the parent zone;
   an accurate privacy notice states no personal information is collected during
   play — true as written now that MVP analytics are fully removed. **MVP also has
   NO outbound messaging** (no WhatsApp/email/push summaries) — the parent
   dashboard is the only report, viewed on demand in-app. No parent contact details
   (phone/email) are collected in MVP.

---

## Section A — Status of the anonymous layer (gates the current app)

**A1.** Under the DPDP Act, does Layer 1 as described constitute "processing of
personal data" of a child at all? Specifically, does a random, device-scoped UUID
— with no linked identifiers and (per the update above) no analytics event stream
at all — amount to personal data?

**A2.** Given analytics have been removed entirely from MVP: does Section 9's
tracking/behavioural-monitoring prohibition have anything left to apply to in
Layer 1 as currently built? Please confirm whether local-only, on-device progress
storage (never transmitted anywhere) falls outside DPDP's scope entirely.

**A3.** With no analytics SDK and no data leaving the device in MVP: is there any
remaining cross-border-transfer question for Layer 1? (This section is likely N/A
given the update — please confirm.)

**A4.** Is our in-app privacy-notice wording ("No sign-up needed to play. We never
collect your child's name, email, or personal information. Your child's progress is
saved right here on your device.") legally accurate now that analytics are fully
removed from MVP?

> ### ✅ A4 — CLOSED UNCONDITIONALLY (2026-08-15). Factual premise now verified.
>
> A4 was previously closed **conditionally**, pending a check that the shipping build
> actually behaved as this question describes. **That check has been done** — the
> 2026-08-15 network audit — and it did **not** pass on the first look: the build was
> initializing **Firebase Auth on every app start**, so a device carrying a persisted
> legacy Google session was contacting Google at launch. The wording above would have
> been inaccurate as shipped.
>
> **That defect is fixed** (`firebase` dependency removed, `lib/firebase.js` and
> `firebaseAdapter.js` deleted, auth seam reduced to an inert null-user adapter), and the
> premise is now verified three ways: no source file imports firebase; **zero** Google
> identity endpoints anywhere in `dist/`; and the built app, loaded in a real browser,
> issues **12 requests — all same-origin, zero off-origin**. A standing guard test
> (`services/__tests__/noFirebaseAuth.test.js`) prevents silent regression.
>
> **Do not reopen A4 as a factual question.** What remains is only the legal
> characterisation, and it is already settled in the same direction by DECISIONS
> 2026-08-14: **do not use the absolute claim "we collect no personal data."** The notice
> states the app-side facts flatly (no sign-up, no accounts, no analytics, no tracking,
> progress stays on the device) **plus** one line acknowledging standard store/hosting
> technical data — Play Console vitals and Netlify request logs are real and outside our
> control. See the 2026-08-15 amendment in DECISIONS.
>
> ⚠️ **Note for whoever sends this pack:** the tracker records a **v2** of this
> questionnaire (22 questions → 12, answered items retired to a §0 "closed, please
> confirm" table). **v2 is not in this repo** — this file is still v1. Either commit v2
> before sending, or send v1 and treat this box as its §0 entry for A4.

## Section B — Verifiable parental consent (gates all account/cloud/paywall work)

**B1.** For Layer 2: parent authenticates with their own Google account via a
parent-framed flow and affirms they are the parent/guardian. Does this satisfy
"verifiable consent of the parent" under Section 9(1) as things stand today?

**B2.** If B1 is insufficient: rank the following mechanisms from minimum-viable to
gold-standard for our context, noting cost/friction: (a) self-declaration + adult
Google account; (b) declaration + successful ₹ payment via Play Billing;
(c) OTP to parent's mobile; (d) DigiLocker / Aadhaar-based age token;
(e) other mechanisms you'd recommend.

**B3.** What should we **log as evidence** of the consent event (timestamp, method,
declaration text version, parent account identifier, IP?) — and for how long must we
retain it?

**B4.** Consent withdrawal: what must the in-app mechanism do, within what timeframe,
and what happens to the child's cloud data (deletion vs. return to device-only)?

**B5.** The DPDP Rules (consent-manager / VPC specifics) were pending finalisation:
what is the current status, what is your recommended defensible position **today**,
and what event should trigger a re-review by you?

## Section C — Scope of child data under a consented account

**C1.** With valid parental consent, any DPDP objection to storing: child nickname,
grade band, skill progress, streaks? Anything in this list you'd still advise
against as a data-minimisation matter?

**C2.** Anything additional triggered by multiple child profiles under one parent
account?

**C3.** A possible future feature (currently deferred, post-MVP, post-consent-stack)
would send a weekly one-line progress summary to the parent via WhatsApp or email.
Consent/commercial-communication requirements, if/when this returns to scope?

## Section D — Operator obligations

**D1.** Grievance officer: for a fiduciary who is an Indian citizen but resident
abroad, is a named contact + email in the privacy policy sufficient? Any
India-residency or response-time requirement for the officer/contact person?

**D2.** Realistic likelihood/triggers of Significant Data Fiduciary classification
for an app of this profile, and what obligations that would add.

**D3.** Privacy policy & terms: required contents for this product under DPDP +
Google Families Policy expectations; must the policy be presented in-app before any
processing; any language (Hindi/regional) requirement? Please quote for drafting or
reviewing these documents.

**D4.** Breach notification duties for a one-person operator: to whom, in what
timeframe, in what form? (Note: with zero data collection/transmission in MVP,
please confirm whether this is currently N/A.)

**D5.** Retention & erasure: recommended/required defaults for child progress data
(e.g. auto-deletion after N months of inactivity) and for the consent logs from B3
(applicable once Layer 2 is built).

## Section E — Extraterritorial exposure & structure

**E1.** DPDP applies to processing outside India connected to offering goods/services
in India. As an **Indian citizen residing in the UAE** with no Indian entity: any
practical differences in how obligations/enforcement apply to me versus an
India-based company — and does my citizenship give the regulator any additional
practical reach (service of notices, enforcement) I should plan around?

**E2.** Any data-protection or consumer-law reason to prefer an Indian entity before
scale? (Tax questions are with our CA separately — this asks only about the
regulatory dimension.)

**E3.** Given per-instance penalty exposure under DPDP, what documentation/practices
most effectively evidence good faith for a small operator (records of processing,
DPIA-lite, vendor list, etc.)?

## Section F — Forward-looking (brief answers fine)

**F1.** If we later add voice recording (child speaks answers) or any camera/photo
feature — which additional obligations does that trip, so we can price the decision
now?

**F2.** Anything in the pending DPDP Rules you'd flag as likely to affect a
children's-education app specifically?

---

## Final triage (most important question in this document)

**G1.** Based on all the above, please sort your findings into three lists:
1. **Must be resolved before launching paid parent accounts (Layer 2).**
2. **Should be resolved soon after (with suggested deadline).**
3. **Fine as currently designed.**

**G2.** Your fee estimate for: (a) this written opinion, (b) privacy policy + terms
drafting, (c) a re-review when the DPDP Rules are finalised.
