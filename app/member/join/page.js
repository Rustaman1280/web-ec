'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export default function JoinQuiz() {
  const router = useRouter();
  const { currentUser, profile, loading: authLoading } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading...</div>;
  }

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    
    if(!pin) {
      setError('Please enter a game PIN');
      return;
    }
    
    const cleanPin = pin.trim().toUpperCase();
    setLoading(true);
    
    try {
      const snap = await get(ref(database, `sessions/${cleanPin}`));
      if(snap.exists()) {
         const type = snap.val().type;
         if (type === 'speechy') {
            router.push(`/member/speechy/${cleanPin}`);
         } else {
            router.push(`/member/quiz/${cleanPin}`);
         }
      } else {
         setError('PIN not found');
         setLoading(false);
      }
    } catch(err) {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/member')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem' }}>
          ← Back
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', width: '100%', textAlign: 'center', marginTop: '5vh' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Live Quiz</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Enter the Game PIN shown on the projector.</p>
        
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Game PIN" 
            value={pin}
            onChange={e => setPin(e.target.value)}
            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}
            maxLength={6}
          />
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ marginTop: '1rem', width: '100%', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Connecting...' : 'Enter Game'}
          </button>
        </form>
      </div>
    </div>
  );
}
