'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToSession } from '@/lib/firebaseUtils';
import { database } from '@/lib/firebase';
import { ref, update, get } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';

export default function MemberSpeechy() {
  const params = useParams();
  const router = useRouter();
  const pin = params.id;
  const { profile } = useAuth();
  
  const [session, setSession] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if(!pin || !profile) return;
    const unsubscribe = subscribeToSession(pin, (data) => {
      if(!data) router.push('/member');
      else setSession(data);
    });
    return () => unsubscribe();
  }, [pin, profile, router]);

  useEffect(() => {
     // Check browser support
     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     if (!SpeechRecognition) {
        setSpeechApiSupported(false);
     } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
           let currentTranscript = '';
           for (let i = event.resultIndex; i < event.results.length; ++i) {
              currentTranscript += event.results[i][0].transcript;
           }
           setTranscript(prev => prev + " " + currentTranscript);
        };
        
        recognition.onerror = (event) => {
           console.error("Speech Recognition Error:", event.error);
           setIsRecording(false);
        };
        
        recognition.onend = () => {
           setIsRecording(false);
        };

        recognitionRef.current = recognition;
     }

     return () => {
        if (recognitionRef.current) {
           recognitionRef.current.stop();
        }
     };
  }, []);

  // Compute accuracy real-time
  useEffect(() => {
     if (session?.status === 'active' && session?.targetText) {
         const targetWords = session.targetText.toLowerCase().replace(/[^\w\s\']|_/g, "").split(/\s+/).filter(w => w);
         const spokenWords = transcript.toLowerCase().replace(/[^\w\s\']|_/g, "").split(/\s+/).filter(w => w);
         
         let matches = 0;
         targetWords.forEach(tw => {
            if (spokenWords.includes(tw)) matches++;
         });
         
         const newAccuracy = Math.min(100, Math.round((matches / targetWords.length) * 100));
         setAccuracy(newAccuracy || 0);
     }
  }, [transcript, session?.targetText, session?.status]);

  const toggleRecording = () => {
     if (!recognitionRef.current) return;
     if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
     } else {
        if (startTimeRef.current === 0) startTimeRef.current = Date.now();
        setTranscript(''); // reset on new recording start or keep it? Let's reset for fresh tries
        try {
           recognitionRef.current.start();
           setIsRecording(true);
        } catch (e) {
           console.log("Already started");
        }
     }
  };

  const finishSpeaking = async () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      
      const timeTakenMs = Date.now() - startTimeRef.current;
      setHasFinished(true);

      if (profile && pin) {
          const playerRef = ref(database, `sessions/${pin}/participants/${profile.id}`);
          const snap = await get(playerRef);
          if (snap.exists()) {
             await update(playerRef, {
                hasAnswered: true,
                accuracy: accuracy,
                score: accuracy, // Needed for simple fallback sorting in history
                timeTakenMs: timeTakenMs,
                finalTranscript: transcript
             });
          }
      }
  };

  if(!session || !profile) return <div style={{ minHeight: '100vh', background: '#0f172a' }}></div>;

  // Render text with highlight matching
  const renderTargetText = () => {
     const tText = session.targetText || '';
     const spokenWords = transcript.toLowerCase().replace(/[^\w\s\']|_/g, "").split(/\s+/).filter(w => w);
     
     return tText.split(/(\s+)/).map((wordChunk, idx) => {
        if (!wordChunk.trim()) return <span key={idx}>{wordChunk}</span>;
        
        const cleanWord = wordChunk.toLowerCase().replace(/[^\w\s\']|_/g, "");
        const isMatched = spokenWords.includes(cleanWord);
        
        return (
           <span key={idx} style={{ 
              color: isMatched ? '#10b981' : 'inherit',
              transition: 'color 0.3s'
           }}>
              {wordChunk}
           </span>
        );
     });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#e2e8f0', fontFamily: '"Quicksand", sans-serif' }}>
       
       {/* Top Bar */}
       {session.status === 'active' && (
          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderBottom: '1px solid #334155' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ti ti-microphone" style={{ color: '#3b82f6', fontSize: '1.5rem' }}></i>
                <span style={{ fontWeight: 'bold' }}>Speechy</span>
             </div>
             <div style={{ background: '#0f172a', padding: '5px 15px', borderRadius: '20px', border: '1px solid #334155', fontWeight: 'bold' }}>
                Accuracy: <span style={{ color: accuracy > 70 ? '#10b981' : '#fbbf24' }}>{accuracy}%</span>
             </div>
          </div>
       )}

       <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {session.status === 'waiting' && (
             <div style={{ textAlign: 'center' }}>
                <div style={{ width: '120px', height: '120px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)' }}>
                   <i className="ti ti-microphone-2" style={{ fontSize: '4rem', color: 'white' }}></i>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '10px' }}>Get Ready!</h2>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Look at the projector. Read the text clearly into your microphone when the game starts.</p>
             </div>
          )}

          {session.status === 'active' && !hasFinished && (
             <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {!speechApiSupported && (
                   <div style={{ background: '#ef4444', color: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                      Your browser does not support the microphone speech test. Please use Chrome or Safari!
                   </div>
                )}

                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', fontSize: '1.6rem', lineHeight: '1.6', fontWeight: '700', marginBottom: '30px', flex: 1, overflowY: 'auto' }}>
                   {renderTargetText()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                   <button 
                      onClick={toggleRecording} 
                      disabled={!speechApiSupported}
                      style={{ 
                         background: isRecording ? '#ef4444' : '#3b82f6', 
                         color: 'white', padding: '20px', borderRadius: '16px', fontSize: '1.4rem', fontWeight: 'bold', 
                         border: 'none', cursor: 'pointer', boxShadow: `0 8px 25px ${isRecording ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                         display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: 'all 0.3s'
                      }}>
                      <i className={`ti ${isRecording ? 'ti-player-stop' : 'ti-player-record'}`}></i>
                      {isRecording ? 'Listening... Tap to Pause' : 'Tap to Start Speaking'}
                   </button>

                   {(transcript || accuracy > 0) && (
                      <button 
                         onClick={finishSpeaking} 
                         style={{ 
                            background: '#10b981', color: 'white', padding: '15px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', 
                            border: 'none', cursor: 'pointer'
                         }}>
                         Submit Result ({accuracy}%)
                      </button>
                   )}
                </div>

                {transcript && (
                   <div style={{ padding: '15px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '1rem', color: '#94a3b8', fontStyle: 'italic', maxHeight: '100px', overflowY: 'auto' }}>
                      "{transcript}"
                   </div>
                )}
             </div>
          )}

          {session.status === 'active' && hasFinished && (
             <div style={{ textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                   <i className="ti ti-check" style={{ fontSize: '3rem', color: 'white' }}></i>
                </div>
                <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '10px' }}>Submitted!</h2>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Look at the projector for the results.</p>
             </div>
          )}

          {session.status === 'finished' && (
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '1rem' }}>Game Over!</h2>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', display: 'inline-block' }}>
                   <div style={{ fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Accuracy</div>
                   <div style={{ fontSize: '4rem', fontWeight: '900', color: '#fbbf24' }}>{session.participants?.[profile.id]?.accuracy || 0}%</div>
                </div>
                <button onClick={() => router.push('/member')} style={{ marginTop: '2rem', background: '#3b82f6', color: 'white', padding: '15px 40px', borderRadius: '30px', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>
                   Back Home
                </button>
             </div>
          )}
       </div>
    </div>
  );
}
