'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { submitSpeechyAsync } from '@/lib/firebaseUtils';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

export default function MemberSpeechyGame() {
  const params = useParams();
  const router = useRouter();
  const bankId = params.id;
  const { profile } = useAuth();
  
  const [bank, setBank] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardMsg, setRewardMsg] = useState('');
  
  const recognitionRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if(!bankId || !profile) return;
    const fetchBank = async () => {
      const snap = await get(ref(database, `speechy_banks/${bankId}`));
      if(snap.exists()) setBank(snap.val());
      else router.push('/member/speechy');
    };
    fetchBank();
  }, [bankId, profile, router]);

  useEffect(() => {
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
     if (bank?.targetText) {
         const targetWords = bank.targetText.toLowerCase().replace(/[^\w\s\']|_/g, "").split(/\s+/).filter(w => w);
         const spokenTokens = transcript.toLowerCase().replace(/[^\w\s\']|_/g, "").split(/\s+/).filter(w => w);
         
         let currentMatchCount = 0;
         let spokenIndex = 0;
         
         for (let i = 0; i < targetWords.length; i++) {
             let found = false;
             while (spokenIndex < spokenTokens.length) {
                 if (spokenTokens[spokenIndex] === targetWords[i]) {
                     found = true;
                     spokenIndex++;
                     break;
                 }
                 spokenIndex++;
             }
             if (found) {
                 currentMatchCount++;
             } else {
                 break; // Stop matching further if current required word isn't found
             }
         }
         
         setMatchedCount(currentMatchCount);
         
         const newAccuracy = Math.min(100, Math.round((currentMatchCount / targetWords.length) * 100));
         setAccuracy(newAccuracy || 0);
         
         // Auto-finish if 100%
         if (newAccuracy === 100 && !hasFinished && !isSubmitting && isRecording) {
            finishSpeaking();
         }
     }
  }, [transcript, bank?.targetText, hasFinished, isSubmitting, isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRecording = () => {
     if (!recognitionRef.current) return;
     if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
     } else {
        if (startTimeRef.current === 0) startTimeRef.current = Date.now();
        setTranscript(''); 
        setAccuracy(0);
        setMatchedCount(0);
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
      setIsSubmitting(true);
      
      const timeTakenMs = Date.now() - startTimeRef.current;

      const result = await submitSpeechyAsync(
        bankId, 
        profile.id, 
        profile.name, 
        accuracy, 
        timeTakenMs, 
        bank.sessionPoints || 0, 
        bank.sessionExp || 0,
        bank.title,
        transcript
      );

      setHasFinished(true);
      setIsSubmitting(false);

      if (accuracy >= 80) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }

      if (result.isFirstTime) {
         setRewardMsg(`+${bank.sessionPoints} Coins & +${bank.sessionExp} EXP`);
      } else {
         setRewardMsg('Score updated! (Rewards only granted once)');
      }
  };

  if(!bank || !profile) return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>;

  // Render text with highlight matching
  const renderTargetText = () => {
     const tText = bank.targetText || '';
     let wordIndex = 0;
     
     return tText.split(/(\s+)/).map((wordChunk, idx) => {
        if (!wordChunk.trim()) return <span key={idx}>{wordChunk}</span>;
        
        const isMatched = wordIndex < matchedCount;
        const isCurrent = wordIndex === matchedCount;
        wordIndex++;
        
        return (
           <span key={idx} style={{ 
              color: isMatched ? '#10b981' : (isCurrent ? '#fbbf24' : 'inherit'),
              textDecoration: isCurrent ? 'underline' : 'none',
              transition: 'all 0.3s'
           }}>
              {wordChunk}
           </span>
        );
     });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#e2e8f0', fontFamily: '"Quicksand", sans-serif' }}>
       
       {/* Top Bar */}
       <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <button onClick={() => router.push('/member/speechy')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                <i className="ti ti-arrow-left"></i>
             </button>
             <span style={{ fontWeight: 'bold' }}>{bank.title}</span>
          </div>
          <div style={{ background: '#0f172a', padding: '5px 15px', borderRadius: '20px', border: '1px solid #334155', fontWeight: 'bold' }}>
             Accuracy: <span style={{ color: accuracy > 70 ? '#10b981' : '#fbbf24' }}>{accuracy}%</span>
          </div>
       </div>

       <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {!hasFinished && (
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
                      disabled={!speechApiSupported || isSubmitting}
                      style={{ 
                         background: isRecording ? '#ef4444' : (bank.color || '#3b82f6'), 
                         color: 'white', padding: '20px', borderRadius: '16px', fontSize: '1.4rem', fontWeight: 'bold', 
                         border: 'none', cursor: isSubmitting ? 'wait' : 'pointer', transition: 'all 0.3s'
                      }}>
                      <i className={`ti ${isRecording ? 'ti-player-stop' : 'ti-player-record'}`} style={{ marginRight: '10px' }}></i>
                      {isRecording ? 'Listening... Tap to Stop' : 'Tap to Start Speaking'}
                   </button>

                   {(transcript || accuracy > 0) && (
                      <button 
                         onClick={finishSpeaking} 
                         disabled={isSubmitting}
                         style={{ 
                            background: '#10b981', color: 'white', padding: '15px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', 
                            border: 'none', cursor: isSubmitting ? 'wait' : 'pointer'
                         }}>
                         {isSubmitting ? 'Evaluating...' : `Submit Result (${accuracy}%)`}
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

          {hasFinished && (
             <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{accuracy >= 80 ? '🏆' : '👍'}</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '1rem' }}>Great Effort!</h2>
                
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                   <div style={{ fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Accuracy</div>
                   <div style={{ fontSize: '4rem', fontWeight: '900', color: accuracy >= 80 ? '#10b981' : '#fbbf24' }}>{accuracy}%</div>
                </div>

                <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '30px' }}>
                   {rewardMsg}
                </div>

                <button onClick={() => router.push('/member/speechy')} style={{ width: '100%', background: 'var(--bg-glass)', border: '1px solid var(--border-light)', color: 'white', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                   Return to Speaking Lab
                </button>
                <button onClick={() => {
                   setHasFinished(false);
                   setTranscript('');
                   setAccuracy(0);
                   setMatchedCount(0);
                }} style={{ width: '100%', background: bank.color || '#3b82f6', color: 'white', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                   Try Again
                </button>
             </div>
          )}
       </div>
    </div>
  );
}
