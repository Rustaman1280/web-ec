'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createQuizSession } from '@/lib/firebaseUtils';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/lib/authUtils';

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || profile?.role !== 'admin') {
         // Redirect non-admins or unauthenticated
         router.push('/auth/login');
      }
    }
  }, [currentUser, profile, authLoading, router]);

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

  if(authLoading || !profile) return <div style={{textAlign: 'center', marginTop: '30vh'}}>Authenticating...</div>;

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const pin = await createQuizSession('demo-quiz', DEMO_QUESTIONS);
      if(pin) {
        router.push(`/admin/quiz/${pin}`);
      } else {
        setError('Failed to create session. Check Firebase config.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Make sure Firebase is initialized correctly.');
    }
    setLoading(false);
  };
  
  const handleLogout = async () => {
    await logoutUser();
    router.push('/');
  }

  return (
    <div className="container">
      <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', margin: 0 }}>Welcome, Admin</h2>
           <button onClick={handleLogout} style={{ background: 'transparent', color: '#ef4444', border: '1px solid currentColor', padding: '0.5rem 1rem', borderRadius: '8px' }}>Log Out</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div style={{ 
            background: 'var(--gradient-primary)', 
            padding: '2rem', 
            borderRadius: '16px',
            border: 'none',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Host a Live Quiz</h3>
            <p style={{ opacity: 0.9, marginBottom: '2rem' }}>
              Start a new real-time game. Players can join using the generated Game PIN.
            </p>
            {error && <div style={{ color: '#fca5a5', marginBottom: '1rem' }}>{error}</div>}
            <button 
              className="btn-primary" 
              onClick={handleCreateSession}
              disabled={loading}
              style={{ width: '100%', background: 'white', color: 'var(--primary)' }}
            >
              {loading ? 'Generating PIN...' : 'Start Demo Quiz'}
            </button>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '2rem', 
            borderRadius: '16px',
            border: '1px solid var(--border-light)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Student Management</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              View student profiles, see all registered members, and track cumulative scores.
            </p>
            <button className="btn-primary" style={{ width: '100%', background: 'transparent', border: '1px solid var(--text-muted)' }}>
              Manage Students
            </button>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '2rem', 
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            opacity: 0.5
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Question Bank</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Create, edit, and organize question banks. (Coming soon)
            </p>
            <button className="btn-primary" disabled style={{ width: '100%', background: 'transparent', border: '1px solid var(--text-muted)' }}>
              Manage Questions
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
