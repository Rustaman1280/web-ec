'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createQuizSession } from '@/lib/firebaseUtils';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { getAllTasks } from '@/lib/economyUtils';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ students: 0, tasks: 0 });

  useEffect(() => {
     const fetchStats = async () => {
        if(!database) return;
        const usersSnap = await get(ref(database, 'users'));
        let studentCount = 0;
        if(usersSnap.exists()) {
           const uData = usersSnap.val();
           studentCount = Object.values(uData).filter(u => u.role !== 'admin').length;
        }
        const tasksData = await getAllTasks();
        setStats({ students: studentCount, tasks: tasksData.length });
     };
     fetchStats();
  }, []);

  // Mock questions for demo purposes
  const DEMO_QUESTIONS = [
    {
      id: 'q1',
      text: 'What is the past tense of "Go"?',
      options: ['Went', 'Gone', 'Going', 'Goed'],
      correctIndex: 0,
      timeLimit: 20
    },
    {
      id: 'q2',
      text: 'Choose the correct sentence:',
      options: ['He do not like apples.', 'He unlikes apples.', 'He does not like apples.', 'He not like apples.'],
      correctIndex: 2,
      timeLimit: 30
    },
    {
      id: 'q3',
      text: 'Which word is an adjective?',
      options: ['Run', 'Beautiful', 'Quickly', 'Happiness'],
      correctIndex: 1,
      timeLimit: 20
    }
  ];

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const pin = await createQuizSession('demo-quiz', DEMO_QUESTIONS);
      if(pin) {
        router.push(`/admin/quiz/${pin}`);
      } else {
        setError('Failed to create session.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '1rem' }}>
       <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>Overview</h2>
       
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', background: '#fff' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Enrolled Students</div>
             <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '0.5rem' }}>{stats.students}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)', background: '#fff' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Dynamic Tasks Created</div>
             <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '0.5rem' }}>{stats.tasks}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', background: '#fff' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Live Sessions</div>
             <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '0.5rem' }}>0</div>
          </div>
       </div>

       <div className="glass-panel" style={{ padding: '2.5rem', background: 'var(--gradient-bg)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Quick Actions</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '600px' }}>Start a live real-time quiz session on your projector instantly. Students can join using the generated Game PIN from their profile hub.</p>
          
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
          
          <button onClick={handleCreateSession} disabled={loading} className="btn-primary" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-device-tv" style={{ marginRight: '10px', fontSize: '1.4rem' }}></i> 
            {loading ? 'Generating PIN...' : 'Host Live Quiz Display'}
          </button>
       </div>
    </div>
  );
}
