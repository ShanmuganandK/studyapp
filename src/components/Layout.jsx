import { Home, Lock } from 'lucide-react';
import useOnline from '../hooks/useOnline';
import tinkuImg from '../assets/mascot/webp/Tinku_Mascot.webp';

/**
 * Layout — the app shell: outer phone-mockup frame (fine-pointer desktop only), scrollable
 * content area, and bottom nav. Purely presentational.
 *
 * Screen transitions: the content wrapper is keyed by `currentView` so React remounts it
 * with `.animate-view-enter` (gentle 200ms rise-and-fade, GPU-safe) on every view change.
 *
 * Tablet / desktop chrome (F4): phones stay full-bleed, touch tablets (`>= 640px` coarse
 * pointer) get a centred full-height phone-width canvas without a fake phone bezel or notch,
 * and fine-pointer desktop viewports get the decorative `.desktop-phone-*` preview frame.
 */
const Layout = ({ children, currentView, onNavigate, scrollLocked = false, hideNav = false }) => {
  const isOnline = useOnline();

  return (
    <div className="app-shell desktop-phone-shell bg-bg flex items-center justify-center font-sans">
      {/* Full-bleed on phones; centred full-height on tablets; phone-mockup frame on desktop pointer. */}
      <div className="app-frame desktop-phone-frame w-full max-w-md bg-bg-card shadow-2xl overflow-hidden flex flex-col relative">

        {/* Notch / Status Bar Mockup — fine-pointer desktop frame only (shown via CSS media query). */}
        <div className="desktop-phone-notch hidden absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-xl z-50" />

        {/* Offline banner — appears when the device loses connectivity. Auto-hides on
            reconnect. Non-blocking: child can keep playing (local state intact). */}
        {!isOnline && (
          <div className="bg-learn-soft text-learn-ink text-xs py-2 px-4 shrink-0 flex items-center justify-center gap-2" role="status">
            <img src={tinkuImg} alt="" aria-hidden="true" className="w-7 h-7 object-contain shrink-0" />
            <span>You're offline — Tinku can still play! Progress is saved on this device.</span>
          </div>
        )}

        {/* Content area. Keyed by currentView so the scroll container itself remounts on
            each nav change — scrollTop resets to 0 and the view-enter animation fires on the
            fresh inner div. Key on the outer (scroll) div, not the inner, so the scroll
            position can never bleed across views. */}
        {/* scrollLocked (gate open) freezes this scroller so the background can't scroll behind
            the portalled modal — the real scroll container is here, not the body. */}
        <div key={currentView} className={`desktop-phone-content flex-1 ${scrollLocked ? 'overflow-hidden' : 'overflow-y-auto'} pt-3 pb-4 px-4 bg-bg scrollbar-hide`}>
          <div className="h-full animate-view-enter">
            {children}
          </div>
        </div>

        {/* Bottom Navigation. Hidden during a quiz (DECISIONS 2026-10-18): the room goes to the question,
            and a mid-quiz tap on Parent/Home was an accident. The quiz keeps its own '← Skills' exit. */}
        {!hideNav && (
        <div className="shrink-0 h-20 bg-bg-card border-t border-primary-soft flex items-center justify-around px-4 shadow-nav">
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
        )}
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
