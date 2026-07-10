import { useState, useEffect } from 'react';

/**
 * useOnline — returns true when the browser has network connectivity.
 * Listens to the window online/offline events so the value stays live.
 * Initial value from navigator.onLine (synchronous, no flicker).
 */
export default function useOnline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}
