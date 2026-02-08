import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
    apiKey: "AIzaSyAUjve8Ubp8_ZOJZdx3_lWCAVLhjS5mvRw",
    authDomain: "cbsckids-shan.firebaseapp.com",
    projectId: "cbsckids-shan",
    storageBucket: "cbsckids-shan.firebasestorage.app",
    messagingSenderId: "742419716964",
    appId: "1:742419716964:web:9a4fcc3c645c93ec1bb871",
    measurementId: "G-Y1MV7EK0K1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
