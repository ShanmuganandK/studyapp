import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ThemeManager from './components/ThemeManager';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-900">
          <h2>Something went wrong.</h2>
          <pre className="text-sm mt-2">{this.state.error?.toString()}</pre>
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
