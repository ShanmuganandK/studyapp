import { firebaseAdapter } from './firebaseAdapter';

// We can easily swap 'firebaseAdapter' with 'supabaseAdapter' or 'localAdapter' in the future.
const adapter = firebaseAdapter;

export const authService = {
    login: () => adapter.loginWithGoogle(),
    logout: () => adapter.logout(),
    onAuthStateChanged: (cb) => adapter.onAuthStateChanged(cb),
    getUser: () => adapter.getCurrentUser()
};
