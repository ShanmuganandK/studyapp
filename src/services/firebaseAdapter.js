import { auth, googleProvider } from '../lib/firebase';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

export const firebaseAdapter = {
    loginWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Firebase Login Error:", error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Firebase Logout Error:", error);
            throw error;
        }
    },

    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(auth, callback);
    },

    getCurrentUser: () => {
        return auth.currentUser;
    }
};
