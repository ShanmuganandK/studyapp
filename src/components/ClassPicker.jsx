import { GRADES } from '../services/testSettings';

/**
 * ClassPicker — the parent-zone control for which class (grade) Tinku practises with.
 *
 * It used to sit inside "Test settings" ("for testing on this device"). Since suggestions became grade-scoped
 * (DECISIONS 2026-10-20) it is a REAL setting that decides what a child is offered, so it lives in its own section,
 * apart from the test instruments (theme, warm-up steps). Same stored value as before (`testSettings.grade`).
 * Purely presentational; persistence lives in useTestSettings.
 *
 * "Class" matches the first-run picker's wording. Class 3 is shown disabled, not silently absent
 * (DECISIONS 2026-09-23): no curriculum exists for it yet.
 *
 * @param {number} grade - active class (1-2 today)
 * @param {(n:number)=>void} onGradeChange
 */
export default function ClassPicker({ grade, onGradeChange }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-ink">Class</p>
        <p className="text-xs text-muted">
          Tinku suggests skills for this class. Each class keeps its own progress.
        </p>
      </div>
      <div className="flex gap-2">
        {GRADES.map((g) => {
          const selected = grade === g;
          return (
            <button
              key={g}
              onClick={() => onGradeChange(g)}
              aria-pressed={selected}
              className={`flex-1 rounded-button border py-2 text-sm font-semibold active:scale-95 transition-transform ${
                selected
                  ? 'border-primary ring-2 ring-primary text-primary-ink'
                  : 'border-primary-soft text-muted'
              }`}
            >
              Class {g}
            </button>
          );
        })}
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex-1 rounded-button border border-primary-soft py-2 text-sm font-semibold text-muted opacity-50 cursor-not-allowed"
        >
          Class 3 — soon
        </button>
      </div>
    </div>
  );
}
