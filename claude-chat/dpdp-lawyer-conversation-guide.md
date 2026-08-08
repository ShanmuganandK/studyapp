# DPDP Legal Consult — Conversation Guide (~60 min)
*Companion to legal-consult-brief-dpdp.md (send the brief ahead; this is the live-session script.)*

## Opening context (2 min — say this, then stop talking)

"I'm a solo UAE-based founder, Indian citizen (NRI), shipping a math practice app
for Indian children, Grades 1–3, on Google Play India. As of this consult, the app
is deliberately lean:

**Layer 1 — live today:** fully anonymous. No sign-up, no name, no email, no phone.
A child plays; progress is stored only on the device under a random UUID. As of
2026-07-16, I removed ALL analytics from the MVP — no Firebase Analytics SDK ships,
zero telemetry, guest or otherwise. Nothing about a child's play is ever
transmitted anywhere.

**Layer 2 — designed but NOT built, gated on this conversation:** a parent creates an
account (Google sign-in, parent-framed), which enables cloud backup of progress,
cross-device sync, and a paid subscription via Google Play Billing.

I need to know exactly what DPDP requires of Layer 2, and confirm Layer 1's current
zero-collection design is as clean as I believe it to be."

---

## Q1 — The anonymous layer (confirm it's clean)

**Ask:** "With zero analytics and zero data transmission in Layer 1 — local-only
UUID and progress, never sent anywhere — is there anything left for DPDP to say
about this layer at all? I believe this is now outside the Act's practical scope;
please confirm or correct."

**Why it matters:** if confirmed clean, the current app and its privacy notice ship
as-is, permanently, regardless of what happens with Layer 2.

**Decision I'll record:** Layer 1 = [confirmed outside DPDP practical scope / other: ___]

## Q2 — Verifiable parental consent (the keystone question)

**Ask:** "When Layer 2 launches: a PARENT taps 'Parents: sign in', authenticates with
their own Google account, and states they're the parent. Does that satisfy DPDP's
'verifiable consent of the parent' — or does 'verifiable' require me to verify the
person is an adult/actual parent (DigiLocker, payment-card check, OTP against
Aadhaar-linked mobile, etc.)?"

**Follow-ups:**
- "What's the current state of the draft DPDP Rules on consent mechanisms, and
  what's the safest mechanism that isn't DigiLocker-grade friction? Is a small
  Play-Billing transaction (₹ payment) itself decent age-verification evidence?"
- "Is self-declaration + adult Google account + OTP defensible TODAY given rules
  aren't final — and what should I log/store as evidence of the consent event?"
- "Does consent need to be re-obtainable/withdrawable in-app, and what has to happen
  to the child's cloud data on withdrawal?"

**Why it matters:** this single answer gates the auth rebuild, cloud sync, accounts,
and the paywall.

**Decision I'll record:** VPC mechanism = [Google sign-in + declaration OK /
declaration + OTP / stronger mechanism required: ___]

## Q3 — What the parent account may store about the child

**Ask:** "Post-consent, the cloud stores: a child nickname or 'Child 1' label, grade
band, skill progress, streaks — under the parent's account. Any DPDP limits on this?
Anything I should refuse to collect even with consent (e.g. child's full name, DOB,
photo) as a matter of data-minimisation prudence?"

**Follow-up:** "Multiple children under one parent account — anything special?"

## Q4 — My obligations as the operator (housekeeping, exact list)

**Ask:** "As an Indian citizen resident in the UAE serving Indian children:
1. Grievance officer — is a named contact + email in the privacy policy enough, or
   is there a formal designation/India-residency requirement?
2. Am I at risk of 'Significant Data Fiduciary' classification, and what would
   trigger it?
3. Privacy policy — required contents/language for this product, and does it need
   to be served in-app pre-consent?
4. Breach notification — what's my actual duty as a one-person company, given
   Layer 1 currently transmits nothing at all?
5. Data retention/erasure — required defaults for child progress data once Layer 2
   exists (e.g. inactive account deletion)?"

## Q5 — Structure & exposure (10 min, pairs with the CA consult)

**Ask:** "As an Indian citizen operating from the UAE (no Indian entity), selling via
Google Play Billing to Indian consumers:
- Does my citizenship change how DPDP applies or is enforced compared to a fully
  foreign operator?
- Is there any DPDP or consumer-law reason to prefer an Indian entity before scale?
- Penalties are per-instance and large — what's the realistic exposure profile for a
  good-faith small operator, and what documentation most protects me?"

## Q6 — The forward look (5 min)

**Ask:** "Two roadmap items, currently deferred past MVP entirely, to sanity-check so
I don't design into a wall when they return:
1. A weekly parent progress summary via WhatsApp/email (post-consent-stack only) —
   consent and messaging-rule implications when it returns?
2. If I later add photos/voice (e.g. child records answers) — what tier of
   requirements does that trip?"

---

## Closing (5 min)

- "Of everything discussed: what MUST change before I launch paid accounts, what
  SHOULD change soon, and what's fine as-is?" *(forces the triage)*
- "Can you produce/review the privacy policy + terms, and at what cost?"
- "When the final DPDP Rules land, what's the re-review trigger I should watch for?"

## After the call — record in DECISIONS.md (dated)

- Layer 1 status: ___
- VPC mechanism approved: ___
- Consent evidence to log: ___
- Child-data schema limits: ___
- Grievance officer requirement: ___
- Launch blockers vs. soon vs. fine: ___
→ Then un-gate or amend T109 (auth rebuild cloud half) accordingly.
