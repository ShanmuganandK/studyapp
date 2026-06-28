import { useState } from 'react';
import { Lock } from 'lucide-react';
import Mascot from './Mascot';
import { loadAllSkillStates } from '../services/progressStore';
import { progressSummary } from '../engine/progressSummary';
import { MASTERY } from '../config/masteryConfig';

// ─── Local helpers ────────────────────────────────────────────────────────────

function levelLabel(level) {
  if (level >= MASTERY.MASTERED_LEVEL) return 'Mastered ⭐';
  if (level >= MASTERY.UNLOCK_LEVEL) return 'Doing great';
  return 'Learning';
}

function levelLabelColour(level) {
  if (level >= MASTERY.MASTERED_LEVEL) return 'text-amber-600';
  if (level >= MASTERY.UNLOCK_LEVEL) return 'text-indigo-500';
  return 'text-sky-500';
}

// Matches the pip style on SkillSelectScreen so parents see the same visual language.
function MasteryPips({ level }) {
  return (
    <span
      className="flex gap-1 items-center"
      aria-label={`Level ${level} of ${MASTERY.MAX_LEVEL}`}
    >
      {Array.from({ length: MASTERY.MAX_LEVEL }).map((_, i) => {
        const filled = i < level;
        const colour = filled
          ? level >= MASTERY.MASTERED_LEVEL
            ? 'bg-amber-400'
            : level >= MASTERY.UNLOCK_LEVEL
            ? 'bg-indigo-400'
            : 'bg-sky-400'
          : 'bg-slate-200';
        return <span key={i} className={`w-2 h-2 rounded-full ${colour}`} />;
      })}
    </span>
  );
}

function SkillRow({ skill }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {skill.icon && (
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            {skill.icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{skill.displayName}</p>
          {skill.subtitle && (
            <p className="text-xs text-slate-400">{skill.subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
        <MasteryPips level={skill.level} />
        {skill.level > 0 && (
          <span className={`text-xs font-medium ${levelLabelColour(skill.level)}`}>
            {levelLabel(skill.level)}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 pt-4 pb-0.5">
      {children}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ParentDashboard — encouraging progress snapshot for parents, behind the parent gate.
 * Reads local mastery data (no account, no cloud). Logic lives in progressSummary.js;
 * this component only renders.
 *
 * Tone: positive, never judgmental. No grades, percentages, rankings, or guilt.
 *
 * @param {() => void}  onSetPasscode  - triggers the parent gate in "set passcode" mode
 * @param {boolean}     hasPasscode    - whether a passcode is already set
 * @param {string|null} userEmail      - logged-in email, or null
 */
export default function ParentDashboard({ onSetPasscode, hasPasscode, userEmail }) {
  // Single storage read on mount; remounts when navigating back from child view.
  const [summary] = useState(() => {
    const skillStates = loadAllSkillStates();
    const today = new Date().toISOString().slice(0, 10);
    return progressSummary(skillStates, today);
  });

  const { mastered, inProgress, notStarted, masteredCount, lastActivity } = summary;
  const totalReady = mastered.length + inProgress.length + notStarted.length;

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-b from-sky-50 to-white overflow-y-auto">

      {/* ── Warm header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-6 pb-4 px-4 text-center">
        <Mascot emotion="happy" size={80} />
        <h1 className="text-xl font-bold text-indigo-900 mt-3">Your child's progress</h1>
        <p className="text-sm text-slate-400 mt-0.5">Tinku Math</p>
      </div>

      <div className="px-4 pb-8 space-y-4">

        {/* ── Wins highlight ──────────────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          {masteredCount > 0 ? (
            <>
              <p className="font-bold text-amber-800">
                {masteredCount === 1
                  ? '1 skill mastered! 🎉'
                  : `${masteredCount} skills mastered! 🎉`}
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                {masteredCount === totalReady
                  ? 'All ready skills complete — wonderful work!'
                  : 'Keep it up — great progress so far!'}
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-amber-800">Just getting started ✨</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Every bit of practice helps — great things take a little time!
              </p>
            </>
          )}
        </div>

        {/* ── Currently working on ─────────────────────────────────────────── */}
        {inProgress.length > 0 && (
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-sky-500 uppercase tracking-wide mb-2">
              Currently working on
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {inProgress.map((s) => (
                <span key={s.skillId} className="text-sm text-sky-800 font-medium">
                  {s.icon} {s.displayName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Skills list ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {mastered.length > 0 && (
            <>
              <SectionLabel>Mastered</SectionLabel>
              <div className="px-4">
                {mastered.map((s) => <SkillRow key={s.skillId} skill={s} />)}
              </div>
            </>
          )}

          {inProgress.length > 0 && (
            <>
              <SectionLabel>In progress</SectionLabel>
              <div className="px-4">
                {inProgress.map((s) => <SkillRow key={s.skillId} skill={s} />)}
              </div>
            </>
          )}

          {notStarted.length > 0 && (
            <>
              <SectionLabel>Not started yet</SectionLabel>
              <div className="px-4 pb-2">
                {notStarted.map((s) => <SkillRow key={s.skillId} skill={s} />)}
              </div>
            </>
          )}
        </div>

        {/* ── Light activity signal ────────────────────────────────────────── */}
        <div className="text-center py-1">
          {lastActivity ? (
            <p className="text-xs text-slate-400">
              Last practised:{' '}
              <span className="text-slate-600 font-medium">{lastActivity}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              No practice sessions yet — pick a skill to get started!
            </p>
          )}
        </div>

        {/* ── Settings footer ──────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <button
            onClick={onSetPasscode}
            className="w-full bg-white border-2 border-indigo-100 text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={18} />
            {hasPasscode ? 'Change Passcode' : 'Set Parent Passcode'}
          </button>

          {userEmail && (
            <p className="text-xs text-slate-400 text-center">
              Logged in as {userEmail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
