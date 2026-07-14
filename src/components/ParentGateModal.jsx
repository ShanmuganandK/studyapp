import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Delete, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Mascot from './Mascot';
import { makeAdultChallenge } from './parentChallenge';
import logger from '../utils/logger';

// PIN length — single source of truth. All digit-count logic reads this.
const PIN_DIGITS = 4;

/**
 * ParentGateModal — the Families-Policy DETERRENT gate for the parent zone (not a security
 * boundary; see DECISIONS 2026-07-14). Rendered via a portal to document.body so the fixed
 * overlay pins to the true viewport regardless of scroll position or any ancestor transform.
 *
 * Modes (internal): 'verify' (enter PIN), 'set' (set/confirm a new PIN), 'challenge' (forgot-
 * passcode adult arithmetic). `isSettingMode` seeds the initial mode when the gate opens.
 */
const ParentGateModal = ({ isOpen, onClose, onSuccess, isSettingMode = false }) => {
    const { parentSettings, updatePasscode, verifyPasscode, clearPasscode } = useAuth();
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState(false);
    const [step, setStep] = useState(1); // 1: Enter, 2: Confirm (set mode only)
    const [firstCode, setFirstCode] = useState('');
    const [mode, setMode] = useState(isSettingMode ? 'set' : 'verify');
    const [challenge, setChallenge] = useState(null);
    const [challengeInput, setChallengeInput] = useState('');

    // On each open, reset to a clean slate seeded by the requested mode.
    useEffect(() => {
        if (isOpen) {
            setInputCode('');
            setError(false);
            setStep(1);
            setFirstCode('');
            setMode(isSettingMode ? 'set' : 'verify');
            setChallenge(null);
            setChallengeInput('');
        }
    }, [isOpen, isSettingMode]);

    // No passcode set + verify mode → let them through immediately (the deterrent's no-code state).
    // Guarded by !isSettingMode (the authoritative prop) so a not-yet-synced `mode` can never make
    // an open-in-set flow auto-succeed and close before the set screen shows.
    useEffect(() => {
        if (isOpen && !isSettingMode && mode === 'verify' && !parentSettings?.passcodeHash) {
            onSuccess();
        }
    }, [isOpen, isSettingMode, mode, parentSettings, onSuccess]);

    const handleNumberClick = (num) => {
        if (inputCode.length < PIN_DIGITS) {
            const newCode = inputCode + num;
            setInputCode(newCode);
            setError(false);
            if (newCode.length === PIN_DIGITS) {
                // handleSubmit is async but handles all errors internally; safe as fire-and-forget.
                setTimeout(() => handleSubmit(newCode), 300);
            }
        }
    };

    const handleDelete = () => {
        setInputCode(inputCode.slice(0, -1));
        setError(false);
    };

    const handleSubmit = async (code) => {
        try {
            if (mode === 'set') {
                if (step === 1) {
                    setFirstCode(code);
                    setInputCode('');
                    setStep(2);
                } else {
                    if (code === firstCode) {
                        await updatePasscode(code);
                        onSuccess();
                    } else {
                        setError(true);
                        setInputCode('');
                    }
                }
            } else {
                if (await verifyPasscode(code)) {
                    onSuccess();
                } else {
                    setError(true);
                    setInputCode('');
                }
            }
        } catch (err) {
            logger.warn('[ParentGateModal] auth error', err);
            setError(true);
            setInputCode('');
        }
    };

    // Enter the forgot-passcode recovery: generate a fresh challenge and switch views.
    const enterChallenge = () => {
        setChallenge(makeAdultChallenge());
        setChallengeInput('');
        setError(false);
        setMode('challenge');
    };

    // Correct answer → clear the stored code (never touches child progress) and drop straight into
    // set-new-passcode. Wrong → gentle shake + clear, same problem stays (deterrent, no lockout).
    const handleChallengeSubmit = () => {
        if (challenge && Number(challengeInput) === challenge.answer) {
            clearPasscode();
            setError(false);
            setInputCode('');
            setFirstCode('');
            setStep(1);
            setMode('set');
        } else {
            setError(true);
            setChallengeInput('');
        }
    };

    if (!isOpen) return null;
    if (!isSettingMode && mode === 'verify' && !parentSettings?.passcodeHash) return null;
    if (typeof document === 'undefined') return null;

    const heading = mode === 'challenge'
        ? 'Parent Check'
        : mode === 'set'
            ? (step === 1 ? 'Set a Passcode' : 'Confirm Passcode')
            : 'For Parents Only';

    const subtitle = mode === 'challenge'
        ? 'Solve this to reset the passcode'
        : mode === 'set'
            ? (step === 1 ? 'Enter a 4-digit PIN' : 'Re-enter your PIN to confirm')
            : 'Enter your 4-digit PIN to continue';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-bg-card rounded-card shadow-card w-full max-w-sm max-h-[92dvh] overflow-y-auto ${error ? 'animate-shake' : ''}`}>

                {/* Top: close + Tinku + heading + subtitle */}
                <div className="relative pt-7 pb-2 px-6 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                    {mode !== 'challenge' && (
                        <div className="flex justify-center mb-3">
                            <Mascot emotion="happy" size={72} />
                        </div>
                    )}
                    <h2 className="font-display text-primary-ink text-xl font-extrabold">
                        {heading}
                    </h2>
                    <p className="text-muted text-sm mt-1">
                        {subtitle}
                    </p>
                </div>

                {mode === 'challenge' ? (
                    // ── Forgot-passcode: adult arithmetic challenge (parent-facing register) ──
                    <div className="px-6 pb-6 pt-4">
                        <p className="text-center font-display text-4xl font-extrabold text-ink tabular-nums">
                            {challenge?.prompt}
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoFocus
                            value={challengeInput}
                            onChange={(e) => { setChallengeInput(e.target.value.replace(/\D/g, '')); setError(false); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleChallengeSubmit(); }}
                            aria-label="Answer"
                            className="mt-5 w-full text-center text-2xl font-semibold text-ink bg-bg border border-primary-soft rounded-button py-3 focus:outline-none focus:border-primary"
                        />
                        {error && (
                            <p className="text-center text-encourage font-medium mt-3 text-sm">
                                Not quite — try again.
                            </p>
                        )}
                        <button
                            onClick={handleChallengeSubmit}
                            disabled={challengeInput === ''}
                            className="mt-5 w-full bg-primary text-white rounded-button shadow-button font-semibold py-3 active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
                        >
                            Check
                        </button>
                        <button
                            onClick={() => { setMode('verify'); setError(false); }}
                            className="mt-2 w-full py-2 text-sm text-muted hover:text-ink transition-colors"
                        >
                            Back
                        </button>
                    </div>
                ) : (
                    <>
                        {/* PIN dots */}
                        <div className="py-6 flex justify-center gap-4">
                            {Array.from({ length: PIN_DIGITS }, (_, i) => i).map((i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-colors ${
                                        i < inputCode.length
                                            ? error ? 'bg-encourage' : 'bg-primary'
                                            : 'bg-primary-soft'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Keypad */}
                        <div className="px-6 pb-4">
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumberClick(num)}
                                        className="h-14 rounded-button bg-bg border border-primary-soft text-ink text-xl font-semibold active:scale-95 active:bg-primary-soft transition-all"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div />
                                <button
                                    onClick={() => handleNumberClick(0)}
                                    className="h-14 rounded-button bg-bg border border-primary-soft text-ink text-xl font-semibold active:scale-95 active:bg-primary-soft transition-all"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="h-14 rounded-button text-muted hover:text-encourage flex items-center justify-center active:scale-95 transition-all"
                                    aria-label="Delete"
                                >
                                    <Delete size={24} />
                                </button>
                            </div>

                            {error && (
                                <p className="text-center text-encourage font-medium mt-4 text-sm">
                                    {mode === 'set' ? "PINs don't match — try again." : 'Incorrect PIN. Try again.'}
                                </p>
                            )}

                            {/* Forgot passcode — verify mode only. Adult-skill recovery, not a bypass. */}
                            {mode === 'verify' && (
                                <button
                                    onClick={enterChallenge}
                                    className="mt-4 w-full py-1 text-xs text-muted hover:text-ink transition-colors"
                                >
                                    Forgot passcode?
                                </button>
                            )}
                        </div>
                    </>
                )}

                <p className="text-muted text-xs text-center pb-5">Tinku Math Parent Gate</p>
            </div>
        </div>,
        document.body
    );
};

export default ParentGateModal;
