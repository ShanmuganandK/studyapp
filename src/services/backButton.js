/**
 * backButton — what the Android hardware/gesture Back does in this app (a single-view state
 * machine, no router, so the WebView has no history to pop). Pure and framework-free so it is
 * exhaustively testable.
 *
 * Outermost thing first: an open parent-gate dialog closes; a quiz or the parent zone returns to
 * the skill list (the same place the nav "home" goes, so Back never discards anything the existing
 * navigation wouldn't); on the skill list itself Back leaves the app, as every Android app does.
 *
 * @param {{ isGateOpen: boolean, currentView: string }} state
 * @returns {'close-gate' | 'go-skills' | 'exit'}
 */
export function backAction({ isGateOpen, currentView }) {
  if (isGateOpen) return 'close-gate';
  if (currentView !== 'skills') return 'go-skills';
  return 'exit';
}
