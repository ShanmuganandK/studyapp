/**
 * TestPanel — tester-only experiments (currently the warm-up steps). Not shown to public parents:
 * ParentDashboard renders it only in a tester build (`flags.testerTools`) or when the experiment
 * is already on for this device, so it can always be switched off (DECISIONS 2026-10-20).
 * Presentational; state lives in useTestSettings.js. Token styling only (lint:hex).
 *
 * @param {boolean}  bridgeEnabled       - strategy-rung bridge-in walk toggle (DECISIONS
 *                                         2026-09-22), default OFF. Only affects skills opted in
 *                                         via the skill map's `strategyRungs` property — today,
 *                                         `g2.add.2d-nocarry` alone.
 * @param {(b)=>void} onBridgeEnabledChange
 */
export default function TestPanel({ bridgeEnabled, onBridgeEnabledChange }) {
  return (
    <div className="border-t border-primary-soft pt-4 space-y-2">
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">
          Tester tools
        </p>
        <p className="text-xs text-muted">For people testing this build. Not part of the app.</p>
      </div>
      <p className="text-xs font-medium text-ink">Warm-up steps (experiment)</p>
      <div className="flex gap-2">
        {[false, true].map((value) => {
          const selected = bridgeEnabled === value;
          return (
            <button
              key={String(value)}
              onClick={() => onBridgeEnabledChange(value)}
              aria-pressed={selected}
              className={`flex-1 rounded-button border py-2 text-sm font-semibold active:scale-95 transition-transform ${
                selected
                  ? 'border-primary ring-2 ring-primary text-primary-ink'
                  : 'border-primary-soft text-muted'
              }`}
            >
              {value ? 'On' : 'Off'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
