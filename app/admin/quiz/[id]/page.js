'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToSession, updateSessionState, awardSessionRewards } from '@/lib/firebaseUtils';
import confetti from 'canvas-confetti';

function AnimatedLeaderboardRow({ player, activeRank, showNewRanks }) {
   const [displayScore, setDisplayScore] = useState(player.lastScore !== undefined ? player.lastScore : player.score);
   
   useEffect(() => {
      const duration = 1500; // count up over 1.5 seconds
      const start = player.lastScore !== undefined ? player.lastScore : player.score;
      const end = player.score;
      setDisplayScore(start); // reset
      if (start === end) return;
      
      let startTime;
      const animate = (time) => {
         if (!startTime) startTime = time;
         const progress = Math.min((time - startTime) / duration, 1);
         const easeOutQuart = 1 - Math.pow(1 - progress, 4);
         setDisplayScore(Math.floor(start + (end - start) * easeOutQuart));
         if (progress < 1) requestAnimationFrame(animate);
      };
      const frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
   }, [player.score, player.lastScore, showNewRanks]);

   const isFirst = activeRank === 0;
   const isVisible = activeRank < 5 && activeRank >= 0; // Show top 5

   return (
      <div style={{
         position: 'absolute',
         top: 0, left: 0, right: 0,
         transform: `translateY(${activeRank * 115}px)`, // 115px gap
         transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s', // bouncy swap
         opacity: isVisible ? 1 : 0, 
         pointerEvents: isVisible ? 'auto' : 'none',
         zIndex: isFirst ? 10 : 5 - activeRank
      }}>
         <div className={`anim-pop ${isFirst ? 'anim-glow' : ''}`} style={{
            animationDelay: showNewRanks ? '0s' : `${activeRank * 0.15}s`, // only delay initial popIn
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.5rem 3rem', 
            background: isFirst ? 'var(--gradient-primary)' : 'var(--bg-glass)', 
            color: isFirst ? 'white' : 'var(--text-main)',
            borderRadius: '16px', fontSize: '2.2rem', fontWeight: 'bold', 
            border: isFirst ? 'none' : '2px solid var(--border-light)', 
            backdropFilter: 'blur(10px)',
            boxShadow: isFirst ? '0 10px 30px rgba(79, 70, 229, 0.4)' : 'none',
            transform: isFirst ? 'scale(1.02)' : 'none'
         }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
               <span style={{ opacity: 0.8, width: '60px' }}>#{activeRank+1}</span>
               <span>{player.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               {!showNewRanks && player.scoreGained > 0 && (
                  <span style={{ fontSize: '1.5rem', color: '#4ade80', animation: 'slideUp 0.5s ease-out' }}>+{player.scoreGained}</span>
               )}
               <span style={{ minWidth: '90px', textAlign: 'right' }}>{displayScore}</span>
               {isFirst && <i className="ti ti-flame anim-flame" style={{ color: '#fbbf24', display: 'inline-block' }}></i>}
            </div>
         </div>
      </div>
   );
}

export default function AdminProjectorView() {
  const params = useParams();
  const router = useRouter();
  const pin = params.id;
  const [session, setSession] = useState(null);
  
  // Track to only award payout once
  const [payoutIssued, setPayoutIssued] = useState(false);
  const audioRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const [timeLeft, setTimeLeft] = useState(20);
  
  useEffect(() => {
    if (session?.status === 'active') {
      setTimeLeft(20);
      const interval = setInterval(() => {
         setTimeLeft(prev => {
            if (prev <= 1) {
               clearInterval(interval);
               return 0;
            }
            return prev - 1;
         });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session?.status, session?.currentQuestionIndex]);

  useEffect(() => {
     if (session?.status === 'active' && timeLeft === 0) {
        showLeaderboard();
     }
  }, [timeLeft, session?.status]);

  useEffect(() => {
    if(!pin) return;
    const unsubscribe = subscribeToSession(pin, (data) => {
      if(!data) {
         router.push('/admin'); // Session ended/deleted
      } else {
         setSession(data);
      }
    });
    return () => unsubscribe();
  }, [pin, router]);

  // Audio Playback handling for different stages
  useEffect(() => {
    if(!audioRef.current || !session || !session.bgMusic || session.bgMusic === 'none') return;
    const audio = audioRef.current;
    
    // Play audio when session starts or if waiting
    if(session.status === 'waiting' || session.status === 'active') {
       if(audio.paused) {
          audio.play().catch(e => console.log("Auto-play blocked by browser. User must interact first."));
       }
       if (session.status === 'active') {
          audio.playbackRate = 1.1; // Speed up music during gameplay!
       } else {
          audio.playbackRate = 1.0;
       }
    } else if (session.status === 'leaderboard' || session.status === 'finished') {
       // Pause or slow down
       audio.playbackRate = 0.8;
       if (session.status === 'finished') {
         setTimeout(() => { if(audio) audio.pause() }, 5000);
       }
    }
  }, [session]);

  const showLeaderboard = async () => {
    await updateSessionState(pin, { status: 'leaderboard' });
  };

  const answeredCount = Object.values(session?.participants || {}).filter(p => p.hasAnswered).length;
  const totalParticipants = Object.keys(session?.participants || {}).length;

  useEffect(() => {
     if (session?.status === 'active' && totalParticipants > 0 && answeredCount === totalParticipants) {
        showLeaderboard();
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status, answeredCount, totalParticipants]);

  const [showNewRanks, setShowNewRanks] = useState(false);
  const [podiumStep, setPodiumStep] = useState(0);
  const confettiCanvasRef = useRef(null);

  const fireConfetti = useCallback(() => {
     // Big burst from both sides
     const count = 200;
     const defaults = { origin: { y: 0.7 }, zIndex: 200 };
     function fire(particleRatio, opts) {
        confetti({ ...defaults, particleCount: Math.floor(count * particleRatio), ...opts });
     }
     fire(0.25, { spread: 26, startVelocity: 55 });
     fire(0.2, { spread: 60 });
     fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
     fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
     fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const fireFireworks = useCallback(() => {
     const duration = 5000;
     const animEnd = Date.now() + duration;
     const interval = setInterval(() => {
        const timeLeft = animEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ particleCount, startVelocity: 30, spread: 360, origin: { x: Math.random(), y: Math.random() * 0.4 }, zIndex: 200, colors: ['#fbbf24', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#ef4444'] });
     }, 250);
     return interval;
  }, []);

  useEffect(() => {
     if (session?.status === 'leaderboard') {
        setShowNewRanks(false);
        const timer = setTimeout(() => setShowNewRanks(true), 3000);
        return () => clearTimeout(timer);
     }
     if (session?.status === 'finished') {
        setPodiumStep(0);
        const t1 = setTimeout(() => { setPodiumStep(1); confetti({ particleCount: 40, spread: 50, origin: { x: 0.75, y: 0.6 }, colors: ['#c2410c','#fdb17c','#fed7aa'], zIndex: 200 }); }, 2500);
        const t2 = setTimeout(() => { setPodiumStep(2); confetti({ particleCount: 60, spread: 60, origin: { x: 0.25, y: 0.5 }, colors: ['#94a3b8','#cbd5e1','#e2e8f0'], zIndex: 200 }); }, 6000);
        const t3 = setTimeout(() => { setPodiumStep(3); fireConfetti(); }, 10000);
        let fireworksInterval;
        const t4 = setTimeout(() => { fireworksInterval = fireFireworks(); }, 11000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); if(fireworksInterval) clearInterval(fireworksInterval); };
     }
  }, [session?.status, fireConfetti, fireFireworks]);

  if(!session) {
    return <div style={{ display: 'flex', height: '80vh', justifyContent: 'center', alignItems: 'center' }}><h2>Loading...</h2></div>;
  }

  const handleStart = async () => {
    if(audioRef.current && session.bgMusic && session.bgMusic !== 'none') {
       audioRef.current.play().catch(e => console.warn("Audio play issue:", e));
    }
    const updates = { status: 'active', currentQuestionIndex: 0 };
    if (session.participants) {
      Object.keys(session.participants).forEach(uid => {
         updates[`participants/${uid}/hasAnswered`] = false;
      });
    }
    await updateSessionState(pin, updates);
  };

  const handleNext = async () => {
    const nextIdx = session.currentQuestionIndex + 1;
    if(nextIdx >= session.questions.length) {
      if (!payoutIssued) {
         setPayoutIssued(true);
         await awardSessionRewards(pin); // Final Base Completion Payout
      }
      await updateSessionState(pin, { status: 'finished' });
    } else {
      const updates = { status: 'active', currentQuestionIndex: nextIdx };
      if (session.participants) {
        Object.keys(session.participants).forEach(uid => {
           updates[`participants/${uid}/hasAnswered`] = false;
        });
      }
      await updateSessionState(pin, updates);
    }
  };


  
  const participants = Object.entries(session.participants || {}).map(([id, p]) => ({ id, ...p })).sort((a,b) => b.score - a.score);

  const sortedByLast = [...participants].sort((a,b) => (b.lastScore ?? b.score) - (a.lastScore ?? a.score));
  const sortedByCurrent = participants;

  const displayedPlayers = participants.filter(p => {
      return sortedByLast.indexOf(p) < 6 || sortedByCurrent.indexOf(p) < 6;
  });

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const musicPlaybackOptions = {
     none: '',
     lobby1: '/music/lobby1.mp3',
     lobby2: '/music/lobby2.mp3',
     lobby3: '/music/lobby3.mp3'
  };

  const shapeIcons = [
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40px', height: '40px' }}><polygon points="16,4 28,28 4,28"/></svg>, // Triangle
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40px', height: '40px', transform: 'rotate(45deg)' }}><rect x="6" y="6" width="20" height="20"/></svg>, // Diamond
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40px', height: '40px' }}><circle cx="16" cy="16" r="12"/></svg>, // Circle
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '40px', height: '40px' }}><rect x="6" y="6" width="20" height="20"/></svg> // Square
  ];

  const activeQuestion = session.status === 'active' ? session.questions[session.currentQuestionIndex] : null;
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 5rem', textAlign: 'center', overflow: 'hidden', ...getActiveBackgroundStyles(session.bgTheme) }}>
      
      {session.status !== 'active' && (
         <button 
           onClick={toggleFullscreen} 
           style={{ 
             position: 'absolute', top: '20px', right: '20px', zIndex: 100,
             background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', 
             padding: '10px', color: session.bgTheme && session.bgTheme !== 'default' && !session.bgTheme.startsWith('#') ? 'white' : '#333', 
             cursor: 'pointer', backdropFilter: 'blur(5px)', transition: 'background 0.2s'
           }}
           title="Toggle Fullscreen"
         >
           <i className={`ti ${isFullscreen ? 'ti-arrows-minimize' : 'ti-maximize'}`} style={{ fontSize: '1.5rem' }}></i>
         </button>
      )}

      {session.bgMusic && session.bgMusic !== 'none' && (
         <audio 
           ref={audioRef}
           src={musicPlaybackOptions[session.bgMusic] || ''} 
           loop 
         />
      )}

      {/* Global Projector CSS Animations text colors */}
      <style dangerouslySetInnerHTML={{__html: `
         @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } 100% { transform: translateY(0px) rotate(0deg); } }
         @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
         @keyframes slideUp { 0% { transform: translateY(100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
         @keyframes glowing { 0% { box-shadow: 0 0 10px var(--primary); } 50% { box-shadow: 0 4px 30px var(--primary); } 100% { box-shadow: 0 0 10px var(--primary); } }
         @keyframes bounceFlame { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-5px) scale(1.2); } }
         @keyframes pulseGlow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.15); } }
         @keyframes spotlightSweep { 0% { transform: rotate(-20deg); opacity: 0.15; } 50% { transform: rotate(20deg); opacity: 0.3; } 100% { transform: rotate(-20deg); opacity: 0.15; } }
         @keyframes spotlightSweep2 { 0% { transform: rotate(25deg); opacity: 0.1; } 50% { transform: rotate(-15deg); opacity: 0.25; } 100% { transform: rotate(25deg); opacity: 0.1; } }
         @keyframes starTwinkle { 0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(180deg); } }
         @keyframes drumRollPulse { 0%, 100% { transform: scaleY(1); opacity: 0.6; } 50% { transform: scaleY(1.08); opacity: 1; } }
         @keyframes revealGlow { 0% { box-shadow: 0 0 0px transparent; } 100% { box-shadow: 0 0 60px rgba(234, 179, 8, 0.8), 0 0 120px rgba(234, 179, 8, 0.4); } }
         @keyframes crownBounce { 0% { transform: translateY(0) scale(1) rotate(0deg); } 25% { transform: translateY(-15px) scale(1.2) rotate(-5deg); } 50% { transform: translateY(0) scale(1) rotate(0deg); } 75% { transform: translateY(-10px) scale(1.15) rotate(5deg); } 100% { transform: translateY(0) scale(1) rotate(0deg); } }
         @keyframes particleFloat1 { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.8; } 100% { transform: translateY(-100vh) translateX(50px) rotate(360deg); opacity: 0; } }
         @keyframes particleFloat2 { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.6; } 100% { transform: translateY(-100vh) translateX(-40px) rotate(-360deg); opacity: 0; } }
         @keyframes titleShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
         
         .anim-float { animation: float 4s ease-in-out infinite; }
         .anim-pop { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
         .anim-slide-up { animation: slideUp 0.6s ease-out both; }
         .anim-glow { animation: glowing 2s infinite; }
         .anim-flame { animation: bounceFlame 1s infinite alternate; }
         .anim-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
         .anim-spotlight { animation: spotlightSweep 6s ease-in-out infinite; }
         .anim-spotlight2 { animation: spotlightSweep2 8s ease-in-out infinite; }
         .anim-star { animation: starTwinkle 2s ease-in-out infinite; }
         .anim-drumroll { animation: drumRollPulse 0.3s ease-in-out infinite; }
         .anim-reveal-glow { animation: revealGlow 1s ease-out both; }
         .anim-crown { animation: crownBounce 2s ease-in-out infinite; }
         .anim-particle1 { animation: particleFloat1 4s ease-out infinite; }
         .anim-particle2 { animation: particleFloat2 5s ease-out infinite; }
         .anim-title-shimmer { background: linear-gradient(90deg, #fbbf24, #fef08a, #fbbf24, #f59e0b); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: titleShimmer 3s linear infinite; }
         
         .text-theme { color: ${session.bgTheme && session.bgTheme !== 'default' ? '#fff' : 'inherit'}; text-shadow: ${session.bgTheme && session.bgTheme !== 'default' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'} }
      `}} />

      {session.status === 'waiting' && (
        <div style={{ marginTop: '5vh' }} className="anim-slide-up">
          <h2 className="heading-xl text-theme" style={{ fontSize: '3rem' }}>Join the game at <span style={{ color: 'var(--primary)', textShadow: '0 2px 4px rgba(255,255,255,0.7)' }}>ecquiz.com</span></h2>
          <div className="text-theme" style={{ fontSize: '2rem', marginBottom: '1.5rem', opacity: 0.9 }}>Enter the Game PIN below:</div>
          
          <div className="anim-float anim-glow" style={{ 
            fontSize: '8rem', fontWeight: '900', letterSpacing: '15px', 
            background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            borderRadius: '24px', padding: '1rem 3rem', display: 'inline-block',
            border: '4px solid var(--primary)', boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)',
            backgroundColor: 'rgba(255,255,255,0.9)'
          }}>
            {pin}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '3rem auto', maxWidth: '800px', padding: '2rem', background: 'var(--bg-glass)', borderRadius: '24px', backdropFilter: 'blur(10px)', color: 'var(--text-main)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              <i className="ti ti-users" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
              Players joined: <span style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>{participants.length}</span>
            </div>
            <button className="btn-primary anim-pop" onClick={handleStart} style={{ padding: '1.5rem 4rem', fontSize: '1.5rem', transformOrigin: 'center' }}>
              Start Game <i className="ti ti-player-play-filled"></i>
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '3rem', justifyContent: 'center' }}>
            {participants.map((p, i) => (
              <div key={i} className="anim-pop" style={{ 
                padding: '1rem 2rem', background: 'rgba(224, 231, 255, 0.9)', color: '#3730a3',
                borderRadius: '50px', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #a5b4fc',
                animationDelay: `${i * 0.1}s`, backdropFilter: 'blur(5px)'
              }}>
                {p.name}
              </div>
            ))}
            {participants.length === 0 && <div className="anim-pop text-theme" style={{ fontSize: '1.5rem', opacity: 0.8 }}>Waiting for players...</div>}
          </div>
        </div>
      )}

      {session.status === 'active' && activeQuestion && (
        <div className="anim-pop" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', ...getActiveBackgroundStyles(session.bgTheme) }}>
          
          {/* Top Bar Area */}
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div style={{ width: '120px' }}></div> {/* Spacer for symmetry */}
             
             {/* Question Box */}
             <div style={{ background: 'white', padding: '15px 40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', maxWidth: '60vw', zIndex: 10 }}>
                <h2 style={{ color: 'black', fontSize: '2.5rem', fontWeight: '900', margin: 0, textAlign: 'center' }}>
                  {activeQuestion.text}
                </h2>
             </div>
             
             {/* Skip button */}
             <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
                <button onClick={showLeaderboard} style={{ background: 'white', border: 'none', borderRadius: '4px', padding: '12px 25px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', color: '#333' }}>
                   Skip
                </button>
             </div>
          </div>
          
          {/* Middle Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', minHeight: 0 }}>
             
             {/* Timer */}
             <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100px', height: '100px', background: '#3b2575', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3.5rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                   {timeLeft}
                </div>
             </div>
             
             {/* Media */}
             <div style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%', padding: '20px' }}>
                {activeQuestion.mediaUrl ? (
                   <img src={activeQuestion.mediaUrl} alt="Media" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', background: 'white', padding: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} />
                ) : (
                   <div style={{ width: '50vw', height: '40vh' }}></div> /* Placeholder if no media */
                )}
             </div>

             {/* Answers Count */}
             <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100px', height: '100px', background: '#3b2575', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3.5rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                   {answeredCount}
                </div>
                <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', marginTop: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Answers</div>
             </div>
          </div>
          
          {/* Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px 20px 45px 20px', height: '35vh' }}>
             {activeQuestion.options.map((opt, i) => (
                <div key={i} className="anim-pop" style={{ 
                  background: ['#e21b3c', '#1368ce', '#d89e00', '#26890c'][i],
                  borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 30px',
                  boxShadow: `0 6px 0 ${['#b3152f', '#0f52a3', '#ae8000', '#1f6e09'][i]}`,
                  animationDelay: `${i * 0.1}s`,
                  color: 'white', fontSize: '2.5rem', fontWeight: 'bold'
                }}>
                  <div style={{ flexShrink: 0, marginRight: '30px', transform: 'translateY(5px)' }}>
                     {shapeIcons[i]}
                  </div>
                  <div style={{ wordBreak: 'break-word', textAlign: 'left', lineHeight: '1.2' }}>
                     {opt}
                  </div>
                </div>
             ))}
          </div>

          {/* Bottom Black Bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', color: 'white', fontSize: '1rem', zIndex: 10 }}>
             <div style={{ fontWeight: 'bold' }}>{session.currentQuestionIndex + 1} / {session.questions.length}</div>
             <div style={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                <i className="ti ti-lock"></i> ecquiz.com &nbsp;&nbsp;&nbsp; Game PIN: <span style={{ fontSize: '1.2rem' }}>{pin}</span>
             </div>
             <div style={{ display: 'flex', gap: '25px' }}>
                <i className={`ti ${audioRef.current?.muted ? 'ti-volume-3' : 'ti-volume'}`} style={{ cursor: 'pointer', fontSize: '1.5rem' }} onClick={() => { if(audioRef.current) audioRef.current.muted = !audioRef.current.muted; }}></i>
                <i className="ti ti-settings" style={{ cursor: 'pointer', fontSize: '1.5rem' }}></i>
                <i className={`ti ${isFullscreen ? 'ti-arrows-minimize' : 'ti-maximize'}`} style={{ cursor: 'pointer', fontSize: '1.5rem' }} onClick={toggleFullscreen}></i>
             </div>
          </div>
        </div>
      )}

      {session.status === 'leaderboard' && (
        <div className="anim-slide-up" style={{ marginTop: '2vh' }}>
          <h2 className="heading-xl text-theme" style={{ fontSize: '3.5rem' }}>Top Players</h2>
          <div style={{ position: 'relative', height: '600px', maxWidth: '900px', margin: '3rem auto' }}>
            {displayedPlayers.map((p) => {
               const lastRank = sortedByLast.indexOf(p);
               const currentRank = sortedByCurrent.indexOf(p);
               const activeRank = showNewRanks ? currentRank : lastRank;

               return (
                  <AnimatedLeaderboardRow 
                     key={p.id} 
                     player={p} 
                     activeRank={activeRank} 
                     showNewRanks={showNewRanks}
                  />
               );
            })}
          </div>
          <button className="btn-primary anim-pop" onClick={handleNext} style={{ marginTop: '1rem', padding: '1.5rem 4rem', fontSize: '1.8rem', animationDelay: '4s' }}>
             {session.currentQuestionIndex >= session.questions.length - 1 ? 'End Game & Award Prizes' : 'Next Question'}
          </button>
        </div>
      )}

      {session.status === 'finished' && (
        <div className="anim-slide-up" style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, #1e3a8a 0%, #0f172a 60%, #030712 100%)', zIndex: 100, overflow: 'hidden' }}>
           
           {/* === SPOTLIGHT BEAMS === */}
           <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
              {/* Left Spotlight */}
              <div className="anim-spotlight" style={{ position: 'absolute', bottom: '0', left: '15%', width: '300px', height: '120vh', background: 'linear-gradient(0deg, rgba(234,179,8,0.15), transparent 70%)', transformOrigin: 'bottom center', filter: 'blur(15px)' }}></div>
              {/* Right Spotlight */}
              <div className="anim-spotlight2" style={{ position: 'absolute', bottom: '0', right: '15%', width: '300px', height: '120vh', background: 'linear-gradient(0deg, rgba(168,85,247,0.12), transparent 70%)', transformOrigin: 'bottom center', filter: 'blur(15px)' }}></div>
              {/* Center Spotlight – activates with 1st place */}
              {podiumStep >= 3 && (
                 <div className="anim-pop" style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '130vh', background: 'linear-gradient(0deg, rgba(234,179,8,0.25), transparent 60%)', filter: 'blur(20px)' }}></div>
              )}
           </div>

           {/* === FLOATING PARTICLES === */}
           <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
              {[...Array(12)].map((_, i) => (
                 <div key={i} className={i % 2 === 0 ? 'anim-particle1' : 'anim-particle2'} style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: `${5 + (i * 8)}%`,
                    width: `${4 + (i % 4) * 3}px`,
                    height: `${4 + (i % 4) * 3}px`,
                    borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
                    background: ['#fbbf24','#ec4899','#3b82f6','#10b981','#a855f7','#f97316'][i % 6],
                    opacity: 0.6,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${3 + (i % 3)}s`,
                    transform: i % 3 === 1 ? 'rotate(45deg)' : 'none',
                 }}></div>
              ))}
           </div>

           {/* === TWINKLING STARS === */}
           <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
              {[...Array(8)].map((_, i) => (
                 <div key={`star-${i}`} className="anim-star" style={{
                    position: 'absolute',
                    top: `${10 + (i * 10) % 60}%`,
                    left: `${5 + (i * 13) % 90}%`,
                    fontSize: `${0.6 + (i % 3) * 0.4}rem`,
                    color: ['#fbbf24','#e2e8f0','#93c5fd','#c084fc'][i % 4],
                    animationDelay: `${i * 0.7}s`,
                    animationDuration: `${2 + (i % 2)}s`,
                 }}>✦</div>
              ))}
           </div>

           {/* === TITLE === */}
           <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', paddingTop: '4vh' }}>
              {podiumStep < 3 ? (
                 <h2 className={`heading-xl anim-pop ${podiumStep === 0 ? 'anim-drumroll' : ''}`} style={{ fontSize: '4.5rem', marginBottom: '0', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.8)', letterSpacing: '3px' }}>
                    {podiumStep === 0 && 'And the winners are...'}
                    {podiumStep === 1 && '3rd Place Revealed!'}
                    {podiumStep === 2 && '2nd Place Revealed!'}
                 </h2>
              ) : (
                 <h2 className="heading-xl anim-pop anim-title-shimmer" style={{ fontSize: '5rem', marginBottom: '0', letterSpacing: '5px', fontWeight: '900' }}>
                    🏆 CHAMPION 🏆
                 </h2>
              )}
              {podiumStep === 0 && (
                 <p className="anim-slide-up" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', marginTop: '10px', fontWeight: 'bold', letterSpacing: '2px' }}>DRUM ROLL...</p>
              )}
           </div>
           
           {/* === PODIUM === */}
           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2.5rem', height: '55vh', marginTop: '2rem', position: 'relative', zIndex: 10, paddingBottom: '4vh' }}>
              
              {/* 2nd Place */}
              {participants[1] && (
                 <div className="anim-slide-up" style={{ width: '240px', height: '55%', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', animationDelay: '0.2s', overflow: 'visible',
                    background: podiumStep >= 2 ? 'linear-gradient(175deg, #e2e8f0, #94a3b8)' : 'linear-gradient(175deg, #334155, #1e293b)',
                    boxShadow: podiumStep >= 2 ? '0 0 40px rgba(148,163,184,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' : '0 0 20px rgba(0,0,0,0.4)',
                    borderTop: podiumStep >= 2 ? '3px solid rgba(255,255,255,0.5)' : '3px solid rgba(255,255,255,0.1)',
                    transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                 }}>
                    {podiumStep >= 2 ? (
                       <>
                          {/* Glow Ring */}
                          <div className="anim-pulse-glow" style={{ position: 'absolute', top: '-140px', width: '110px', height: '110px', borderRadius: '50%', border: '3px solid rgba(148,163,184,0.6)', background: 'radial-gradient(circle, rgba(148,163,184,0.15), transparent)' }}></div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '-130px', width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #64748b, #94a3b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>🥈</div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '-35px', fontSize: '2.2rem', fontWeight: '900', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.8)', animationDelay: '0.2s' }}>{participants[1].name}</div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '15px', fontSize: '1.2rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.4)', color: '#e2e8f0', padding: '4px 16px', borderRadius: '20px', backdropFilter: 'blur(5px)', animationDelay: '0.4s' }}>{participants[1].score} PTS</div>
                       </>
                    ) : (
                       <div className={`${podiumStep >= 1 ? 'anim-drumroll' : ''}`} style={{ position: 'absolute', top: '-100px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ti ti-question-mark" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }}></i>
                       </div>
                    )}
                    <div style={{ marginTop: 'auto', marginBottom: '2rem', fontSize: '5rem', fontWeight: '900', color: 'white', opacity: podiumStep >= 2 ? 0.8 : 0.15, transition: 'opacity 1s' }}>2</div>
                 </div>
              )}

              {/* 1st Place */}
              {participants[0] && (
                 <div className={`anim-slide-up ${podiumStep >= 3 ? 'anim-reveal-glow' : ''}`} style={{ width: '280px', height: '80%', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', animationDelay: '0.4s', overflow: 'visible',
                    background: podiumStep >= 3 ? 'linear-gradient(175deg, #fef9c3, #eab308, #ca8a04)' : 'linear-gradient(175deg, #334155, #1e293b)',
                    boxShadow: podiumStep >= 3 ? '0 -10px 60px rgba(234,179,8,0.5), 0 0 80px rgba(234,179,8,0.3), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 0 20px rgba(0,0,0,0.4)',
                    borderTop: podiumStep >= 3 ? '3px solid rgba(254,240,138,0.8)' : '3px solid rgba(255,255,255,0.1)',
                    transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                 }}>
                    {podiumStep >= 3 ? (
                       <>
                          {/* Crown */}
                          <div className="anim-crown" style={{ position: 'absolute', top: '-175px', fontSize: '5rem', zIndex: 25, filter: 'drop-shadow(0 4px 15px rgba(234,179,8,0.8))' }}>👑</div>
                          {/* Glow Ring */}
                          <div className="anim-pulse-glow" style={{ position: 'absolute', top: '-130px', width: '130px', height: '130px', borderRadius: '50%', border: '4px solid rgba(234,179,8,0.6)', background: 'radial-gradient(circle, rgba(234,179,8,0.2), transparent)' }}></div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '-120px', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #eab308)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', boxShadow: '0 10px 30px rgba(234,179,8,0.6)' }}>🥇</div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '-15px', fontSize: '3rem', fontWeight: '900', color: 'white', textShadow: '0 4px 15px rgba(0,0,0,0.8)', animationDelay: '0.3s' }}>{participants[0].name}</div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '35px', fontSize: '1.5rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', color: '#fef08a', padding: '6px 24px', borderRadius: '20px', backdropFilter: 'blur(5px)', animationDelay: '0.5s', letterSpacing: '1px' }}>{participants[0].score} PTS</div>
                       </>
                    ) : (
                       <div className={`${podiumStep >= 2 ? 'anim-drumroll' : ''}`} style={{ position: 'absolute', top: '-110px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '3px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ti ti-question-mark" style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.2)' }}></i>
                       </div>
                    )}
                    <div style={{ marginTop: 'auto', marginBottom: '3rem', fontSize: '7rem', fontWeight: '900', color: 'white', opacity: podiumStep >= 3 ? 0.85 : 0.1, transition: 'opacity 1.5s', textShadow: podiumStep >= 3 ? '0 4px 20px rgba(0,0,0,0.5)' : 'none' }}>1</div>
                 </div>
              )}

              {/* 3rd Place */}
              {participants[2] && (
                 <div className="anim-slide-up" style={{ width: '240px', height: '38%', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', animationDelay: '0.1s', overflow: 'visible',
                    background: podiumStep >= 1 ? 'linear-gradient(175deg, #fed7aa, #c2410c)' : 'linear-gradient(175deg, #334155, #1e293b)',
                    boxShadow: podiumStep >= 1 ? '0 0 30px rgba(194,65,12,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 0 20px rgba(0,0,0,0.4)',
                    borderTop: podiumStep >= 1 ? '3px solid rgba(253,177,124,0.6)' : '3px solid rgba(255,255,255,0.1)',
                    transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                 }}>
                    {podiumStep >= 1 ? (
                       <>
                          {/* Glow Ring */}
                          <div className="anim-pulse-glow" style={{ position: 'absolute', top: '-130px', width: '100px', height: '100px', borderRadius: '50%', border: '3px solid rgba(194,65,12,0.5)', background: 'radial-gradient(circle, rgba(194,65,12,0.1), transparent)' }}></div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '-120px', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #ea580c, #c2410c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>🥉</div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '-35px', fontSize: '2rem', fontWeight: '900', color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.8)', animationDelay: '0.2s' }}>{participants[2].name}</div>
                          <div className="anim-pop" style={{ position: 'absolute', top: '10px', fontSize: '1.1rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.4)', color: '#fed7aa', padding: '4px 14px', borderRadius: '20px', backdropFilter: 'blur(5px)', animationDelay: '0.4s' }}>{participants[2].score} PTS</div>
                       </>
                    ) : (
                       <div style={{ position: 'absolute', top: '-80px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ti ti-question-mark" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.3)' }}></i>
                       </div>
                    )}
                    <div style={{ marginTop: 'auto', marginBottom: '2rem', fontSize: '4rem', fontWeight: '900', color: 'white', opacity: podiumStep >= 1 ? 0.8 : 0.15, transition: 'opacity 1s' }}>3</div>
                 </div>
              )}
           </div>

           {/* === BOTTOM FLOOR LINE === */}
           <div style={{ position: 'absolute', bottom: '4vh', left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', zIndex: 10 }}></div>
           
           {/* === EXIT BUTTON === */}
           {podiumStep >= 3 && (
              <div style={{ position: 'absolute', bottom: '5vh', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
                 <button className="btn-primary anim-pop" onClick={() => router.push('/admin')} style={{ padding: '1rem 3rem', fontSize: '1.2rem', animationDelay: '2.5s', boxShadow: '0 8px 25px rgba(79,70,229,0.5)' }}>
                    Exit to Dashboard
                 </button>
              </div>
           )}
        </div>
      )}

    </div>
  );
}
