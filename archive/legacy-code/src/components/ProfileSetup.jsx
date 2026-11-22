import React from 'react';

/**
 * ProfileSetup — FROZEN legacy. The original dark, child-facing "what grade are you in?"
 * grade-wall (offered Grades 1–4, including out-of-scope Grade 4).
 *
 * Retired from the reachable flow when the app was collapsed to one path
 * (entry → skill-selection → quiz). Kept, not deleted: parent-set grade/profile selection will
 * return later as a proper light-themed, parent-gated flow (DECISIONS: grade is a parent
 * property, no child grade-wall). Not edited — replaced when that flow lands.
 */
const ProfileSetup = ({ onComplete }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Explorer!</h1>
        <p className="text-slate-400 mb-8">What grade are you in?</p>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((grade) => (
            <button
              key={grade}
              onClick={() => onComplete(grade)}
              className="py-6 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-50 text-white font-bold text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
            >
              Grade {grade}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
