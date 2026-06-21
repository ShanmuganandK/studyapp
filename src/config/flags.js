/**
 * Feature flags — the strangler-fig switches for the legacy → new-core migration.
 *
 * Per DECISIONS.md "Migration strategy": the existing Antigravity app is a validated UI
 * prototype, and we rebuild the core (auth, storage, mastery, question generation) in new
 * folders without ever editing legacy. Each screen reads a flag to choose its path:
 * flag OFF = legacy behaviour (unchanged), flag ON = new-core behaviour. Flip locally to
 * test; flip off for instant rollback. A legacy path is deleted only after its flag has run
 * `true` confidently in real use.
 *
 * All flags default to `false` so master always boots the known-good legacy app.
 * This is the single source of truth for these switches (STANDARDS §2 — config over
 * hardcoding). Add new migration flags here, defaulting to `false`.
 */
export const flags = {
  /** Questions come from the recipe engine (src/recipes) instead of the legacy
   *  Math.random() generators + stored banks (src/utils/generators, src/data/questions*). */
  useRecipeEngine: false,

  /** App state persists to Firestore (anonymous-first UID) instead of the legacy
   *  localStorage state. */
  useFirestore: false,

  /** Mastery + progression use the new spaced-repetition engine (src/engine) instead of the
   *  legacy "3-in-a-row keyed to question slots" masteryEngine.js. */
  useNewMastery: false,
};
