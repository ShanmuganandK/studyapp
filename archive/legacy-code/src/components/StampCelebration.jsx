import React, { useEffect, useState } from 'react';

export default function StampCelebration({ isVisible, onClose, topicName }) {
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setRender(true);
      const timer = setTimeout(() => {
        onClose();
        setRender(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in pointer-events-auto backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Confetti simulation (offline-first, no external dependencies) */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-4 h-4 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100 - 50}%`,
                top: `${Math.random() * 100 - 50}%`,
                backgroundColor: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.4}s`,
                animationDuration: `${1 + Math.random() * 1.5}s`
              }}
            ></div>
          ))}
        </div>

        {/* The Stamp */}
        <div className="animate-stamp-slam transform scale-[3] opacity-0 text-rose-500 relative">
          <svg width="240" height="240" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" strokeDasharray="15 5" />
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" />
            <path d="M50 25L57.8 40.8L75 43.3L62.5 55.5L65.4 72.7L50 64.5L34.6 72.7L37.5 55.5L25 43.3L42.2 40.8L50 25Z" fill="currentColor" />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center transform rotate-[-15deg] mt-12">
            <div className="bg-white px-3 py-1 border-4 border-rose-500 rounded text-rose-500 font-black text-2xl uppercase tracking-widest shadow-lg">
              Mastered!
            </div>
          </div>
        </div>
        
        <p className="text-white text-3xl font-bold mt-12 animate-fade-in-up drop-shadow-2xl text-center">
          {topicName || "Topic"} Unlocked!
        </p>
      </div>

      {/* Inline styles for custom animations to keep it self-contained */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes stamp-slam {
          0% { transform: scale(5) rotate(20deg); opacity: 0; }
          40% { transform: scale(1) rotate(-15deg); opacity: 1; }
          50% { transform: scale(1.1) rotate(-15deg); opacity: 1; }
          100% { transform: scale(1) rotate(-15deg); opacity: 1; }
        }
        .animate-stamp-slam {
          animation: stamp-slam 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out 0.4s forwards;
          opacity: 0;
        }
        @keyframes confetti {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) scale(0) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation-name: confetti;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
      `}} />
    </div>
  );
}
