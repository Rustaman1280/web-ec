import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { database } from "./firebase"; // Primary database connection
import { ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize secondary app safely to prevent active sessions from logging out
const SECONDARY_APP_NAME = "AdminRegistrationApp";

function getSecondaryApp() {
  const apps = getApps();
  const existingApp = apps.find(app => app.name === SECONDARY_APP_NAME);
  if (existingApp) return existingApp;
  return initializeApp(firebaseConfig, SECONDARY_APP_NAME);
}

export const registerStudentWithoutLogin = async (name, email, password, nickname = '') => {
  const secondaryApp = getSecondaryApp();
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    // 1. Create user in secondary auth (keeps primary Auth untouched)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;
    
    // 2. Create profile in Primary Realtime DB (uses Primary Database privileges)
    const userRef = ref(database, `users/${user.uid}`);
    await set(userRef, {
      fullName: name,
      nickname: nickname || name, // Default to full name if blank
      email,
      role: 'student',
      exp: 0,
      points: 0,
      photoUrl: '',
      quizzesPlayed: 0,
      createdAt: Date.now()
    });
    
    // 3. Immediately sign out the secondary auth so it remains detached
    await signOut(secondaryAuth);
    
    return user.uid;
  } catch (error) {
    throw error;
  }
};
