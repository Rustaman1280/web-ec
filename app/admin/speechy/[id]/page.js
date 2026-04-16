'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToSession, updateSessionState, awardSessionRewards } from '@/lib/firebaseUtils';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import confetti from 'canvas-confetti';

export default function AdminSpeechyProjector() {
  const params = useParams();
  const router = useRouter();
  const pin = params.id;
  const [session, setSession] = useState(null);
  
  const [payoutIssued, setPayoutIssued] = useState(false);
  const audioRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if(!pin) return;
    const unsubscribe = subscribeToSession(pin, (data) => {
      if(!data) router.push('/admin'); 
      else setSession(data);
    });
    return () => unsubscribe();
  }, [pin, router]);

  useEffect(() => {
    if(!audioRef.current || !session || !session.bgMusic || session.bgMusic === 'none') return;
    const audio = audioRef.current;
    
    if(session.status === 'waiting' || session.status === 'active') {
       if(audio.paused) audio.play().catch(e => console.log("Auto-play blocked"));
       audio.playbackRate = session.status === 'active' ? 1.0 : 1.0;
    } else if (session.status === 'finished') {
       audio.playbackRate = 0.8;
       setTimeout(() => { if(audio) audio.pause() }, 5000);
    }
  }, [session]);

  const fireConfetti = useCallback(() => {
     confetti({ particleCount: 200, spread: 120, origin: { y: 0.7 }, zIndex: 9999, startVelocity: 45 });
  }, []);

  // Check if everyone has finished
  const totalParticipants = Object.keys(session?.participants || {}).length;
  const answeredCount = Object.values(session?.participants || {}).filter(p => p.hasAnswered).length;

  useEffect(() => {
     if (session?.status === 'active' && totalParticipants > 0 && answeredCount === totalParticipants) {
        handleEndGame();
     }
  }, [session?.status, answeredCount, totalParticipants]);

  const handleStart = async () => {
    if(audioRef.current && session.bgMusic && session.bgMusic !== 'none') {
       audioRef.current.play().catch(e => console.warn(e));
    }
    await updateSessionState(pin, { status: 'active', startTime: Date.now() });
  };

  const handleEndGame = async () => {
    await updateSessionState(pin, { status: 'finished' });
  };

  useEffect(() => {
     if (session?.status === 'finished' && !payoutIssued) {
        setPayoutIssued(true);
        fireConfetti();
        // Give base session rewards (defined in create session)
        awardSessionRewards(pin);
     }
  }, [session?.status, payoutIssued, pin, fireConfetti]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  if(!session) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' }}><h2>Loading Session...</h2></div>;
  }

  const participants = Object.entries(session.participants || {}).map(([id, p]) => ({ id, ...p }));
  const sortedParticipants = [...participants].sort((a,b) => {
      // higher accuracy first
      if (b.accuracy !== a.accuracy) return (b.accuracy || 0) - (a.accuracy || 0);
      // shorter time taken first if tie
      return (a.timeTakenMs || 9999999) - (b.timeTakenMs || 9999999);
  });

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 5rem', textAlign: 'center', overflow: 'hidden', background: '#0f172a', color: '#e2e8f0', position: 'relative' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
         @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
         @keyframes slideUp { 0% { transform: translateY(100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
         .anim-pop { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
         .anim-slide-up { animation: slideUp 0.4s ease-out forwards; }
      `}} />

      {session.status !== 'active' && (
         <button 
           onClick={toggleFullscreen} 
           style={{ 
             position: 'absolute', top: '20px', right: '20px', zIndex: 100,
             background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', 
             padding: '10px', color: 'white', cursor: 'pointer', backdropFilter: 'blur(5px)', transition: 'background 0.2s'
           }}
           title="Toggle Fullscreen"
         >
           <i className={`ti ${isFullscreen ? 'ti-arrows-minimize' : 'ti-maximize'}`} style={{ fontSize: '1.5rem' }}></i>
         </button>
      )}

      {session.bgMusic && session.bgMusic !== 'none' && (
         <audio ref={audioRef} src={`/music/${session.bgMusic}.mp3`} loop />
      )}

      {/* WAITING PHASE */}
      {session.status === 'waiting' && (
        <div style={{ marginTop: '5vh' }} className="anim-slide-up">
          <h2 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', margin: '0 0 1rem 0' }}>Join the Speechy Game!</h2>
          <div style={{ fontSize: '1.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>Enter Game PIN at your member dashboard</div>
          
          <div className="anim-pop" style={{ 
            fontSize: '8rem', fontWeight: '900', letterSpacing: '15px', 
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            borderRadius: '24px', padding: '1rem 3rem', display: 'inline-block',
            border: '4px solid #f59e0b', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            {pin}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '3rem auto', maxWidth: '800px', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              <i className="ti ti-users" style={{ color: '#3b82f6', marginRight: '10px' }}></i>
              Players joined: <span style={{ fontSize: '2.5rem', color: '#fbbf24' }}>{participants.length}</span>
            </div>
            <button className="anim-pop" onClick={handleStart} style={{ background: '#3b82f6', color: 'white', padding: '1.5rem 4rem', fontSize: '1.5rem', fontWeight: 'bold', border: 'none', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)' }}>
              Start Game <i className="ti ti-microphone"></i>
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '3rem', justifyContent: 'center' }}>
            {participants.map((p, i) => (
              <div key={i} className="anim-pop" style={{ 
                padding: '1rem 2rem', background: 'rgba(59, 130, 246, 0.2)', color: 'white',
                borderRadius: '50px', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid rgba(59, 130, 246, 0.5)',
                animationDelay: `${i * 0.1}s`
              }}>
                {p.name}
              </div>
            ))}
            {participants.length === 0 && <div className="anim-pop" style={{ fontSize: '1.5rem', opacity: 0.6 }}>Waiting for players...</div>}
          </div>
        </div>
      )}

      {/* ACTIVE PHASE */}
      {session.status === 'active' && (
        <div className="anim-pop" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
           <h2 style={{ fontSize: '1.8rem', color: '#94a3b8', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Read This Text</h2>
           
           <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '900px', margin: '0 auto', fontSize: '2.5rem', fontWeight: '900', lineHeight: '1.5', color: 'white' }}>
              {session.targetText}
           </div>

           <div style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', maxWidth: '1000px', margin: '3rem auto 0 auto' }}>
              {participants.map((p, i) => (
                 <div key={i} style={{ 
                    background: p.hasAnswered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
                    border: `2px solid ${p.hasAnswered ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                    padding: '10px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center'
                 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{p.name}</span>
                    <span style={{ fontSize: '0.9rem', color: p.hasAnswered ? '#10b981' : '#94a3b8' }}>
                       {p.hasAnswered ? `${Math.round(p.accuracy || 0)}% Accuracy` : 'Speaking...'}
                    </span>
                 </div>
              ))}
           </div>

           <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
              <button 
                 onClick={handleEndGame} 
                 style={{ background: '#ef4444', color: 'white', padding: '15px 40px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', opacity: 0.9 }}
              >
                 End Game Now
              </button>
           </div>
        </div>
      )}

      {/* FINISHED PHASE */}
      {session.status === 'finished' && (
        <div className="anim-slide-up" style={{ paddingBottom: '50px' }}>
           <h2 style={{ fontSize: '3rem', fontWeight: '900', color: '#fbbf24', textShadow: '0 2px 10px rgba(251,191,36,0.5)', margin: '0 0 2rem 0' }}>Speechy Results</h2>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '700px', margin: '0 auto' }}>
              {sortedParticipants.slice(0, 7).map((p, index) => (
                 <div key={p.id} className="anim-pop" style={{ 
                    background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)', 
                    border: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    padding: '1.5rem 2rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    animationDelay: `${index * 0.15}s`,
                    boxShadow: index === 0 ? '0 10px 30px rgba(245, 158, 11, 0.4)' : 'none'
                 }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                       <div style={{ fontSize: '2rem', fontWeight: '900', opacity: 0.8, color: index === 0 ? 'white' : '#94a3b8', width: '40px' }}>
                          #{index + 1}
                       </div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{p.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>
                          {Math.round(p.accuracy || 0)}%
                       </div>
                       <div style={{ fontSize: '0.9rem', color: index === 0 ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}>
                          {p.timeTakenMs ? (p.timeTakenMs / 1000).toFixed(1) + 's' : 'Did not finish'}
                       </div>
                    </div>
                 </div>
              ))}
              {sortedParticipants.length === 0 && <div style={{ color: '#94a3b8', fontSize: '1.5rem' }}>No data recorded.</div>}
           </div>

           <button onClick={() => router.push('/admin')} style={{ marginTop: '3rem', background: '#3b82f6', color: 'white', padding: '15px 40px', borderRadius: '30px', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>
               Back to Dashboard
           </button>
        </div>
      )}
    </div>
  );
}
