/**
 * progressSummary — pure function that turns raw skill states into the parent dashboard
 * view-model. No storage reads, no Date.now() — all external state is injected so this
 * is trivially testable (STANDARDS §2/§8).
 *
 * Consumers (ParentDashboard) call progressStore.loadAllSkillStates() and pass the result
 * here along with today's ISO date. The component then just renders.
 */

import { SKILLS } from '../recipes/skillMap.js';
import { MASTERY } from '../config/masteryConfig.js';

// Stable sorted list of ready skills — computed once at module load, not per call.
const READY_SKILLS = Object.values(SKILLS)
  .filter((s) => s.status === 'ready')
  .sort((a, b) => a.grade - b.grade || a.order - b.order);

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysApart(isoEarlier, isoLater) {
  const ms =
    new Date(isoLater + 'T00:00:00Z') - new Date(isoEarlier + 'T00:00:00Z');
  return Math.round(ms / 86_400_000);
}

/**
 * Format a past ISO date as a friendly relative string.
 * Exported so tests can verify it independently.
 *
 * @param {string} lastSeen - ISO date string (YYYY-MM-DD)
 * @param {string} today    - ISO date string (YYYY-MM-DD)
 * @returns {string}
 */
export function formatRelativeDate(lastSeen, today) {
  const days = daysApart(lastSeen, today);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 6) return `${days} days ago`;
  return 'a while ago';
}

// ─── View-model builder ───────────────────────────────────────────────────────

/**
 * Build the parent dashboard view-model from raw skill states.
 *
 * @param {{ [skillId: string]: object }} skillStates
 *   From progressStore.loadAllSkillStates(). Missing/unknown keys mean level 0.
 * @param {string} today - ISO date string (YYYY-MM-DD), injected by caller
 * @returns {ProgressSummary}
 *   {
 *     mastered: SkillEntry[],      level === MASTERED_LEVEL
 *     inProgress: SkillEntry[],    0 < level < MASTERED_LEVEL
 *     notStarted: SkillEntry[],    level === 0 (or no saved state)
 *     masteredCount: number,
 *     lastActivity: string | null, 'today' / 'yesterday' / 'N days ago' / 'a while ago'
 *     skillsPractisedCount: number mastered + inProgress
 *   }
 *   Each SkillEntry: { skillId, displayName, icon, subtitle, level }
 */
export function progressSummary(skillStates, today) {
  const mastered = [];
  const inProgress = [];
  const notStarted = [];

  for (const skill of READY_SKILLS) {
    const state = skillStates[skill.id];
    const level = state?.level ?? 0;
    const entry = {
      skillId: skill.id,
      displayName: skill.displayName ?? skill.name,
      icon: skill.icon ?? '',
      subtitle: skill.subtitle ?? '',
      level,
    };

    if (level >= MASTERY.MASTERED_LEVEL) {
      mastered.push(entry);
    } else if (level > 0) {
      inProgress.push(entry);
    } else {
      notStarted.push(entry);
    }
  }

  // Most-recent lastSeen across ALL stored states (not just ready skills —
  // any practice counts as activity, including skills that later got removed).
  const allLastSeen = Object.values(skillStates)
    .map((s) => s.lastSeen)
    .filter(Boolean)
    .sort();
  const latestSeen = allLastSeen.at(-1) ?? null;

  return {
    mastered,
    inProgress,
    notStarted,
    masteredCount: mastered.length,
    lastActivity: latestSeen ? formatRelativeDate(latestSeen, today) : null,
    skillsPractisedCount: mastered.length + inProgress.length,
  };
}
