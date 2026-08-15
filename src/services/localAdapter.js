// Auth adapter — INERT, null-user seam.
//
// MVP is device-local and has NO accounts of any kind (DECISIONS 2026-08-14): no sign-in, no
// anonymous UID, no cloud. The Firebase Auth SDK was removed entirely in the de-Firebase change
// (the 2026-08-15 network audit found `lib/firebase.js` running `initializeApp()`/`getAuth()` at
// module scope on every app start, via a static import chain that the `isFirebaseConfigured`
// runtime check could not prevent).
//
// This adapter therefore reports a PERMANENTLY SIGNED-OUT state. It deliberately does NOT
// fabricate a local "dev user" the way the old mock did — a fake user would flow straight into
// `AuthContext` and surface as a bogus "Logged in as explorer@local.dev" line in the parent
// dashboard, i.e. the app claiming an account it does not have.
//
// SEAM PATTERN (same as the analytics no-op, `services/analytics.js`): the shape of the auth
// service is preserved so `AuthContext` and its consumers are untouched. When accounts return
// post-validation — anonymous-first, lawyer-gated — ONLY this file is replaced; no call-site moves.

/** The signed-out user. Always null: there is no account tier in MVP. */
const NULL_USER = null;

export const localAdapter = {
    // No sign-in path exists. Resolves to null rather than throwing so a stray caller
    // (none today — `Login.jsx` is unreachable) degrades quietly instead of crashing a child's
    // session.
    loginWithGoogle: async () => NULL_USER,

    logout: async () => NULL_USER,

    // Contract note: `AuthContext` gates rendering on `!loading`, and `loading` only clears
    // inside this callback — so it MUST fire, and must fire asynchronously to match the
    // subscribe-then-emit ordering real auth SDKs use. Emitting synchronously here would call
    // back before the caller has finished subscribing.
    onAuthStateChanged: (callback) => {
        const id = setTimeout(() => callback(NULL_USER), 0);
        return () => clearTimeout(id);
    },

    getCurrentUser: () => NULL_USER,
};
