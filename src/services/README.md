# src/services/ — external-SDK boundary

The **only** place external SDKs are touched (Firebase Auth, Firestore, Play Billing).
Part of the new core grown alongside the frozen legacy app (DECISIONS.md "Migration
strategy"). Keeps the rest of the codebase pure and mockable (STANDARDS §2/§3).

**Purpose (planned new-core modules):**
- **Auth** — anonymous-first (`signInAnonymously()` on first launch), with later
  anonymous → Google linking via `linkWithCredential` (zero progress loss).
- **Firestore** — child state persistence under `users/{uid}/...` (see STANDARDS §4),
  offline-first.
- **Billing** — Google Play Billing (later task).

**Rules:** new code calls services; services never call `hooks/` or `engine/`. No app state
in browser storage. Gated behind `flags.useFirestore` / future auth flags
(`src/config/flags.js`).

## ⚠️ Frozen legacy in this folder (do not modify)

These predate the migration decisions and are **frozen** — they keep running until their
new-core replacement is proven behind a flag, then they are deleted. Never edit them; new
code never imports them:

- **`authService.js`** — Google-**popup-first** auth (`loginWithGoogle()`), which contradicts
  the anonymous-first decision. To be replaced by the anonymous-first auth service.
- **`firebaseAdapter.js`** / **`localAdapter.js`** — the popup/local auth adapters behind
  `authService.js`.

(Related frozen legacy elsewhere: `src/utils/generators/`, `src/data/questions*`,
`src/utils/masteryEngine.js`, and the localStorage app state.)
