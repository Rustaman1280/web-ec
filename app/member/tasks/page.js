'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAllTasks, getUserCompletedTasks, claimTaskReward } from '@/lib/economyUtils';

export default function TasksPage() {
  const { currentUser, profile, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const fetchTasksData = useCallback(async () => {
    if(!currentUser) return;
    setLoading(true);
    const dbTasks = await getAllTasks();
    const completed = await getUserCompletedTasks(currentUser.uid);
    setTasks(dbTasks);
    setCompletedTaskIds(completed);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      // eslint-disable-next-line
      fetchTasksData();
    }
  }, [authLoading, currentUser, fetchTasksData]);

  const handleClaim = async (taskId, pts, exp) => {
    setClaimingId(taskId);
    const success = await claimTaskReward(currentUser.uid, taskId, pts, exp);
    if(success) {
       // Refresh local state to show it completed
       setCompletedTaskIds(prev => [...prev, taskId]);
    } else {
       alert("Error claiming task. Maybe you already claimed it?");
    }
    setClaimingId(null);
  };

  if (authLoading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading Tasks...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="heading-xl" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Your Tasks</h2>
        <p style={{ color: 'var(--text-muted)' }}>Complete assignments to earn Points and EXP.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
             <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dynamic tasks...</div>
        ) : tasks.length === 0 ? (
             <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks assigned by Admin yet.</div>
        ) : tasks.map((task) => {
          const isCompleted = completedTaskIds.includes(task.id);
          const isClaiming = claimingId === task.id;

          return (
            <div key={task.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isCompleted ? 0.7 : 1 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px', textDecoration: isCompleted ? 'line-through' : 'none' }}>{task.title}</h3>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: '600' }}>{task.type}</span> • 
                  <span style={{ color: isCompleted ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                    {isCompleted ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '0.9rem' }}>+{task.rewardPoints} Pts</span>
                  <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '0.9rem' }}>+{task.rewardExp} EXP</span>
                </div>
                
                {!isCompleted && (
                  <button 
                    onClick={() => handleClaim(task.id, task.rewardPoints, task.rewardExp)}
                    disabled={isClaiming}
                    style={{ background: 'var(--gradient-primary)', color: 'white', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: isClaiming ? 'wait' : 'pointer' }}>
                    {isClaiming ? 'Claiming...' : 'Complete & Run'}
                  </button>
                )}
                {isCompleted && (
                  <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>✓ Reward Claimed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
