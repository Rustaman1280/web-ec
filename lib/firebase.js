import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase only if config is somewhat valid (prevents crash on load before env is set)
let app;
if (typeof window !== "undefined" && !getApps().length) {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
    } else {
        console.warn("Firebase config is missing or invalid. Please check your .env.local file.");
        // We supply dummy init to prevent crash, though features won't work
        app = initializeApp({ projectId: "dummy" });
    }
} else {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig.apiKey ? firebaseConfig : { projectId: "dummy" });
}

export const auth = typeof window !== "undefined" ? getAuth(app) : null;
export const database = typeof window !== "undefined" ? getDatabase(app) : null;
export const storage = typeof window !== "undefined" ? getStorage(app) : null;
