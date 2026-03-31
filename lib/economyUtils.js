import { database } from "./firebase";
import { ref, set, get, update, push } from "firebase/database";

// Create a new task (Admin)
export const createTask = async (title, type, rewardPoints, rewardExp, blocks = [], deadlineMs = null) => {
  if(!database) return null;
  const tasksRef = ref(database, 'tasks');
  const newTaskRef = push(tasksRef);
  await set(newTaskRef, {
    title,
    type,
    rewardPoints: parseInt(rewardPoints),
    rewardExp: parseInt(rewardExp),
    blocks, // Contains array of {type: 'mcq'|'essay'|'photo', text, etc}
    deadline: deadlineMs,
    createdAt: Date.now()
  });
  return newTaskRef.key;
};

// Delete Task (Admin)
export const deleteTask = async (taskId) => {
  if(!database) return false;
  await set(ref(database, `tasks/${taskId}`), null);
  return true;
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

// Fetch rich completed task details for Admin
export const fetchUserTaskResults = async (uid) => {
  if(!database) return [];
  const uTasksRef = ref(database, `user_tasks/${uid}`);
  const uTasksSnap = await get(uTasksRef);
  if(!uTasksSnap.exists()) return [];
  
  const completedIds = uTasksSnap.val();
  const results = [];
  
  for(let taskId of Object.keys(completedIds)) {
     const tSnap = await get(ref(database, `tasks/${taskId}`));
     if(tSnap.exists()) {
        const tData = tSnap.val();
        results.push({
           id: taskId,
           title: tData.title,
           claimedAt: completedIds[taskId].claimedAt,
           rewardPoints: tData.rewardPoints,
           rewardExp: tData.rewardExp
        });
     }
  }
  return results.sort((a,b) => b.claimedAt - a.claimedAt);
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
    // Log transaction
    await recordTransaction(uid, 'earn_task', `Completed Task: ${taskId}`, rewardPoints, rewardExp);
  }
  return true;
};

// Add Transaction Logger Core
export const recordTransaction = async (uid, type, title, pointChange, expChange) => {
  if(!database) return;
  const tRef = push(ref(database, `transactions/${uid}`));
  await set(tRef, {
     type,
     title,
     pointChange: parseInt(pointChange) || 0,
     expChange: parseInt(expChange) || 0,
     timestamp: Date.now()
  });
};

export const getStreakData = async (uid) => {
  if(!database) return { streakCount: 0, checkedInToday: false };
  const userRef = ref(database, `users/${uid}`);
  const snap = await get(userRef);
  if(!snap.exists()) return { streakCount: 0, checkedInToday: false };
  const user = snap.val();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastStr = user.lastCheckInDate || null;
  let streak = user.streakCount || 0;
  let checkedInToday = false;

  if (lastStr === todayStr) {
     checkedInToday = true;
  } else if (lastStr !== yesterdayStr) {
     streak = 0; // broken
  }
  
  return { streakCount: streak, checkedInToday };
};

// Add Attendance Logic
export const recordAttendance = async (uid) => {
  if(!database) return false;
  
  const { streakCount, checkedInToday } = await getStreakData(uid);
  if(checkedInToday) return false;

  const newStreak = streakCount + 1;
  const rewards = [5, 10, 15, 20, 30]; // 5 day cycle
  const cycleIndex = (newStreak - 1) % rewards.length;
  const rewardAmt = rewards[cycleIndex];

  const todayStr = new Date().toISOString().split('T')[0];
  const attRef = ref(database, `attendance/${todayStr}/${uid}`);
  await set(attRef, { timestamp: Date.now() });
  
  const userRef = ref(database, `users/${uid}`);
  const userSnap = await get(userRef);
  if(userSnap.exists()) {
     const user = userSnap.val();
     await update(userRef, { 
       exp: (user.exp || 0) + rewardAmt,
       points: (user.points || 0) + rewardAmt,
       streakCount: newStreak,
       lastCheckInDate: todayStr
     });
     // Log to Ledger
     await recordTransaction(uid, 'attendance', `Daily Claim (Day ${newStreak})`, rewardAmt, rewardAmt);
  }
  return { success: true, rewardAmt, newStreak };
};

export const fetchUserTransactions = async (uid) => {
  if(!database) return [];
  const tRef = ref(database, `transactions/${uid}`);
  const snap = await get(tRef);
  if(snap.exists()) {
    const data = snap.val();
    return Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a,b) => b.timestamp - a.timestamp);
  }
  return [];
};

// Add peer-to-peer point transfer
export const transferPointsByEmail = async (senderUid, receiverEmail, amount, fee = 5) => {
  if(!database || amount <= 0) return { success: false, msg: 'Invalid amount' };
  
  // 1. Get sender profile to check balance
  const senderRef = ref(database, `users/${senderUid}`);
  const senderSnap = await get(senderRef);
  if(!senderSnap.exists()) return { success: false, msg: 'Sender not found' };
  const sender = senderSnap.val();
  
  const totalCost = parseInt(amount) + parseInt(fee);
  if((sender.points || 0) < totalCost) {
     return { success: false, msg: `Insufficient balance! You need ${totalCost} Points (includes ${fee} Pts fee).` };
  }
  
  // 2. Find receiver by Email
  const usersRef = ref(database, 'users');
  const allUsersSnap = await get(usersRef);
  if(!allUsersSnap.exists()) return { success: false, msg: 'Database empty' };
  
  let receiverUid = null;
  let receiverData = null;
  const allUsers = allUsersSnap.val();
  for(let uid in allUsers) {
      if(allUsers[uid].email && allUsers[uid].email.toLowerCase() === receiverEmail.toLowerCase()) {
         receiverUid = uid;
         receiverData = allUsers[uid];
         break;
      }
  }
  
  if(!receiverUid) return { success: false, msg: 'Receiver email not found among registered students' };
  if(receiverUid === senderUid) return { success: false, msg: 'You cannot double-cross yourself!' };

  // 3. Perform atomic-like updates
  await update(senderRef, { points: sender.points - totalCost });
  await update(ref(database, `users/${receiverUid}`), { points: (receiverData.points || 0) + parseInt(amount) });
  
  // 4. Record Ledgers for both
  await recordTransaction(senderUid, 'transfer_out', `Sent points to ${receiverData.fullName || receiverEmail}`, -totalCost, 0);
  await recordTransaction(receiverUid, 'transfer_in', `Received points from ${sender.fullName || 'a student'}`, parseInt(amount), 0);
  
  return { success: true, msg: `Successfully transferred ${amount} Points!` };
};

// Economy: Spend Points to change Nickname
export const changeNickname = async (uid, newNickname, cost = 50) => {
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
      await recordTransaction(uid, 'spend', `Changed Nickname to ${newNickname}`, -cost, 0);
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
      await recordTransaction(uid, 'spend', `Converted ${pointsToSpend} Points to ${expToGain} EXP`, -pointsToSpend, expToGain);
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
