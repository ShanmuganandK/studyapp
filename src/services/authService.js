// The single auth seam for the app. INERT in MVP.
//
// MVP ships with no accounts (DECISIONS 2026-08-14), so there is exactly ONE adapter — the
// null-user `localAdapter` — and no environment branch. The previous `isFirebaseConfigured`
// branch was actively misleading: it chose which adapter OBJECT to call, but the static
// `import { firebaseAdapter }` above it had already executed `lib/firebase.js`, initializing
// Firebase Auth on every app start regardless of the flag. That is the defect the 2026-08-15
// network audit found; the SDK, both Firebase files and the `firebase` dependency are now gone.
//
// Consumers (`contexts/AuthContext.jsx`) are unchanged. When accounts return post-validation,
// swap the adapter here.

import { localAdapter } from './localAdapter';

const adapter = localAdapter;

export const authService = {
    login: () => adapter.loginWithGoogle(),
    logout: () => adapter.logout(),
    onAuthStateChanged: (cb) => adapter.onAuthStateChanged(cb),
    getUser: () => adapter.getCurrentUser()
};
