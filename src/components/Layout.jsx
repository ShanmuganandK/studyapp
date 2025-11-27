import React from 'react';
import { Home, BookOpen, Trophy } from 'lucide-react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4 font-sans">
            {/* Mobile Frame */}
            <div className="w-full max-w-md h-[85vh] max-h-[800px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative border-8 border-indigo-950 ring-4 ring-indigo-900/50">

                {/* Notch / Status Bar Mockup */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-indigo-950 rounded-b-xl z-50"></div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pt-10 pb-4 px-4 bg-slate-50 scrollbar-hide">
                    {children}
                </div>

                {/* Bottom Navigation */}
                <div className="h-20 bg-white border-t border-gray-100 flex items-center justify-around px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button className="flex flex-col items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors">
                        <Home size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors">
                        <BookOpen size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Learn</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors">
                        <Trophy size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Quiz</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Layout;
