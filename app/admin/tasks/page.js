'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createTask, getAllTasks } from '@/lib/economyUtils';

export default function AdminTasksManager() {
  const router = useRouter();
  const { currentUser, profile, loading: authLoading } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Required');
  const [points, setPoints] = useState('100');
  const [exp, setExp] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const data = await getAllTasks();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || profile?.role !== 'admin') {
         router.push('/auth/login');
      } else {
         // eslint-disable-next-line
         fetchTasks();
      }
    }
  }, [currentUser, profile, authLoading, router]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(!title) return;
    setIsSubmitting(true);
    await createTask(title, type, points, exp);
    setTitle('');
    await fetchTasks();
    setIsSubmitting(false);
  };

  if(authLoading || !profile) return <div style={{textAlign: 'center', marginTop: '30vh'}}>Authenticating...</div>;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Create Task Form */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Create New Task</h2>
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Task Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Complete Grammar Exam" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Type</label>
              <select 
                value={type} onChange={(e) => setType(e.target.value)} 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '1.1rem', outline: 'none' }}>
                <option value="Required">Required</option>
                <option value="Optional">Optional</option>
                <option value="Practice">Practice</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Reward Points</label>
                <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} min="0" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Reward EXP</label>
                <input type="number" value={exp} onChange={(e) => setExp(e.target.value)} min="0" required />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '1rem' }}>
              {isSubmitting ? 'Creating...' : 'Publish Task'}
            </button>
          </form>
        </div>

        {/* Existing Tasks List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>All Dynamic Tasks</h2>
          {loading ? (
             <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
             <p style={{ color: 'var(--text-muted)' }}>No tasks have been created yet.</p>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '12px', background: '#f8fafc' }}>
                    <div>
                      <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.type}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{t.rewardPoints} Pts</div>
                      <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{t.rewardExp} EXP</div>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
