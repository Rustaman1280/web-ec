import { database, storage } from "./firebase";
import { ref, set, get, onValue, update, remove, child, push } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { recordTransaction } from "./economyUtils";

export const uploadImageFile = async (file, folderPath = 'uploads') => {
  if (!file) return null;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary config missing in environment variables.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `englishclub/${folderPath}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if(!res.ok) throw new Error("Image upload failed. Ensure unsigned upload is enabled for your Cloudinary preset.");
  const data = await res.json();
  return data.secure_url;
};

export const initFirebase = () => {
  return { database };
};

export const getCustomQuizThemes = async () => {
  if(!database) return [];
  const snap = await get(ref(database, 'custom_quiz_themes'));
  if (snap.exists()) {
    const data = snap.val();
    return Object.keys(data).map(k => data[k].url);
  }
  return [];
};

export const addCustomQuizTheme = async (url) => {
  if(!database) return;
  const tRef = push(ref(database, 'custom_quiz_themes'));
  await set(tRef, { url, createdAt: Date.now() });
};

export const createLiveQuizBank = async (title, description, color, icon, sessionPoints, sessionExp, questions, bgTheme = 'default', bgMusic = 'none') => {
  if(!database) return null;
  const qRef = push(ref(database, 'live_quizzes'));
  await set(qRef, { title, description, color, icon, sessionPoints: parseInt(sessionPoints)||0, sessionExp: parseInt(sessionExp)||0, questions, bgTheme, bgMusic, createdAt: Date.now() });
  return qRef.key;
};

export const getAllLiveQuizzes = async () => {
  if(!database) return [];
  const s = await get(ref(database, 'live_quizzes'));
  if (s.exists()) {
    const data = s.val();
    return Object.keys(data).map(k => ({ id: k, ...data[k] }));
  }
  return [];
};

export const deleteLiveQuizBank = async (id) => {
  if(!database) return;
  await set(ref(database, `live_quizzes/${id}`), null);
};

// Create a new room 
export const createQuizSession = async (quizId, sessionPoints, sessionExp, questions, bgTheme = 'default', bgMusic = 'none', title = 'Live Quiz') => {
  if(!database) return null;
  const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit pin
  const sessionRef = ref(database, `sessions/${pin}`);
  await set(sessionRef, {
    quizId,
    title,
    sessionPoints: parseInt(sessionPoints)||0,
    sessionExp: parseInt(sessionExp)||0,
    status: 'waiting', // waiting, active, leaderboard, finished
    currentQuestionIndex: 0,
    questions: questions,
    bgTheme: bgTheme || 'default',
    bgMusic: bgMusic || 'none',
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
  
  const sessionSnap = await get(ref(database, `sessions/${pin}`));
  if(!sessionSnap.exists()) return;
  const session = sessionSnap.val();
  const currentQ = session.questions[session.currentQuestionIndex];
  
  // Double Points multiplier
  const multiplier = currentQ.isDoublePoints ? 2 : 1;
  
  // Scoring formula for leaderboard sorting (based on speed)
  const basePoints = isCorrect ? 500 : 0;
  const timeBonus = isCorrect ? Math.max(0, 500 - Math.floor(timeTakenMs / 10)) : 0;
  const leaderboardScoreEarned = (basePoints + timeBonus) * multiplier;
  
  // Real Economy Payout per question
  const expEarned = isCorrect ? (parseInt(currentQ.rewardExp) || 0) * multiplier : 0;
  const coinsEarned = isCorrect ? (parseInt(currentQ.rewardPoints) || 0) * multiplier : 0;

  // Update session participant score
  const playerRef = ref(database, `sessions/${pin}/participants/${playerId}`);
  const snapshot = await get(playerRef);
  if (snapshot.exists()) {
    const currentScore = snapshot.val().score || 0;
    await update(playerRef, {
      score: currentScore + leaderboardScoreEarned,
      lastScore: currentScore,
      scoreGained: leaderboardScoreEarned,
      hasAnswered: true,
      lastAnswerTime: Date.now()
    });
  }
  
  // Update global permanent profile economy
  if (expEarned > 0 || coinsEarned > 0) {
    const userRef = ref(database, `users/${playerId}`);
    const userSnap = await get(userRef);
    if(userSnap.exists()) {
        const u = userSnap.val();
        await update(userRef, {
            exp: (u.exp || 0) + expEarned,
            points: (u.points || 0) + coinsEarned
        });
        await recordTransaction(playerId, 'earn_quiz', `Correct Answer: ${session.title || 'Live Quiz'}${currentQ.isDoublePoints ? ' (2x)' : ''}`, coinsEarned, expEarned);
    }
  }
};

// Helper: Award Session Base Rewards (when game ends)
export const awardSessionRewards = async (pin) => {
  if(!database) return;
  const sessionSnap = await get(ref(database, `sessions/${pin}`));
  if(!sessionSnap.exists()) return;
  const session = sessionSnap.val();
  const sExp = parseInt(session.sessionExp) || 0;
  const sPts = parseInt(session.sessionPoints) || 0;
  
  const participants = session.participants || {};
  
  if (sExp > 0 || sPts > 0) {
    for (const uid of Object.keys(participants)) {
       const userRef = ref(database, `users/${uid}`);
       const userSnap = await get(userRef);
       if(userSnap.exists()) {
           const u = userSnap.val();
           await update(userRef, {
               exp: (u.exp || 0) + sExp,
               points: (u.points || 0) + sPts
           });
           await recordTransaction(uid, 'earn_quiz_session', `Completed Game: ${session.title || 'Live Quiz'}`, sPts, sExp);
       }
    }
  }
  
  // Save quiz history for records
  await saveQuizHistory(pin, session);
};

// Save quiz history record
export const saveQuizHistory = async (pin, session) => {
  if(!database) return;
  const participants = session.participants || {};
  const sorted = Object.entries(participants)
    .map(([id, p]) => ({ id, name: p.name, score: p.score || 0 }))
    .sort((a, b) => b.score - a.score);
  
  const historyRef = push(ref(database, 'quiz_history'));
  await set(historyRef, {
    pin,
    quizId: session.quizId || null,
    title: session.title || 'Live Quiz',
    playedAt: Date.now(),
    totalQuestions: session.questions?.length || 0,
    totalParticipants: Object.keys(participants).length,
    topPlayers: sorted.slice(0, 3).map((p, i) => ({ ...p, rank: i + 1 })),
    participants: Object.fromEntries(
      sorted.map((p, i) => [p.id, { name: p.name, score: p.score, finalRank: i + 1 }])
    )
  });
};

// Get all quiz history (for admin)
export const getAllQuizHistory = async () => {
  if(!database) return [];
  const snap = await get(ref(database, 'quiz_history'));
  if (snap.exists()) {
    const data = snap.val();
    return Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => b.playedAt - a.playedAt);
  }
  return [];
};

// Get quiz history for a specific player (for member)
export const getPlayerQuizHistory = async (uid) => {
  if(!database) return [];
  const snap = await get(ref(database, 'quiz_history'));
  if (snap.exists()) {
    const data = snap.val();
    return Object.keys(data)
      .map(k => ({ id: k, ...data[k] }))
      .filter(h => h.participants && h.participants[uid])
      .map(h => ({
        ...h,
        myScore: h.participants[uid].score,
        myRank: h.participants[uid].finalRank
      }))
      .sort((a, b) => b.playedAt - a.playedAt);
  }
  return [];
};
