import { firebaseAdapter } from './firebaseAdapter';
import { localAdapter } from './localAdapter';

// Detect if Firebase is configured
const isFirebaseConfigured = 
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_API_KEY !== 'undefined' && 
  import.meta.env.VITE_FIREBASE_API_KEY.trim() !== '';

const adapter = isFirebaseConfigured ? firebaseAdapter : localAdapter;

export const authService = {
    login: () => adapter.loginWithGoogle(),
    logout: () => adapter.logout(),
    onAuthStateChanged: (cb) => adapter.onAuthStateChanged(cb),
    getUser: () => adapter.getCurrentUser()
};
