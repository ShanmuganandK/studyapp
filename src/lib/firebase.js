import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration using Environment Variables
// This keeps your keys safe and out of version control


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-for-local-dev",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain-for-local-dev",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id-for-local-dev",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket-for-local-dev",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id-for-local-dev",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id-for-local-dev",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "mock-measurement-id-for-local-dev"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
