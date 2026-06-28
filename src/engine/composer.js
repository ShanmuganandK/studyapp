/**
 * Practice composer — "what should the child practise now?"
 *
 * Pure functions only: no Firebase, no localStorage, no React, no Date.now().
 * `today` is always passed in so every function is deterministic and testable.
 * `skillStates` is loaded by the caller (SkillSelectScreen / hook); this module
 * never reads or writes storage.
 *
 * Recommendation priority (fixed by spec):
 *   1. due-review  — mastered skill whose nextReview ≤ today (catch forgetting first)
 *   2. frontier    — started but not yet mastered (the active learning edge)
 *   3. new-unlock  — unlocked but not yet started (next progression step)
 *   4. all_caught_up — everything available mastered and nothing due (fallback / celebrate)
 *
 * Only `status:'ready'` skills are ever recommended — planned skills have no recipe.
 * Prereqs are checked via `isUnlockedLevel` on the prereq's stored state; a missing
 * state counts as locked.
 */

import { isMastered, isUnlockedLevel, isDueForReview } from './mastery.js';
import { COMPOSER } from '../config/composerConfig.js';

// ─── Prereq helper ────────────────────────────────────────────────────────────

/**
 * True if every prerequisite of `skillId` is at or above the unlock level.
 * Vacuously true when the skill has no prerequisites.
 * A prereq with no saved state is treated as locked (level 0).
 *
 * @param {string} skillId
 * @param {{ [skillId: string]: SkillState }} skillStates
 * @param {{ [skillId: string]: Skill }} skillMap
 * @returns {boolean}
 */
export function isPrereqsMet(skillId, skillStates, skillMap) {
  const skill = skillMap[skillId];
  if (!skill) return false;
  return skill.prereqs.every((prereqId) => {
    const state = skillStates[prereqId];
    return state ? isUnlockedLevel(state) : false;
  });
}

// ─── Query helpers (also useful for the UI: badging, review count) ────────────

/**
 * All skill IDs currently due for spaced-repetition review
 * (mastered AND nextReview ≤ today).
 *
 * @param {{ [skillId: string]: SkillState }} skillStates
 * @param {string} today - ISO date string (YYYY-MM-DD)
 * @returns {string[]}
 */
export function getReviewsDue(skillStates, today) {
  return Object.keys(skillStates).filter((id) =>
    isDueForReview(skillStates[id], today)
  );
}

/**
 * Skill IDs that are: status 'ready', prereqs met, started (level > 0), not yet mastered.
 * Sorted by grade then order (curriculum sequence).
 *
 * @param {{ [skillId: string]: SkillState }} skillStates
 * @param {{ [skillId: string]: Skill }} skillMap
 * @returns {string[]}
 */
export function getFrontierSkills(skillStates, skillMap) {
  return Object.values(skillMap)
    .filter((skill) => {
      if (skill.status !== 'ready') return false;
      if (!isPrereqsMet(skill.id, skillStates, skillMap)) return false;
      const state = skillStates[skill.id];
      return state && state.level > 0 && !isMastered(state);
    })
    .sort((a, b) => a.grade - b.grade || a.order - b.order)
    .map((s) => s.id);
}

// ─── Core recommender ────────────────────────────────────────────────────────

/**
 * Recommend the single best skill to practise now.
 *
 * @param {{ [skillId: string]: SkillState }} skillStates - from progressStore, passed in
 * @param {{ [skillId: string]: Skill }} skillMap - the SKILLS object from skillMap.js
 * @param {string} today - ISO date string (YYYY-MM-DD), injected by caller
 * @param {object} [config] - defaults to COMPOSER; pass override in tests
 * @returns {{ skillId: string | null, reason: 'review' | 'frontier' | 'new' | 'all_caught_up' }}
 */
export function recommendNext(skillStates, skillMap, today, config = COMPOSER) {
  // ── 1. DUE REVIEW ────────────────────────────────────────────────────────
  // Catch forgetting before advancing. Only recommend ready skills (a mastered
  // skill must have been practiced, so this guard is defensive but harmless).
  const dueIds = getReviewsDue(skillStates, today).filter(
    (id) => skillMap[id]?.status === 'ready'
  );

  if (dueIds.length > 0) {
    let chosen = dueIds[0];
    if (config.PREFER_MOST_OVERDUE_REVIEW && dueIds.length > 1) {
      // Most overdue = earliest nextReview date (ISO string sort is chronological).
      chosen = dueIds.reduce((best, id) =>
        skillStates[id].nextReview < skillStates[best].nextReview ? id : best
      );
    }
    return { skillId: chosen, reason: 'review' };
  }

  // ── 2. FRONTIER ──────────────────────────────────────────────────────────
  // The child's active learning edge: unlocked, started, not yet mastered.
  const frontierIds = getFrontierSkills(skillStates, skillMap);

  if (frontierIds.length > 0) {
    let chosen = frontierIds[0]; // already in curriculum order
    if (config.FRONTIER_PICK === 'lowest_level' && frontierIds.length > 1) {
      chosen = frontierIds.reduce((best, id) => {
        const bestLevel = skillStates[best]?.level ?? 0;
        const thisLevel = skillStates[id]?.level ?? 0;
        return thisLevel < bestLevel ? id : best;
      });
    }
    return { skillId: chosen, reason: 'frontier' };
  }

  // ── 3. NEW UNLOCK ────────────────────────────────────────────────────────
  // Nothing in progress → start the next available skill in curriculum order.
  // "Not started" = no saved state or level === 0.
  const newUnlocks = Object.values(skillMap)
    .filter(
      (skill) =>
        skill.status === 'ready' &&
        isPrereqsMet(skill.id, skillStates, skillMap) &&
        !(skillStates[skill.id]?.level > 0)
    )
    .sort((a, b) => a.grade - b.grade || a.order - b.order);

  if (newUnlocks.length > 0) {
    return { skillId: newUnlocks[0].id, reason: 'new' };
  }

  // ── 4. ALL CAUGHT UP ─────────────────────────────────────────────────────
  // Everything available is mastered and nothing is due. Return the mastered
  // skill with the nearest upcoming review date so the UI has something to
  // nudge toward (or celebrate). skillId is null if nothing is mastered yet
  // (an edge case that shouldn't happen in practice at this branch).
  const masteredByNextReview = Object.entries(skillStates)
    .filter(([, state]) => isMastered(state) && state.nextReview !== null)
    .sort(([, a], [, b]) => a.nextReview.localeCompare(b.nextReview));

  return {
    skillId: masteredByNextReview.length > 0 ? masteredByNextReview[0][0] : null,
    reason: 'all_caught_up',
  };
}
