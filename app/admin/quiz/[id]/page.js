'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToSession, updateSessionState } from '@/lib/firebaseUtils';

export default function AdminProjectorView() {
  const params = useParams();
  const router = useRouter();
  const pin = params.id;
  const [session, setSession] = useState(null);

  useEffect(() => {
    if(!pin) return;
    const unsubscribe = subscribeToSession(pin, (data) => {
      if(!data) {
         router.push('/admin'); // Session ended
      } else {
         setSession(data);
      }
    });
    return () => unsubscribe();
  }, [pin, router]);

  if(!session) {
    return <div style={{ display: 'flex', height: '80vh', justifyContent: 'center', alignItems: 'center' }}><h2>Loading...</h2></div>;
  }

  const handleStart = async () => {
    await updateSessionState(pin, { status: 'active', currentQuestionIndex: 0 });
  };

  const handleNext = async () => {
    const nextIdx = session.currentQuestionIndex + 1;
    if(nextIdx >= session.questions.length) {
      await updateSessionState(pin, { status: 'finished' });
    } else {
      await updateSessionState(pin, { status: 'active', currentQuestionIndex: nextIdx });
      // Reset participant 'hasAnswered' state could be done here or handled by the member themselves
    }
  };

  const showLeaderboard = async () => {
    await updateSessionState(pin, { status: 'leaderboard' });
  };
  
  const handleEnd = async () => {
    await updateSessionState(pin, { status: 'finished' });
  };

  const participants = Object.values(session.participants || {}).sort((a,b) => b.score - a.score);

  return (
    <div style={{ padding: '2rem 5rem', textAlign: 'center' }}>
      
      {session.status === 'waiting' && (
        <div style={{ marginTop: '10vh' }}>
          <h2 className="heading-xl">Join at <span style={{ color: 'var(--primary)' }}>ecquiz.com</span></h2>
          <div style={{ fontSize: '2rem', marginBottom: '2rem' }}>With Game PIN</div>
          <div style={{ 
            fontSize: '8rem', 
            fontWeight: '900', 
            letterSpacing: '10px', 
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '2rem',
            display: 'inline-block'
          }}>
            {pin}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              Players: {participants.length}
            </div>
            <button className="btn-primary" onClick={handleStart} style={{ padding: '1.5rem 4rem', fontSize: '1.5rem' }}>
              Start Game
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '3rem', justifyContent: 'center' }}>
            {participants.map((p, i) => (
              <div key={i} style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {session.status === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
          <h2 className="heading-xl" style={{ fontSize: '4rem', marginTop: '2rem' }}>
            {session.questions[session.currentQuestionIndex].text}
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '2rem', 
            marginTop: 'auto',
            marginBottom: '3rem' 
          }}>
             {session.questions[session.currentQuestionIndex].options.map((opt, i) => (
                <div key={i} style={{ 
                  background: ['#e11d48', '#2563eb', '#d97706', '#16a34a'][i],
                  padding: '3rem', 
                  borderRadius: '16px',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {opt}
                </div>
             ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <button className="btn-primary" onClick={showLeaderboard}>Show Leaderboard</button>
          </div>
        </div>
      )}

      {session.status === 'leaderboard' && (
        <div style={{ marginTop: '5vh' }}>
          <h2 className="heading-xl">Leaderboard</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '3rem auto' }}>
            {participants.slice(0, 5).map((p, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', 
                padding: '1.5rem 3rem', background: i === 0 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                borderRadius: '16px', fontSize: '2rem', fontWeight: 'bold'
              }}>
                <span>{i+1}. {p.name}</span>
                <span>{p.score}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={handleNext} style={{ marginTop: '2rem', padding: '1rem 3rem', fontSize: '1.5rem' }}>
             {session.currentQuestionIndex >= session.questions.length - 1 ? 'End Game' : 'Next Question'}
          </button>
        </div>
      )}

      {session.status === 'finished' && (
        <div style={{ marginTop: '15vh' }}>
           <h2 className="heading-xl"><span className="text-gradient">Podium</span></h2>
           <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '2rem', height: '400px', marginTop: '3rem' }}>
              {participants[1] && (
                 <div style={{ width: '200px', height: '60%', background: 'silver', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '-3rem' }}>{participants[1].name}</div>
                    <div style={{ marginTop: '2rem', fontSize: '4rem', fontWeight: '900', opacity: 0.5 }}>2</div>
                 </div>
              )}
              {participants[0] && (
                 <div style={{ width: '220px', height: '80%', background: 'gold', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '-3rem' }}>{participants[0].name}</div>
                    <div style={{ marginTop: '2rem', fontSize: '5rem', fontWeight: '900', opacity: 0.5 }}>1</div>
                 </div>
              )}
              {participants[2] && (
                 <div style={{ width: '200px', height: '40%', background: '#cd7f32', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '-3rem' }}>{participants[2].name}</div>
                    <div style={{ marginTop: '2rem', fontSize: '4rem', fontWeight: '900', opacity: 0.5 }}>3</div>
                 </div>
              )}
           </div>
           
           <button className="btn-primary" onClick={() => router.push('/admin')} style={{ marginTop: '5rem' }}>Back to Dashboard</button>
        </div>
      )}

    </div>
  );
}
