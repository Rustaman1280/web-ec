'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
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
  
  // Track last result for leaderboard feedback
  const [lastResult, setLastResult] = useState(null);

  const WAITING_MESSAGES = [
    "A bit too swift?",
    "Speed demon!",
    "Did you just guess?",
    "That was quick!",
    "Whoa! Relax...",
    "Lightning fast!",
    "Take a breath...",
    "Are you a ninja?",
    "Confident, aren't we?",
    "Pure genius or just lucky?"
  ];

  const waitingMessage = useMemo(() => {
    if (!hasAnswered) return WAITING_MESSAGES[0];
    return WAITING_MESSAGES[Math.floor(Math.random() * WAITING_MESSAGES.length)];
  }, [hasAnswered]);

  // Modal states
  const [showAchievements, setShowAchievements] = useState(false);

  // All possible badges in the game/club
  const ALL_BADGES = [
    { id: 'motm', name: 'Member of the Month', icon: 'ti-star', desc: 'Awarded by the Admin for outstanding monthly performance.', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
    { id: 'first_quiz', name: 'Ice Breaker', icon: 'ti-device-gamepad-2', desc: 'Participated in your first Live Quiz.', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { id: 'rich', name: 'Wealthy Student', icon: 'ti-coin', desc: 'Accumulated over 1,000 Points.', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  ];

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
        setProfile({ name: displayName, id: currentUser.uid, photoUrl: authProfile.photoUrl });
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
      <div style={{ textAlign: 'center', padding: '2rem', height: '100vh', background: '#2563eb', color: 'white' }}>
         <h2 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{error}</h2>
         <button onClick={() => router.push('/member')} style={{ padding: '10px 20px', borderRadius: '4px', background: 'white', color: '#333', fontWeight: 'bold', border: 'none' }}>Back</button>
      </div>
    );
  }

  if(!joined || !session) {
    return <div style={{ height: '100vh', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>Loading...</div>;
  }

  const activeQ = session && session.status === 'active' && session.questions ? session.questions[session.currentQuestionIndex] : null;
  const isMultiple = activeQ?.questionType === 'multiple';

  const calculatePoints = (isCorrect) => {
      // Basic logic without time decay, or use standard Kahoot logic. For now: Max points if correct.
      return isCorrect ? (activeQ?.rewardPoints || 1000) : 0;
  };

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
    const timeTakenMs = Date.now() - questionStartTime;
    const isCorrect = activeQ.correctIndex === index;
    const pts = calculatePoints(isCorrect);
    
    setLastResult({ isCorrect, pointsGained: pts });
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
    
    const pts = calculatePoints(isCorrect);
    setLastResult({ isCorrect, pointsGained: pts });
    await submitAnswer(pin, profile.id, selectedIndices, timeTakenMs, isCorrect);
  };

  const getActiveBackgroundStyles = (theme) => {
     if(!theme) return { background: '#2563eb' }; // Modern Blue!
     const themeBackgrounds = {
        default: '#2563eb',
        purple: 'linear-gradient(135deg, #4b1b85, #791a88)',
        space: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
        sunny: 'linear-gradient(135deg, #f6d365, #fda085)',
        ocean: 'linear-gradient(135deg, #2b5876, #4e4376)'
     };
     let bg = themeBackgrounds[theme];
     if (theme.startsWith('url')) bg = theme;
     if (!bg) bg = '#2563eb';

     if(bg.startsWith('url')) {
        return { background: `${bg} center/cover no-repeat` };
     }
     return { background: bg };
  };

  const shapeIcons = [
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40%', height: '40%' }}><polygon points="16,4 28,28 4,28"/></svg>, // Triangle
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40%', height: '40%', transform: 'rotate(45deg)' }}><rect x="6" y="6" width="20" height="20"/></svg>, // Diamond
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40%', height: '40%' }}><circle cx="16" cy="16" r="12"/></svg>, // Circle
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40%', height: '40%' }}><rect x="6" y="6" width="20" height="20"/></svg> // Square
  ];

  // Feedback display wrapper
  const isFeedback = session.status === 'leaderboard';
  const feedbackBg = isFeedback ? (lastResult?.isCorrect ? '#258c0f' : '#d11534') : null;

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      position: 'relative', 
      minHeight: '100vh', 
      overflow: 'hidden',
      fontFamily: '"Montserrat", "Quicksand", sans-serif',
      ...(feedbackBg ? { background: feedbackBg } : getActiveBackgroundStyles(session.bgTheme))
    }}>
      
      {/* Dark overlay for readability on custom backgrounds (unless in feedback screen) */}
      {!isFeedback && session.bgTheme?.startsWith('url') && (
         <div style={{ position: 'absolute', inset: 0, background: 'rgba(30, 64, 175, 0.75)' }}></div>
      )}

      {/* Global Embedded Animations */}
      <style dangerouslySetInnerHTML={{__html: `
         @keyframes spin { 100% { transform: rotate(360deg); } }
         @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 80% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
         @keyframes slideUp { 0% { opacity: 0; transform: translateY(50px); } 100% { opacity: 1; transform: translateY(0); } }
         @keyframes pulseWait { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

         .anim-spin { animation: spin 1s linear infinite; }
         .anim-pop { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
         .anim-slide-up { animation: slideUp 0.4s ease-out forwards; }
         .anim-pulse { animation: pulseWait 2s infinite; }
      `}} />

      {/* Global Top Banner for active question / wait */}
      {session.status === 'active' && (
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
             <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#333', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
               {session.currentQuestionIndex + 1}
             </div>
             {activeQ?.isDoublePoints && (
                <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: '900', fontSize: '0.9rem', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(245,158,11,0.5)', display: 'flex', alignItems: 'center', gap: '5px', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                   ⚡ 2x POINTS
                </div>
             )}
             <div style={{ background: '#eee', borderRadius: '20px', padding: '5px 15px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
               <i className="ti ti-device-gamepad-2" style={{ color: '#e21b3c' }}></i> Quiz
             </div>
         </div>
      )}

      <div style={{ position: 'relative', zIndex: 5, flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '70px' }}>

        {session.status === 'waiting' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', position: 'relative' }}>
             <i className="ti ti-world" style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '2rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '5px' }}></i>
             
             <div style={{ margin: 'auto' }}>
                <div className="anim-pop" style={{ position: 'relative', margin: '0 auto 10px auto', display: 'inline-block' }}>
                   {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt="Avatar" style={{ width: '130px', height: '130px', borderRadius: '16px', background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', objectFit: 'cover' }} />
                   ) : (
                      <div style={{ width: '130px', height: '130px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '4rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                         {(profile?.name || 'S').charAt(0).toUpperCase()}
                      </div>
                   )}
                </div>
                
                <h2 className="anim-slide-up" style={{ fontSize: '3.5rem', fontWeight: '900', textShadow: '0 2px 6px rgba(0,0,0,0.3)', marginBottom: '20px', animationDelay: '0.1s' }}>{profile.name}</h2>
                
                <h3 className="anim-slide-up" style={{ fontSize: '1.4rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)', padding: '0 20px', animationDelay: '0.2s', lineHeight: '1.4' }}>You're in! See your nickname on screen?</h3>
             </div>

             <button className="anim-slide-up" onClick={() => setShowAchievements(true)} style={{ marginTop: '0', marginBottom: '20px', padding: '15px 30px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', animationDelay: '0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                <i className="ti ti-archive" style={{ fontSize: '2rem', color: '#fbbf24' }}></i> Achievements
             </button>
          </div>
        )}

        {session.status === 'active' && !hasAnswered && activeQ && (
          <div style={{ position: 'fixed', inset: 0, padding: '75px 8px 65px 8px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px', height: '100%' }}>
               {['A', 'B', 'C', 'D'].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => handleAnswer(i)}
                    style={{
                      background: ['#e21b3c', '#1368ce', '#d89e00', '#26890c'][i],
                      border: isMultiple && selectedIndices.includes(i) ? '6px solid white' : 'none',
                      borderRadius: '4px',
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 8px 0 ${['#b3152f', '#0f52a3', '#ae8000', '#1f6e09'][i]}`,
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      transform: isMultiple && selectedIndices.includes(i) ? 'scale(0.95)' : 'scale(1)',
                      animation: `popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${i * 0.1}s backwards`
                    }}
                    onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = `0 2px 0 ${['#b3152f', '#0f52a3', '#ae8000', '#1f6e09'][i]}`; }}
                    onPointerUp={(e) => { e.currentTarget.style.transform = isMultiple && selectedIndices.includes(i) ? 'scale(0.95)' : 'scale(1)'; e.currentTarget.style.boxShadow = `0 8px 0 ${['#b3152f', '#0f52a3', '#ae8000', '#1f6e09'][i]}`; }}
                    onPointerLeave={(e) => { e.currentTarget.style.transform = isMultiple && selectedIndices.includes(i) ? 'scale(0.95)' : 'scale(1)'; e.currentTarget.style.boxShadow = `0 8px 0 ${['#b3152f', '#0f52a3', '#ae8000', '#1f6e09'][i]}`; }}
                  >
                     {shapeIcons[i]}
                     {isMultiple && selectedIndices.includes(i) && (
                       <i className="ti ti-check" style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '2rem', background: 'white', color: ['#e21b3c', '#1368ce', '#d89e00', '#26890c'][i], borderRadius: '50%', padding: '5px' }}></i>
                     )}
                  </button>
               ))}
             </div>

             {isMultiple && selectedIndices.length > 0 && (
                <button 
                   onClick={handleMultiSubmit}
                   style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', padding: '15px 40px', background: '#333', color: 'white', border: '4px solid white', borderRadius: '30px', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 20 }}
                >
                    Submit
                </button>
             )}
          </div>
        )}
        
        {session.status === 'active' && hasAnswered && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', height: '100vh' }}>
             {/* Swirl Moon Icon */}
             <div className="anim-spin" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '6px solid transparent', borderTopColor: 'white', borderRightColor: 'white', marginBottom: '20px' }}></div>
             <h2 className="anim-slide-up" style={{ fontSize: '2rem', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{waitingMessage}</h2>
             <p className="anim-slide-up" style={{ marginTop: '10px', opacity: 0.8, fontWeight: 'bold', animationDelay: '0.2s' }}>Waiting for others to answer...</p>
           </div>
        )}
        
        {session.status === 'leaderboard' && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', height: '100vh', padding: '20px', textAlign: 'center' }}>
             <h2 className="anim-pop" style={{ fontSize: '3.5rem', fontWeight: '900', textShadow: '0 2px 6px rgba(0,0,0,0.3)', marginBottom: '20px' }}>
                {lastResult?.isCorrect ? 'Correct' : 'Incorrect'}
             </h2>
             
             {lastResult?.isCorrect ? (
                <div className="anim-pop" style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0', border: '8px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', animationDelay: '0.2s' }}>
                   <i className="ti ti-check" style={{ fontSize: '5rem' }}></i>
                </div>
             ) : (
                <div className="anim-pop" style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#f44336', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0', border: '8px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', animationDelay: '0.2s' }}>
                   <i className="ti ti-x" style={{ fontSize: '5rem' }}></i>
                </div>
             )}

             {lastResult?.isCorrect && (
               <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Answer Streak <span style={{ background: '#f59e0b', padding: '2px 8px', borderRadius: '50%', marginLeft: '5px' }}>1</span>
               </div>
             )}
             
             <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px 50px', borderRadius: '8px', fontSize: '2rem', fontWeight: 'bold', margin: '2rem 0' }}>
                {lastResult?.isCorrect ? '+' : ''} {lastResult?.pointsGained || 0}
             </div>

             <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {lastResult?.isCorrect ? "You're on the podium!" : "Keep trying!"}
             </div>
           </div>
        )}

        {session.status === 'finished' && (() => {
           let myFinalRank = -1;
           if (session.participants && profile?.id) {
               const allP = Object.entries(session.participants).map(([id, p]) => ({ id, ...p })).sort((a, b) => b.score - a.score);
               myFinalRank = allP.findIndex(p => p.id === profile.id);
           }
           const isTop3 = myFinalRank >= 0 && myFinalRank <= 2;
           const score = session.participants?.[profile.id]?.score || 0;
           const trophyColors = ['#fbbf24', '#cbd5e1', '#b45309']; // Gold, Silver, Bronze

           return (
             <div className="anim-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', height: '100vh', textAlign: 'center', paddingBottom: '100px' }}>
               
               {isTop3 ? (
                  <>
                    <h2 className="anim-pop" style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)', animationDelay: '0.2s' }}>Congratulations!</h2>
                    <div className="anim-pop anim-float" style={{ 
                       width: '160px', height: '160px', 
                       borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))', 
                       border: `4px solid ${trophyColors[myFinalRank]}`, 
                       display: 'flex', alignItems: 'center', justifyContent: 'center', 
                       margin: '2rem auto', boxShadow: `0 0 40px ${trophyColors[myFinalRank]}80`,
                       animationDelay: '0.5s'
                    }}>
                       <i className="ti ti-trophy" style={{ fontSize: '7rem', color: trophyColors[myFinalRank] }}></i>
                    </div>
                    <h3 className="anim-pop" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: trophyColors[myFinalRank], animationDelay: '0.7s', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                       You placed {myFinalRank === 0 ? '1st!' : myFinalRank === 1 ? '2nd!' : '3rd!'}
                    </h3>
                  </>
               ) : (
                  <>
                    <h2 className="anim-pop" style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)', animationDelay: '0.2s' }}>Well Played!</h2>
                    <div className="anim-pop" style={{ 
                       width: '140px', height: '140px', 
                       borderRadius: '50%', background: 'rgba(255,255,255,0.1)', 
                       border: `4px solid #94a3b8`, 
                       display: 'flex', alignItems: 'center', justifyContent: 'center', 
                       margin: '2rem auto',
                       animationDelay: '0.4s'
                    }}>
                       <i className="ti ti-thumb-up" style={{ fontSize: '6rem', color: '#e2e8f0' }}></i>
                    </div>
                  </>
               )}

               <div className="anim-slide-up" style={{ background: 'rgba(0,0,0,0.4)', padding: '25px 50px', borderRadius: '20px', margin: '2rem auto', backdropFilter: 'blur(10px)', animationDelay: '1s', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', opacity: 0.9, fontWeight: 'bold' }}>Final Score</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '3.5rem', fontWeight: '900', color: 'var(--accent)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{score}</p>
               </div>

               <button className="btn-primary anim-pop" onClick={() => router.push('/member')} style={{ padding: '15px 40px', borderRadius: '30px', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', animationDelay: '1.5s', marginTop: '1rem', border: '2px solid white' }}>
                  Return Home
               </button>
             </div>
           );
        })()}

      </div>

      {/* Global Bottom Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: '#1e40af', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between', zIndex: 100, boxShadow: '0 -2px 10px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="Avatar" style={{ width: '45px', height: '45px', borderRadius: '6px', background: 'white', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '45px', height: '45px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
               {(profile?.name || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', color: 'white', fontWeight: 'bold' }}>
             <span style={{ fontSize: '1.1rem', lineHeight: '1.2' }}>{profile.name}</span>
             <span style={{ fontSize: '0.9rem', lineHeight: '1', opacity: 0.8 }}>{session.participants?.[profile.id]?.score || 0}</span>
          </div>
        </div>
        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 12px', borderRadius: '8px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
           <i className="ti ti-mood-smile" style={{ fontSize: '1.4rem' }}></i>
           <span style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '2px' }}>React</span>
        </button>
      </div>

      {/* Achievements Popup Modal */}
      {showAchievements && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="anim-pop" style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', color: '#333' }}>
               <div style={{ background: '#2563eb', color: 'white', padding: '20px', textAlign: 'center', position: 'relative' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>🏆 Trophy Room</h2>
                  <button onClick={() => setShowAchievements(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                     <i className="ti ti-x" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}></i>
                  </button>
               </div>
               
               <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {Object.keys(authProfile?.badges || {}).length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#666' }}>
                        <i className="ti ti-ghost" style={{ fontSize: '3rem', marginBottom: '10px', color: '#ccc' }}></i>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No achievements yet</h3>
                        <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Play more quizzes to unlock badges!</p>
                     </div>
                  ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {ALL_BADGES.filter(b => authProfile?.badges?.[b.id]).map(badge => (
                           <div key={badge.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: badge.bg, padding: '15px', borderRadius: '12px', border: `2px solid ${badge.color}` }}>
                              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>
                                 <i className={`ti ${badge.icon}`}></i>
                              </div>
                              <div style={{ flex: 1 }}>
                                 <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: badge.color }}>{badge.name}</h4>
                                 <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#555', lineHeight: '1.3' }}>{badge.desc}</p>
                                 <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>
                                    Unlocked: {new Date(authProfile.badges[badge.id].earnedAt).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               
               <div style={{ padding: '15px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                  <button onClick={() => setShowAchievements(false)} style={{ background: '#eee', color: '#333', border: 'none', padding: '10px 30px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
