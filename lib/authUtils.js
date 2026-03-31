import { auth, database } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, set, get } from "firebase/database";

// Register a new student
export const registerStudent = async (name, email, password) => {
  if(!auth || !database) throw new Error("Firebase not initialized");
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create profile in Realtime DB
  const userRef = ref(database, `users/${user.uid}`);
  await set(userRef, {
    fullName: name,
    nickname: name, // Default nickname is full name
    email,
    role: 'student',
    exp: 0,
    points: 0,
    photoUrl: '',
    quizzesPlayed: 0,
    createdAt: Date.now()
  });
  
  return user;
};

// Login standard user
export const loginUser = async (email, password) => {
  if(!auth) throw new Error("Firebase not initialized");
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Logout
export const logoutUser = async () => {
  if(!auth) return;
  await signOut(auth);
};

// Get Single User Profile
export const getUserProfile = async (uid) => {
  if(!database) return null;
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  if(snapshot.exists()) {
    return { uid, ...snapshot.val() };
  }
  return null;
};

// Listen to Auth State
export const subscribeToAuthStatus = (callback) => {
  if(!auth) return () => {};
  return onAuthStateChanged(auth, async (user) => {
    if(user) {
       const profile = await getUserProfile(user.uid);
       callback({ user, profile });
    } else {
       callback(null);
    }
  });
};
