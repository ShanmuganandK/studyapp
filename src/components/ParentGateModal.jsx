import React, { useState, useEffect } from 'react';
import { Lock, Delete, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ParentGateModal = ({ isOpen, onClose, onSuccess, isSettingMode = false }) => {
    const { parentSettings, updatePasscode, verifyPasscode } = useAuth();
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState(false);
    const [step, setStep] = useState(1); // 1: Enter, 2: Confirm (only for setting mode)
    const [firstCode, setFirstCode] = useState(''); // To store first entry in setting mode

    useEffect(() => {
        if (isOpen) {
            setInputCode('');
            setError(false);
            setStep(1);
            setFirstCode('');
        }
    }, [isOpen]);

    // If no passcode is set and we are not in setting mode, allow access immediately
    // or show a simple math challenge (optional, effectively "open" for now)
    useEffect(() => {
        if (isOpen && !isSettingMode && !parentSettings?.passcode) {
            // No passcode set, just let them in
            onSuccess();
        }
    }, [isOpen, isSettingMode, parentSettings, onSuccess]);

    const handleNumberClick = (num) => {
        if (inputCode.length < 4) {
            const newCode = inputCode + num;
            setInputCode(newCode);
            setError(false);

            // Auto-submit on 4th digit
            if (newCode.length === 4) {
                setTimeout(() => handleSubmit(newCode), 300);
            }
        }
    };

    const handleDelete = () => {
        setInputCode(inputCode.slice(0, -1));
        setError(false);
    };

    const handleSubmit = (code) => {
        if (isSettingMode) {
            if (step === 1) {
                setFirstCode(code);
                setInputCode('');
                setStep(2);
            } else {
                if (code === firstCode) {
                    updatePasscode(code);
                    onSuccess();
                } else {
                    setError(true);
                    setInputCode('');
                    // Shake effect or message "Codes do not match"
                }
            }
        } else {
            // Verify Mode
            if (verifyPasscode(code)) {
                onSuccess();
            } else {
                setError(true);
                setInputCode('');
            }
        }
    };

    if (!isOpen) return null;

    // If verification mode and no passcode, we prevent rendering (effect handles it), 
    // but return null to avoid flash
    if (!isSettingMode && !parentSettings?.passcode) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden ${error ? 'animate-shake' : ''}`}>

                {/* Header */}
                <div className="bg-indigo-900 p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-indigo-200 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    <div className="w-16 h-16 bg-indigo-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock size={32} className="text-indigo-300" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        {isSettingMode
                            ? (step === 1 ? "Set New Passcode" : "Confirm Passcode")
                            : "Parent Access"}
                    </h2>
                    <p className="text-indigo-200 text-sm mt-1">
                        {isSettingMode
                            ? (step === 1 ? "Enter a 4-digit PIN" : "Re-enter to confirm")
                            : "Enter your 4-digit PIN"}
                    </p>
                </div>

                {/* Display dots */}
                <div className="py-8 flex justify-center gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all ${i < inputCode.length
                                    ? (error ? 'bg-red-500 border-red-500' : 'bg-indigo-600 border-indigo-600')
                                    : 'border-gray-300'
                                }`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="px-6 pb-8">
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num)}
                                className="h-16 rounded-full bg-gray-50 hover:bg-indigo-50 text-2xl font-bold text-indigo-900 shadow-sm border border-gray-100 active:scale-95 transition-transform"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="col-start-2">
                            <button
                                onClick={() => handleNumberClick(0)}
                                className="w-full h-16 rounded-full bg-gray-50 hover:bg-indigo-50 text-2xl font-bold text-indigo-900 shadow-sm border border-gray-100 active:scale-95 transition-transform"
                            >
                                0
                            </button>
                        </div>
                        <div className="col-start-3">
                            <button
                                onClick={handleDelete}
                                className="w-full h-16 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Delete size={28} />
                            </button>
                        </div>
                    </div>
                    {error && (
                        <p className="text-center text-red-500 font-medium mt-4 animate-bounce">
                            Incorrect PIN. Try again.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentGateModal;
