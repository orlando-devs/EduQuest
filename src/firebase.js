import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// --- KONFIGURASI FIREBASE ---
// Note: In a production environment, use environment variables.
// These placeholders handle the global variables used in the original script.
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "PLACEHOLDER",
        authDomain: "PLACEHOLDER",
        projectId: "PLACEHOLDER",
        storageBucket: "PLACEHOLDER",
        messagingSenderId: "PLACEHOLDER",
        appId: "PLACEHOLDER"
    };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
export const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
