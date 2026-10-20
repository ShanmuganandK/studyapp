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
 * GRADE MODE (DECISIONS 2026-10-20): `recommendNext(..., { grade })` scopes everything to that grade's skills
 * (due reviews, the frontier, new unlocks) and ASSUMES every earlier grade is already cleared, so a prereq that
 * belongs to an earlier grade counts as met. A Class 2 child therefore starts on Class 2 skills; Class 1
 * progress is never touched (it is stored per skill id) and is simply not suggested in Class 2 mode. With no
 * grade, or a grade that has no `ready` skills yet, behaviour is the old, unscoped one.
 *
 * Only `status:'ready'` skills are ever recommended — planned skills have no recipe.
 * Prereqs are checked via `isUnlockedLevel` on the prereq's stored state; a missing
 * state counts as locked — EXCEPT a prereq whose own skill is `planned`: it has no recipe, so no child
 * can ever practise it and it can never have a state. Treating it as locked would wall off everything
 * behind it forever (DECISIONS 2026-10-19), so it is skipped. When that skill ships (status 'ready')
 * the gate applies to it again with no further change.
 */

import { isMastered, isUnlockedLevel, isDueForReview } from './mastery.js';
import { COMPOSER } from '../config/composerConfig.js';

// ─── Prereq helper ────────────────────────────────────────────────────────────

/**
 * True if every prerequisite of `skillId` is at or above the unlock level.
 * Vacuously true when the skill has no prerequisites.
 * A prereq with no saved state is treated as locked (level 0), unless that prereq skill is not
 * `ready` (no recipe yet): those are skipped, see the file header.
 *
 * @param {string} skillId
 * @param {{ [skillId: string]: SkillState }} skillStates
 * @param {{ [skillId: string]: Skill }} skillMap
 * @param {number|null} [grade] - grade mode: prereqs from EARLIER grades are assumed cleared
 * @returns {boolean}
 */
export function isPrereqsMet(skillId, skillStates, skillMap, grade = null) {
  const skill = skillMap[skillId];
  if (!skill) return false;
  return skill.prereqs.every((prereqId) => {
    // A prereq with no recipe yet can never be satisfied by practice, so it cannot gate anything.
    const prereqSkill = skillMap[prereqId];
    if (prereqSkill && prereqSkill.status !== 'ready') return true;
    // Grade mode: the child is assumed to have cleared every earlier grade.
    if (grade != null && prereqSkill && prereqSkill.grade < grade) return true;
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
 * @param {number|null} [grade] - grade mode: only that grade's skills; earlier-grade prereqs assumed cleared
 * @returns {string[]}
 */
export function getFrontierSkills(skillStates, skillMap, grade = null) {
  return Object.values(skillMap)
    .filter((skill) => {
      if (skill.status !== 'ready') return false;
      if (grade != null && skill.grade !== grade) return false;
      if (!isPrereqsMet(skill.id, skillStates, skillMap, grade)) return false;
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
 * @param {{ grade?: number|null }} [options] - grade mode (see file header); omitted = unscoped
 * @returns {{ skillId: string | null, reason: 'review' | 'frontier' | 'new' | 'all_caught_up' }}
 */
export function recommendNext(skillStates, skillMap, today, config = COMPOSER, { grade = null } = {}) {
  // Grade mode only applies when that grade actually has ready skills (a grade with none, e.g. Class 3
  // today, falls back to the unscoped behaviour so the child is never left with nothing to do).
  const scope = grade != null && Object.values(skillMap).some((sk) => sk.status === 'ready' && sk.grade === grade)
    ? grade
    : null;
  const inScope = (id) => scope == null || skillMap[id]?.grade === scope;

  // ── 1. DUE REVIEW ────────────────────────────────────────────────────────
  // Catch forgetting before advancing. Only recommend ready skills (a mastered
  // skill must have been practiced, so this guard is defensive but harmless).
  const dueIds = getReviewsDue(skillStates, today).filter(
    (id) => skillMap[id]?.status === 'ready' && inScope(id)
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
  const frontierIds = getFrontierSkills(skillStates, skillMap, scope);

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
        inScope(skill.id) &&
        isPrereqsMet(skill.id, skillStates, skillMap, scope) &&
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
    .filter(([id, state]) => inScope(id) && isMastered(state) && state.nextReview !== null)
    .sort(([, a], [, b]) => a.nextReview.localeCompare(b.nextReview));

  return {
    skillId: masteredByNextReview.length > 0 ? masteredByNextReview[0][0] : null,
    reason: 'all_caught_up',
  };
}
