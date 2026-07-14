import React from 'react';
import { Home, Lock } from 'lucide-react';
import useOnline from '../hooks/useOnline';
import tinkuImg from '../assets/mascot/webp/Tinku_Mascot.webp';

/**
 * Layout — the app shell: outer phone-mockup frame (desktop-only), scrollable content area,
 * and bottom nav. Purely presentational.
 *
 * Screen transitions: the content wrapper is keyed by `currentView` so React remounts it
 * with `.animate-view-enter` (gentle 200ms rise-and-fade, GPU-safe) on every view change.
 *
 * Desktop chrome note: the outermost `app-shell` and the `sm:` phone-mockup border/ring
 * use `bg-primary-ink` and a couple of residual dark Tailwind classes. These are desktop-only
 * decoration (never seen on a phone) and don't participate in band theming, so they're
 * not tokenised further — the token rule targets product UI, not the dev preview frame.
 */
const Layout = ({ children, currentView, onNavigate, scrollLocked = false }) => {
  const isOnline = useOnline();

  return (
    <div className="app-shell bg-primary-ink flex items-center justify-center sm:p-4 font-sans">
      {/* Full-bleed on phones; decorative phone-mockup frame on desktop only. */}
      <div className="app-frame w-full max-w-md bg-bg-card shadow-2xl overflow-hidden flex flex-col relative sm:rounded-[2.5rem] sm:border-8 sm:border-indigo-950 sm:ring-4 sm:ring-indigo-900/50">

        {/* Notch / Status Bar Mockup — desktop frame only. */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-indigo-950 rounded-b-xl z-50" />

        {/* Offline banner — appears when the device loses connectivity. Auto-hides on
            reconnect. Non-blocking: child can keep playing (local state intact). */}
        {!isOnline && (
          <div className="bg-learn-soft text-learn-ink text-xs py-2 px-4 flex-shrink-0 flex items-center justify-center gap-2" role="status">
            <img src={tinkuImg} alt="" aria-hidden="true" className="w-7 h-7 object-contain flex-shrink-0" />
            <span>You're offline — Tinku can still play! Progress saves when you reconnect.</span>
          </div>
        )}

        {/* Content area. Keyed by currentView so the scroll container itself remounts on
            each nav change — scrollTop resets to 0 and the view-enter animation fires on the
            fresh inner div. Key on the outer (scroll) div, not the inner, so the scroll
            position can never bleed across views. */}
        {/* scrollLocked (gate open) freezes this scroller so the background can't scroll behind
            the portalled modal — the real scroll container is here, not the body. */}
        <div key={currentView} className={`flex-1 ${scrollLocked ? 'overflow-hidden' : 'overflow-y-auto'} pt-3 sm:pt-10 pb-4 px-4 bg-bg scrollbar-hide`}>
          <div className="h-full animate-view-enter">
            {children}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 h-20 bg-bg-card border-t border-primary-soft flex items-center justify-around px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.04)]">
          <NavItem
            icon={<Home size={22} strokeWidth={2.5} />}
            label="Home"
            active={currentView === 'skills'}
            onClick={() => onNavigate('skills')}
          />
          <NavItem
            icon={<Lock size={22} strokeWidth={2.5} />}
            label="Parent"
            active={currentView === 'parent'}
            onClick={() => onNavigate('parent')}
          />
        </div>
      </div>
    </div>
  );
};

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-full transition-colors ${
        active
          ? 'bg-primary-soft text-primary'
          : 'text-muted hover:text-primary'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

export default Layout;
