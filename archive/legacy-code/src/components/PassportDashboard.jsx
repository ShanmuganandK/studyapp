import React, { useState, useEffect } from 'react';
import { Book, Award, Lock, ChevronRight } from 'lucide-react';
import StampEngine from '../utils/StampEngine';

// Mock data mapping out the Global Math Explorer Passport topics
const mockPassportData = [
  { id: 'mult_basics', title: 'Multiplication Basics', description: 'Master the 2x, 5x, and 10x tables.', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'div_intro', title: 'Intro to Division', description: 'Sharing is caring! Learn to divide.', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'frac_intro', title: 'Fractions', description: 'Parts of a whole.', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'geom_3d', title: '3D Shapes', description: 'Cubes, spheres, and more.', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
];

export default function PassportDashboard({ userGrade, onSelectTopic }) {
  const [unlockedStamps, setUnlockedStamps] = useState([]);

  useEffect(() => {
    // Read from the offline-first StampEngine
    const stamps = StampEngine.getPocketedStamps(userGrade);
    setUnlockedStamps(stamps);
  }, [userGrade]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-4xl w-full bg-[#f4ecd8] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        {/* Passport Spine */}
        <div className="w-8 md:w-16 bg-[#2c3e50] shadow-inner z-10 flex-shrink-0" style={{ borderRight: '2px solid rgba(0,0,0,0.2)' }}></div>
        
        {/* Left Page (Profile info) */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-dashed border-amber-900/20 relative">
          <div className="absolute top-4 right-4 text-amber-900/10">
            <Book size={80} />
          </div>
          
          <div className="flex justify-between items-start mb-8 relative z-20">
            <div>
              <h1 className="text-4xl font-serif font-bold text-amber-900 tracking-wider uppercase mb-1">Passport</h1>
              <p className="text-amber-700 font-semibold tracking-widest text-sm uppercase">Global Math Explorer</p>
            </div>
          </div>
          
          <div className="space-y-8 relative z-20">
            <div className="flex gap-6 items-center">
              <div className="w-28 h-36 border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center transform -rotate-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600 flex items-center justify-center">
                  <span className="text-5xl text-white font-bold">G{userGrade}</span>
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <div className="border-b border-amber-900/20 pb-2">
                  <p className="text-xs uppercase text-amber-900/60 font-bold mb-1">Explorer ID</p>
                  <p className="font-mono text-amber-900 font-bold text-lg">MATH-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                </div>
                <div className="border-b border-amber-900/20 pb-2">
                  <p className="text-xs uppercase text-amber-900/60 font-bold mb-1">Grade Level</p>
                  <p className="font-bold text-amber-900 text-lg">Grade {userGrade}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/60 p-5 rounded-2xl border border-amber-900/10 shadow-sm">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Award size={18} /> Progress
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 bg-amber-900/10 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-amber-600 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(unlockedStamps.length / mockPassportData.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-lg font-bold text-amber-900">{unlockedStamps.length} / {mockPassportData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Page (Stamps) */}
        <div className="flex-1 p-8 relative bg-[#f9f5eb]">
          <div className="absolute top-4 left-4 text-amber-900/5">
            <Award size={140} />
          </div>
          
          <h2 className="text-2xl font-serif font-bold text-amber-900 mb-8 uppercase tracking-wider flex items-center gap-2 relative z-20">
            Visas & Stamps
          </h2>
          
          <div className="grid grid-cols-2 gap-6 relative z-20">
            {mockPassportData.map((topic) => {
              const isUnlocked = unlockedStamps.includes(topic.id);
              
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(topic.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 group min-h-[160px] ${
                    isUnlocked 
                      ? `${topic.bg} ${topic.border} hover:shadow-xl transform hover:-translate-y-2` 
                      : 'bg-white/40 border-dashed border-amber-900/20 hover:bg-white/80'
                  }`}
                >
                  {isUnlocked ? (
                    <div className={`transform -rotate-[15deg] group-hover:rotate-0 transition-transform duration-300 ${topic.color}`}>
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" strokeDasharray="8 4" />
                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" />
                        <path d="M30 50L45 65L75 35" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : (
                    <div className="text-amber-900/30 flex flex-col items-center transition-all group-hover:text-amber-900/50">
                      <Lock size={36} className="mb-2" />
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-900/20"></div>
                    </div>
                  )}
                  
                  <div className="mt-2 w-full px-2">
                    <p className={`text-sm font-bold leading-tight ${isUnlocked ? 'text-slate-800' : 'text-amber-900/60'}`}>
                      {topic.title}
                    </p>
                  </div>

                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-indigo-900/90 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white font-bold text-lg flex items-center gap-2">Play <ChevronRight size={20}/></span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
