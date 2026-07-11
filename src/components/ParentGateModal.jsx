import React, { useState, useEffect } from 'react';
import { Delete, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Mascot from './Mascot';
import logger from '../utils/logger';

// PIN length — single source of truth. All digit-count logic reads this.
const PIN_DIGITS = 4;

const ParentGateModal = ({ isOpen, onClose, onSuccess, isSettingMode = false }) => {
    const { parentSettings, updatePasscode, verifyPasscode } = useAuth();
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState(false);
    const [step, setStep] = useState(1); // 1: Enter, 2: Confirm (setting mode only)
    const [firstCode, setFirstCode] = useState('');

    useEffect(() => {
        if (isOpen) {
            setInputCode('');
            setError(false);
            setStep(1);
            setFirstCode('');
        }
    }, [isOpen]);

    // No passcode set + verify mode → let them through immediately
    useEffect(() => {
        if (isOpen && !isSettingMode && !parentSettings?.passcodeHash) {
            onSuccess();
        }
    }, [isOpen, isSettingMode, parentSettings, onSuccess]);

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
            if (isSettingMode) {
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

    if (!isOpen) return null;
    if (!isSettingMode && !parentSettings?.passcodeHash) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-bg-card rounded-card shadow-card w-full max-w-sm overflow-hidden ${error ? 'animate-shake' : ''}`}>

                {/* Top: close + Tinku + heading + subtitle */}
                <div className="relative pt-7 pb-2 px-6 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                    <div className="flex justify-center mb-3">
                        <Mascot emotion="happy" size={72} />
                    </div>
                    <h2 className="font-display text-primary-ink text-xl font-extrabold">
                        {isSettingMode
                            ? (step === 1 ? 'Set a Passcode' : 'Confirm Passcode')
                            : 'For Parents Only'}
                    </h2>
                    <p className="text-muted text-sm mt-1">
                        {isSettingMode
                            ? (step === 1 ? 'Enter a 4-digit PIN' : 'Re-enter your PIN to confirm')
                            : 'Enter your 4-digit PIN to continue'}
                    </p>
                </div>

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
                            {isSettingMode ? "PINs don't match — try again." : 'Incorrect PIN. Try again.'}
                        </p>
                    )}
                </div>

                <p className="text-muted text-xs text-center pb-5">Tinku Math Security Gate</p>
            </div>
        </div>
    );
};

export default ParentGateModal;
