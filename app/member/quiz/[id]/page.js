'use client';
import { useEffect, useState, useRef } from 'react';
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
  const [selectedIndices, setSelectedIndices] = useState([]);

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

  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if(!profile || !pin) return;
    
    let isSubscribed = true;

    // Join logic
    const attemptJoin = async () => {
       if (hasJoinedRef.current) return;
       hasJoinedRef.current = true;
       
       const success = await joinSession(pin, profile);
       if(!success) {
          if (isSubscribed) setError("Failed to join. Invalid PIN or session already started.");
       } else {
          if (isSubscribed) setJoined(true);
       }
    };
    attemptJoin();
    
    // Subscribe to state
    const unsubscribe = subscribeToSession(pin, (data) => {
       if (!isSubscribed) return;
       if(!data) {
         setError("Session ended by admin.");
         setSession(null);
         return;
       }
       setSession(data);
    });
    
    return () => {
       isSubscribed = false;
       unsubscribe();
    };
  }, [profile, pin]);
  
  // Update answered state strictly when question index changes
  const [lastIndex, setLastIndex] = useState(-1);
  useEffect(() => {
      if(session && session.currentQuestionIndex !== lastIndex && session.status === 'active') {
         setHasAnswered(false);
         setSelectedIndices([]);
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

  const activeQ = session && session.status === 'active' && session.questions ? session.questions[session.currentQuestionIndex] : null;
  const isMultiple = activeQ?.questionType === 'multiple';

  const handleAnswer = async (index) => {
    if(hasAnswered) return;
    
    if (isMultiple) {
       if (selectedIndices.includes(index)) {
          setSelectedIndices(selectedIndices.filter(i => i !== index));
       } else {
          setSelectedIndices([...selectedIndices, index]);
       }
       return;
    }
    
    setHasAnswered(true);
    // eslint-disable-next-line
    const timeTakenMs = Date.now() - questionStartTime;
    const isCorrect = activeQ.correctIndex === index;
    
    await submitAnswer(pin, profile.id, index, timeTakenMs, isCorrect);
  };

  const handleMultiSubmit = async () => {
    if(hasAnswered || selectedIndices.length === 0) return;
    setHasAnswered(true);
    const timeTakenMs = Date.now() - questionStartTime;
    
    const expected = activeQ.correctIndices || [];
    const isCorrect = 
       selectedIndices.length === expected.length && 
       selectedIndices.every(val => expected.includes(val));
    
    await submitAnswer(pin, profile.id, selectedIndices, timeTakenMs, isCorrect);
  };

  const getActiveBackgroundStyles = (theme) => {
     if(!theme) return { background: '#f8f9fa' };
     const themeBackgrounds = {
        default: '#f8f9fa',
        purple: 'linear-gradient(135deg, #4b1b85, #791a88)',
        space: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
        sunny: 'linear-gradient(135deg, #f6d365, #fda085)',
        ocean: 'linear-gradient(135deg, #2b5876, #4e4376)'
     };
     let bg = themeBackgrounds[theme];
     if (theme.startsWith('url')) bg = theme;
     if (!bg) bg = '#f8f9fa';

     if(bg.startsWith('url')) {
        return { background: `${bg} center/cover no-repeat` };
     }
     return { background: bg };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', ...getActiveBackgroundStyles(session.bgTheme) }}>
      
      {session.status === 'waiting' && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh', backdropFilter: 'blur(10px)', color: 'var(--text-main)' }}>
           <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'white' : 'inherit' }}>You&apos;re in!</h2>
           <p style={{ color: 'var(--text-muted)' }}>See your nickname on the screen?</p>
           <h3 style={{ marginTop: '2rem', fontSize: '1.5rem', color: 'var(--primary)' }}>{profile.name}</h3>
        </div>
      )}

      {session.status === 'active' && !hasAnswered && activeQ && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', padding: '1rem' }}>
           {isMultiple && (
              <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'white' : '#666', fontWeight: 'bold', textShadow: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}>
                 <i className="ti ti-list-check"></i> Select all correct answers
              </h3>
           )}

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
             {['A', 'B', 'C', 'D'].map((letter, i) => (
                <button 
                  key={i}
                  onClick={() => handleAnswer(i)}
                  style={{
                    background: ['#e11d48', '#2563eb', '#d97706', '#16a34a'][i],
                    border: isMultiple && selectedIndices.includes(i) ? '6px solid white' : 'none',
                    borderRadius: '12px',
                    position: 'relative',
                    color: 'white', fontSize: '4rem', fontWeight: 'bold',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                    transform: isMultiple && selectedIndices.includes(i) ? 'scale(0.95)' : 'scale(1)'
                  }}
                >
                   {isMultiple && selectedIndices.includes(i) && (
                     <i className="ti ti-check" style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '2rem', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', padding: '5px' }}></i>
                   )}
                </button>
             ))}
             {/* If we wanted exactly matching lengths, we would check if this option index is visible, but we assume 4 standard Kahoot options. */}
           </div>

           {isMultiple && (
              <button 
                 disabled={selectedIndices.length === 0}
                 onClick={handleMultiSubmit}
                 style={{ marginTop: '1.5rem', padding: '20px', background: selectedIndices.length > 0 ? '#10b981' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.5rem', fontWeight: 'bold', cursor: selectedIndices.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.3s', boxShadow: selectedIndices.length > 0 ? '0 5px 15px rgba(16, 185, 129, 0.4)' : 'none' }}
              >
                  Submit Answer
              </button>
           )}
        </div>
      )}
      
      {session.status === 'active' && hasAnswered && (
         <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh', backdropFilter: 'blur(10px)' }}>
           <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'white' : 'inherit' }}>Answer Submitted!</h2>
           <p style={{ color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginTop: '1rem' }}>Waiting for others...</p>
         </div>
      )}
      
      {session.status === 'leaderboard' && (
         <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh', backdropFilter: 'blur(10px)' }}>
           <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'white' : 'inherit' }}>Look at the screen!</h2>
           <p style={{ color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginTop: '1rem' }}>The leaderboard is up.</p>
         </div>
      )}

      {session.status === 'finished' && (
         <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '20vh', backdropFilter: 'blur(10px)' }}>
           <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'white' : 'inherit' }}>Game Over!</h2>
           <p style={{ color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginTop: '1rem', marginBottom: '3rem' }}>Thanks for playing, {profile.name}.</p>
           <button className="btn-primary" onClick={() => router.push('/member')} style={{ width: '100%' }}>Play Again</button>
         </div>
      )}

    </div>
  );
}
