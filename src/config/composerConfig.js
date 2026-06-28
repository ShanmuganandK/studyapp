/**
 * Practice composer tunables — single source of truth.
 *
 * Priority order is fixed (review > frontier > new > all_caught_up).
 * The values here control tie-breaking and picking within each tier so
 * kid-test feedback ("always review the most-forgotten first") changes a
 * flag, not logic. (STANDARDS §8 — centralize constants.)
 */
export const COMPOSER = {
  // Among multiple due reviews, pick the most overdue (earliest nextReview date).
  // Set false to pick the first in skill-map order instead.
  PREFER_MOST_OVERDUE_REVIEW: true,

  // How to pick among multiple frontier skills (started but not mastered).
  // 'lowest_level'  → the skill furthest from mastery (most help needed).
  // 'skillmap_order' → the first unlocked skill in curriculum order.
  FRONTIER_PICK: 'lowest_level',
};
