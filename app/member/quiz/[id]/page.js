'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToSession, joinSession, submitAnswer } from '@/lib/firebaseUtils';

import { useAuth } from '@/hooks/useAuth';

export default function MemberActiveQuiz() {
  const params = useParams();
  const router = useRouter();
  const pin = params.id;
  
  const { currentUser, profile: authProfile, loading: authLoading } = useAuth();
  
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || !authProfile) {
        router.push('/auth/login');
      } else {
        let displayName = authProfile.nickname;
        if (!displayName || displayName === authProfile.fullName) {
            const nameParts = (authProfile.fullName || 'Student').split(' ');
            const firstWord = nameParts[0].toLowerCase();
            if (nameParts.length > 1 && (firstWord === 'muhammad' || firstWord === 'm.' || firstWord === 'mohammad' || firstWord === 'mochammad')) {
                displayName = nameParts[1];
            } else {
                displayName = nameParts[0];
            }
        }
        setProfile({ name: displayName, id: currentUser.uid });
      }
    }
  }, [currentUser, authProfile, authLoading, router]);

  useEffect(() => {
    if(!profile || !pin) return;
    
    // Join logic
    const attemptJoin = async () => {
       const success = await joinSession(pin, profile);
       if(!success) {
          setError("Failed to join. Invalid PIN or session already started.");
       } else {
          setJoined(true);
       }
    };
    attemptJoin();
    
    // Subscribe to state
    const unsubscribe = subscribeToSession(pin, (data) => {
       if(!data) {
         setError("Session ended by admin.");
         setSession(null);
         return;
       }
       setSession(data);
       // Reset hasAnswered if currentQuestionIndex changed (we track this via local state vs remote to be simple, but usually remote is safer)
       // Let's do it simply by checking changes to index
    });
    
    return () => unsubscribe();
  }, [profile, pin]);
  
  // Update answered state strictly when question index changes
  const [lastIndex, setLastIndex] = useState(-1);
  useEffect(() => {
      if(session && session.currentQuestionIndex !== lastIndex && session.status === 'active') {
         setHasAnswered(false);
         setLastIndex(session.currentQuestionIndex);
         setQuestionStartTime(Date.now());
      }
  }, [session, lastIndex]);

  if(error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
         <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</h2>
         <button className="btn-primary" onClick={() => router.push('/member')}>Back</button>
      </div>
    );
  }

  if(!joined || !session) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Connecting to Game Server...</div>;
  }

  const handleAnswer = async (index) => {
    if(hasAnswered) return;
    
    setHasAnswered(true);
    // eslint-disable-next-line
    const timeTakenMs = Date.now() - questionStartTime;
    const isCorrect = session.questions[session.currentQuestionIndex].correctIndex === index;
    
    await submitAnswer(pin, profile.id, index, timeTakenMs, isCorrect);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {session.status === 'waiting' && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh' }}>
           <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>You&apos;re in!</h2>
           <p style={{ color: 'var(--text-muted)' }}>See your nickname on the screen?</p>
           <h3 style={{ marginTop: '2rem', fontSize: '1.5rem', color: 'var(--primary)' }}>{profile.name}</h3>
        </div>
      )}

      {session.status === 'active' && !hasAnswered && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '1rem', height: '80vh' }}>
          {['A', 'B', 'C', 'D'].map((letter, i) => (
             <button 
               key={i}
               onClick={() => handleAnswer(i)}
               style={{
                 background: ['#e11d48', '#2563eb', '#d97706', '#16a34a'][i],
                 border: 'none', borderRadius: '12px',
                 color: 'white', fontSize: '4rem', fontWeight: 'bold',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}
             >
             </button>
          ))}
        </div>
      )}
      
      {session.status === 'active' && hasAnswered && (
         <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh' }}>
           <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Answer Submitted!</h2>
           <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Waiting for others...</p>
         </div>
      )}
      
      {session.status === 'leaderboard' && (
         <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh' }}>
           <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Look at the screen!</h2>
           <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>The leaderboard is up.</p>
         </div>
      )}

      {session.status === 'finished' && (
         <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh' }}>
           <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Game Over!</h2>
           <p style={{ color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '3rem' }}>Thanks for playing, {profile.name}.</p>
           <button className="btn-primary" onClick={() => router.push('/member')} style={{ width: '100%' }}>Play Again</button>
         </div>
      )}

    </div>
  );
}
