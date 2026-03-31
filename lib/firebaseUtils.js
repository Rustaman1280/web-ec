import { database } from "./firebase";
import { ref, set, get, onValue, update, remove, child } from "firebase/database";

// Create a new room 
export const createQuizSession = async (quizId, questions) => {
  if(!database) return null;
  const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit pin
  const sessionRef = ref(database, `sessions/${pin}`);
  await set(sessionRef, {
    quizId,
    status: 'waiting', // waiting, active, leaderboard, finished
    currentQuestionIndex: 0,
    questions: questions,
    createdAt: Date.now(),
    participants: {}
  });
  return pin;
};

// Join a room as member
export const joinSession = async (pin, playerProfile) => {
  if(!database) return false;
  const sessionRef = ref(database, `sessions/${pin}`);
  const snapshot = await get(sessionRef);
  if (snapshot.exists() && snapshot.val().status === 'waiting') {
    const playerRef = ref(database, `sessions/${pin}/participants/${playerProfile.id}`);
    await set(playerRef, {
      name: playerProfile.name,
      score: 0,
      hasAnswered: false,
      lastAnswerTime: 0
    });
    return true;
  }
  return false;
};

// Listen to session changes
export const subscribeToSession = (pin, callback) => {
  if(!database) return () => {};
  const sessionRef = ref(database, `sessions/${pin}`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null); // Session deleted / not found
    }
  });
  return unsubscribe;
};

// Admin updates session state
export const updateSessionState = async (pin, updates) => {
  if(!database) return;
  const sessionRef = ref(database, `sessions/${pin}`);
  await update(sessionRef, updates);
};

// Member submits an answer
export const submitAnswer = async (pin, playerId, answerIndex, timeTakenMs, isCorrect) => {
  if(!database) return;
  
  // Scoring formula: faster answer = more points, e.g. base 1000 + bonus.
  const basePoints = isCorrect ? 500 : 0;
  const timeBonus = isCorrect ? Math.max(0, 500 - Math.floor(timeTakenMs / 10)) : 0;
  const pointsEarned = basePoints + timeBonus;

  // Transaction-like update would be better, but we do simple update here
  // First get current score
  const playerRef = ref(database, `sessions/${pin}/participants/${playerId}`);
  const snapshot = await get(playerRef);
  if (snapshot.exists()) {
    const currentScore = snapshot.val().score || 0;
    await update(playerRef, {
      score: currentScore + pointsEarned,
      hasAnswered: true,
      lastAnswerTime: Date.now()
    });
  }
};
