'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToSession, updateSessionState, awardSessionRewards } from '@/lib/firebaseUtils';

export default function AdminProjectorView() {
  const params = useParams();
  const router = useRouter();
  const pin = params.id;
  const [session, setSession] = useState(null);
  
  // Track to only award payout once
  const [payoutIssued, setPayoutIssued] = useState(false);
  const audioRef = useRef(null);

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
    if(!audioRef.current || !session) return;
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
         // Optionally change track, but let's just fade it out
         setTimeout(() => { if(audio) audio.pause() }, 5000);
       }
    }
  }, [session]);

  if(!session) {
    return <div style={{ display: 'flex', height: '80vh', justifyContent: 'center', alignItems: 'center' }}><h2>Loading...</h2></div>;
  }

  const handleStart = async () => {
    if(audioRef.current) audioRef.current.play(); // Force play if blocked earlier
    await updateSessionState(pin, { status: 'active', currentQuestionIndex: 0 });
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
      await updateSessionState(pin, { status: 'active', currentQuestionIndex: nextIdx });
    }
  };

  const showLeaderboard = async () => {
    await updateSessionState(pin, { status: 'leaderboard' });
  };
  
  const participants = Object.values(session.participants || {}).sort((a,b) => b.score - a.score);

  return (
    <div style={{ padding: '2rem 5rem', textAlign: 'center', overflow: 'hidden' }}>
      
      {/* Background Music Loop - Royalty free upbeat music */}
      <audio 
        ref={audioRef}
        src="https://cdn.pixabay.com/download/audio/2022/10/16/audio_03d9202111.mp3" 
        loop 
      />

      {/* Global Projector CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
         @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } 100% { transform: translateY(0px) rotate(0deg); } }
         @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
         @keyframes slideUp { 0% { transform: translateY(100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
         @keyframes glowing { 0% { box-shadow: 0 0 10px var(--primary); } 50% { box-shadow: 0 4px 30px var(--primary); } 100% { box-shadow: 0 0 10px var(--primary); } }
         
         .anim-float { animation: float 4s ease-in-out infinite; }
         .anim-pop { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
         .anim-slide-up { animation: slideUp 0.6s ease-out forwards; }
         .anim-glow { animation: glowing 2s infinite; }
      `}} />

      {session.status === 'waiting' && (
        <div style={{ marginTop: '5vh' }} className="anim-slide-up">
          <h2 className="heading-xl" style={{ fontSize: '3rem' }}>Join the game at <span style={{ color: 'var(--primary)' }}>ecquiz.com</span></h2>
          <div style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Enter the Game PIN below:</div>
          
          <div className="anim-float anim-glow" style={{ 
            fontSize: '8rem', fontWeight: '900', letterSpacing: '15px', 
            background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            borderRadius: '24px', padding: '1rem 3rem', display: 'inline-block',
            border: '4px solid var(--primary)', boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)'
          }}>
            {pin}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '3rem auto', maxWidth: '800px', padding: '2rem', background: 'var(--bg-glass)', borderRadius: '24px' }}>
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
                padding: '1rem 2rem', background: '#e0e7ff', color: '#3730a3',
                borderRadius: '50px', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid #a5b4fc',
                animationDelay: `${i * 0.1}s`
              }}>
                {p.name}
              </div>
            ))}
            {participants.length === 0 && <div className="anim-pop" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Waiting for players...</div>}
          </div>
        </div>
      )}

      {session.status === 'active' && (
        <div className="anim-pop" style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
          
          <div style={{ background: 'var(--bg-glass)', padding: '2rem', borderRadius: '24px', marginBottom: '2rem', borderBottom: '6px solid var(--primary)' }}>
             <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '2px' }}>
                Question {session.currentQuestionIndex + 1} of {session.questions.length}
             </div>
             <h2 className="heading-xl" style={{ fontSize: '3.5rem', lineHeight: '1.2' }}>
               {session.questions[session.currentQuestionIndex].text}
             </h2>
          </div>
          
          <div style={{ 
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', 
            marginTop: 'auto', marginBottom: '2rem' 
          }}>
             {session.questions[session.currentQuestionIndex].options.map((opt, i) => (
                <div key={i} className="anim-pop" style={{ 
                  background: ['#e11d48', '#2563eb', '#d97706', '#16a34a'][i],
                  padding: '2.5rem', borderRadius: '16px', fontSize: '2.3rem', fontWeight: 'bold', color: 'white',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animationDelay: `${i * 0.1}s`
                }}>
                  {opt}
                </div>
             ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <button className="btn-primary" onClick={showLeaderboard} style={{ fontSize: '1.2rem', padding: '15px 30px' }}>
                Show Leaderboard
             </button>
          </div>
        </div>
      )}

      {session.status === 'leaderboard' && (
        <div className="anim-slide-up" style={{ marginTop: '2vh' }}>
          <h2 className="heading-xl" style={{ fontSize: '3.5rem' }}>Top Players</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '3rem auto' }}>
            {participants.slice(0, 5).map((p, i) => (
              <div key={i} className="anim-pop" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.5rem 3rem', background: i === 0 ? 'var(--gradient-primary)' : 'var(--bg-glass)', color: i === 0 ? 'white' : 'inherit',
                borderRadius: '16px', fontSize: '2.2rem', fontWeight: 'bold', border: i === 0 ? 'none' : '2px solid var(--border-light)',
                animationDelay: `${i * 0.1}s`, transform: i===0 ? 'scale(1.05)' : 'none'
              }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                   <span style={{ opacity: 0.8 }}>#{i+1}</span>
                   <span>{p.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                   <span>{p.score}</span>
                   {i === 0 && <i className="ti ti-flame" style={{ color: '#fbbf24' }}></i>}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary anim-pop" onClick={handleNext} style={{ marginTop: '1rem', padding: '1.5rem 4rem', fontSize: '1.8rem', animationDelay: '0.8s' }}>
             {session.currentQuestionIndex >= session.questions.length - 1 ? 'End Game & Award Prizes' : 'Next Question'}
          </button>
        </div>
      )}

      {session.status === 'finished' && (
        <div className="anim-slide-up" style={{ marginTop: '10vh' }}>
           <h2 className="heading-xl" style={{ fontSize: '4rem', marginBottom: '2rem' }}>
              <span className="text-gradient">Final Podium</span>
           </h2>
           
           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2rem', height: '400px', marginTop: '4rem' }}>
              {/* 2nd Place */}
              {participants[1] && (
                 <div className="anim-slide-up" style={{ width: '220px', height: '60%', background: 'linear-gradient(145deg, #e2e8f0, #94a3b8)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', animationDelay: '0.4s' }}>
                    <div className="anim-pop" style={{ position: 'absolute', top: '-60px', fontSize: '2.5rem', fontWeight: 'bold', animationDelay: '1.2s' }}>{participants[1].name}</div>
                    <div style={{ position: 'absolute', top: '-100px', fontSize: '1.5rem', fontWeight: 'bold', background: 'var(--bg-dark)', padding: '4px 12px', borderRadius: '12px' }}>{participants[1].score}</div>
                    <div style={{ marginTop: 'auto', marginBottom: '2rem', fontSize: '5rem', fontWeight: '900', color: 'white', opacity: 0.7 }}>2</div>
                 </div>
              )}
              {/* 1st Place */}
              {participants[0] && (
                 <div className="anim-slide-up" style={{ width: '250px', height: '85%', background: 'linear-gradient(145deg, #fef08a, #eab308)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', boxShadow: '0 -10px 40px rgba(234, 179, 8, 0.4)', animationDelay: '0.8s' }}>
                    <i className="ti ti-crown anim-pop" style={{ position: 'absolute', top: '-120px', fontSize: '4rem', color: '#eab308', animationDelay: '1.8s' }}></i>
                    <div className="anim-pop" style={{ position: 'absolute', top: '-70px', fontSize: '3rem', fontWeight: '900', animationDelay: '1.8s' }}>{participants[0].name}</div>
                    <div style={{ position: 'absolute', top: '-150px', fontSize: '1.8rem', fontWeight: 'bold', background: 'var(--bg-dark)', padding: '4px 12px', borderRadius: '12px' }}>{participants[0].score}</div>
                    <div style={{ marginTop: 'auto', marginBottom: '3rem', fontSize: '7rem', fontWeight: '900', color: 'white', opacity: 0.8 }}>1</div>
                 </div>
              )}
              {/* 3rd Place */}
              {participants[2] && (
                 <div className="anim-slide-up" style={{ width: '220px', height: '40%', background: 'linear-gradient(145deg, #fdb17c, #c2410c)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', animationDelay: '0.2s' }}>
                    <div className="anim-pop" style={{ position: 'absolute', top: '-60px', fontSize: '2.5rem', fontWeight: 'bold', animationDelay: '1.0s' }}>{participants[2].name}</div>
                    <div style={{ position: 'absolute', top: '-100px', fontSize: '1.5rem', fontWeight: 'bold', background: 'var(--bg-dark)', padding: '4px 12px', borderRadius: '12px' }}>{participants[2].score}</div>
                    <div style={{ marginTop: 'auto', marginBottom: '2rem', fontSize: '4rem', fontWeight: '900', color: 'white', opacity: 0.7 }}>3</div>
                 </div>
              )}
           </div>
           
           <button className="btn-primary anim-pop" onClick={() => router.push('/admin')} style={{ marginTop: '6rem', padding: '1rem 3rem', fontSize: '1.2rem', animationDelay: '2.5s' }}>Exit to Dashboard</button>
        </div>
      )}

    </div>
  );
}
