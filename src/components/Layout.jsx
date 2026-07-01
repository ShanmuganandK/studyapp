import React from 'react';
import { Home, Lock } from 'lucide-react';

const Layout = ({ children, currentView, onNavigate }) => {
    const isActive = (view) => currentView === view ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600';

    return (
        <div className="app-shell bg-indigo-900 flex items-center justify-center sm:p-4 font-sans">
            {/* Full-bleed on phones (max usable height, tracks visible viewport via dvh); the
                decorative phone-mockup frame — rounded corners, border, 85% height — is desktop-only. */}
            <div className="app-frame w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col relative sm:rounded-[2.5rem] sm:border-8 sm:border-indigo-950 sm:ring-4 sm:ring-indigo-900/50">

                {/* Notch / Status Bar Mockup — part of the desktop frame only. */}
                <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-indigo-950 rounded-b-xl z-50"></div>

                {/* Content Area. Less top padding on phones (no mockup notch to clear). */}
                <div className="flex-1 overflow-y-auto pt-3 sm:pt-10 pb-4 px-4 bg-slate-50 scrollbar-hide">
                    {children}
                </div>

                {/* Bottom Navigation */}
                <div className="h-20 bg-white border-t border-gray-100 flex items-center justify-around px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => onNavigate('skills')}
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive('skills')}`}
                    >
                        <Home size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                    </button>
                    <button
                        onClick={() => onNavigate('parent')}
                        className={`flex flex-col items-center gap-1 transition-colors ${isActive('parent')}`}
                    >
                        <Lock size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Parent</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Layout;
