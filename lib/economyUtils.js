import { database } from "./firebase";
import { ref, set, get, update, push, child } from "firebase/database";

// Create a new task (Admin)
export const createTask = async (title, type, rewardPoints, rewardExp, questions = []) => {
  if(!database) return null;
  const tasksRef = ref(database, 'tasks');
  const newTaskRef = push(tasksRef);
  await set(newTaskRef, {
    title,
    type,
    rewardPoints: parseInt(rewardPoints),
    rewardExp: parseInt(rewardExp),
    questions, // Added dynamic questions payload
    createdAt: Date.now()
  });
  return newTaskRef.key;
};

// Fetch single task by ID
export const getTaskById = async (taskId) => {
  if(!database) return null;
  const taskRef = ref(database, `tasks/${taskId}`);
  const snapshot = await get(taskRef);
  if(snapshot.exists()) {
    return { id: taskId, ...snapshot.val() };
  }
  return null;
};

// Fetch all tasks
export const getAllTasks = async () => {
  if(!database) return [];
  const tasksRef = ref(database, 'tasks');
  const snapshot = await get(tasksRef);
  if(snapshot.exists()) {
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  }
  return [];
};

// Get completed tasks for a user
export const getUserCompletedTasks = async (uid) => {
  if(!database) return [];
  const userTasksRef = ref(database, `user_tasks/${uid}`);
  const snapshot = await get(userTasksRef);
  if(snapshot.exists()) {
    return Object.keys(snapshot.val()); // Array of task IDs
  }
  return [];
};

// Claim a task reward (Student)
export const claimTaskReward = async (uid, taskId, rewardPoints, rewardExp) => {
  if(!database) return false;
  
  // 1. Check if already claimed
  const claimRef = ref(database, `user_tasks/${uid}/${taskId}`);
  const claimSnap = await get(claimRef);
  if(claimSnap.exists()) return false; // Already claimed

  // 2. Mark as claimed
  await set(claimRef, { claimedAt: Date.now() });

  // 3. Add rewards to user
  const userRef = ref(database, `users/${uid}`);
  const userSnap = await get(userRef);
  if(userSnap.exists()) {
    const userData = userSnap.val();
    await update(userRef, {
      points: (userData.points || 0) + rewardPoints,
      exp: (userData.exp || 0) + rewardExp
    });
  }
  return true;
};

// Economy: Spend Points to change Nickname
export const changeNickname = async (uid, newNickname, cost = 500) => {
  if(!database) return false;
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  if(snapshot.exists()) {
    const user = snapshot.val();
    if((user.points || 0) >= cost) {
      await update(userRef, {
        points: user.points - cost,
        nickname: newNickname
      });
      return true;
    }
  }
  return false;
};

// Economy: Spend Points for EXP conversion
export const convertPointsToExp = async (uid, pointsToSpend, expToGain) => {
  if(!database) return false;
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  if(snapshot.exists()) {
    const user = snapshot.val();
    if((user.points || 0) >= pointsToSpend) {
      await update(userRef, {
        points: user.points - pointsToSpend,
        exp: (user.exp || 0) + expToGain
      });
      return true;
    }
  }
  return false;
};

// Update Profile Photo
export const updateProfilePhoto = async (uid, photoUrl) => {
  if(!database) return false;
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, { photoUrl });
  return true;
};
