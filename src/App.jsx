import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ThemeManager from './components/ThemeManager';
import logger from './utils/logger';

// Child-safe error boundary: never shows a raw stack trace to a child.
// Must be a class component (React requirement for componentDidCatch).
// Uses an emoji stand-in for Tinku (can't use the Mascot hook-component here).
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log detail for developers only — never exposed to the child (STANDARDS §8).
    logger.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-6 text-center gap-4">
          <span className="text-6xl" aria-hidden="true">🐘</span>
          <p className="font-display text-primary-ink text-xl font-extrabold">
            Tinku needs a moment!
          </p>
          <p className="text-muted text-sm max-w-xs">
            Something went a little sideways. Please refresh to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white rounded-button shadow-button font-semibold px-8 py-3 active:scale-95 transition-transform"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeManager />
      </AuthProvider>
    </ErrorBoundary>
  );
}
