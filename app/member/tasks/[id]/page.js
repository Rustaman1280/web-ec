'use client';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getTaskById, claimTaskReward, getUserCompletedTasks } from '@/lib/economyUtils';

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, profile, loading: authLoading } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for hybrid submissions
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [essayTexts, setEssayTexts] = useState({});
  const [photoFiles, setPhotoFiles] = useState({});
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      const taskId = params.id;
      
      if (currentUser) {
        const completed = await getUserCompletedTasks(currentUser.uid);
        if (completed.includes(taskId)) {
          setResult({ passed: true, message: "You have already completed this task!" });
        }
      }

      const t = await getTaskById(taskId);
      if(t) setTask(t);
      setLoading(false);
    };

    if(!authLoading && currentUser) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchTask();    
    }
  }, [authLoading, currentUser, params.id]);

  const handleMcqSelect = (bIdx, oIdx) => setMcqAnswers({ ...mcqAnswers, [bIdx]: oIdx });
  const handleEssayChange = (bIdx, text) => setEssayTexts({ ...essayTexts, [bIdx]: text });
  
  const handlePhotoSelect = (bIdx, file) => {
    if(!file) {
      const copy = {...photoFiles}; delete copy[bIdx]; setPhotoFiles(copy);
    } else {
      setPhotoFiles({ ...photoFiles, [bIdx]: file });
    }
  };

  const submitCompoundTask = async () => {
    const blocks = task.blocks || task.questions || []; // fallback to questions for legacy
    
    // 1. Validation Pre-Check
    for (let i = 0; i < blocks.length; i++) {
       const b = blocks[i];
       const type = b.type || 'mcq';
       if (type === 'mcq' && mcqAnswers[i] === undefined) return toast.error(`Please answer Multiple Choice Question ${i+1}`);
       if (type === 'essay' && (!essayTexts[i] || essayTexts[i].trim().length < 10)) return toast.error(`Text for Block ${i+1} is too short or missing.`);
       if (type === 'photo' && !photoFiles[i]) return toast.error(`Please select an image for Block ${i+1}.`);
    }

    setSubmitting(true);
    let correctCount = 0;
    let totalMcq = 0;

    // 2. Grade MCQs early to fail fast before doing expensive uploads
    let mcqFailed = false;
    for (let i = 0; i < blocks.length; i++) {
       const b = blocks[i];
       const type = b.type || 'mcq';
       if (type === 'mcq') {
          totalMcq++;
          if (mcqAnswers[i] === b.correctIndex) {
            correctCount++;
          } else {
            mcqFailed = true;
          }
       }
    }

    if (totalMcq > 0 && mcqFailed) {
       setResult({ passed: false, message: `You scored ${correctCount}/${totalMcq} on the MCQs. You must get perfect scores on all multiple choices to pass.` });
       setSubmitting(false);
       return;
    }

    // 3. Process Uploads sequentially
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      
      for (const bIdx in photoFiles) {
         const file = photoFiles[bIdx];
         if (!cloudName || !uploadPreset) throw new Error("Cloudinary missing configuration.");
         const formData = new FormData();
         formData.append('file', file);
         formData.append('upload_preset', uploadPreset);
         const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
         if(!res.ok) throw new Error(`Upload failed for Block ${parseInt(bIdx) + 1}`);
      }
    } catch(err) {
      toast.error(err.message);
      setSubmitting(false);
      return;
    }
    
    // 4. Final Payout Sequence
    const success = await claimTaskReward(currentUser.uid, task.id, task.rewardPoints, task.rewardExp);
    if (success) {
      setResult({ passed: true, message: `Perfect Assignment! Auto-Graded 100%. You earned +${task.rewardPoints} Pts & +${task.rewardExp} EXP!` });
    } else {
      setResult({ passed: false, message: 'Reward failed to issue. Already claimed?' });
    }
    setSubmitting(false);
  };

  if (authLoading || loading) return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading Assignment...</div>;
  if (!task) return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Task not found or expired!</div>;

  const isExpired = task.deadline && Date.now() > task.deadline;
  const blocks = task.blocks || task.questions || []; // fallback array for backward compat

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <button onClick={() => router.push('/member/tasks')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="ti ti-arrow-left"></i> Back to Tasks
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-block', background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'capitalize' }}>
          Compound Assignment
        </div>
        <h2 className="heading-xl" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: isExpired ? 0.6 : 1, textDecoration: isExpired ? 'line-through' : 'none' }}>{task.title}</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Reward: {task.rewardPoints} Pts</span>
          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Reward: {task.rewardExp} EXP</span>
        </div>
      </div>

      {result && result.passed ? (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#ecfdf5', border: '2px solid #10b981' }}>
           <i className="ti ti-circle-check" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1rem' }}></i>
           <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '1rem', color: '#065f46' }}>Assignment Complete</h3>
           <p style={{ color: '#047857', fontSize: '1.1rem', marginBottom: '2rem' }}>{result.message}</p>
           <button onClick={() => router.push('/member/tasks')} className="btn-primary" style={{ padding: '12px 24px', background: '#10b981', border: 'none', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
              Return to Hub
           </button>
        </div>
      ) : isExpired ? (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#fef2f2', border: '2px solid #ef4444' }}>
           <i className="ti ti-clock-off" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1rem' }}></i>
           <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '1rem', color: '#991b1b' }}>Deadline Passed</h3>
           <p style={{ color: '#b91c1c', fontSize: '1.1rem' }}>You can no longer submit or claim this assignment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {result && !result.passed && (
             <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', border: '1px solid #fecaca', fontWeight: 'bold' }}>
               <i className="ti ti-alert-triangle" style={{ marginRight: '8px' }}></i> {result.message}
             </div>
           )}

           {blocks.map((b, bIdx) => {
             const type = b.type || 'mcq';
             
             return (
               <div key={bIdx} className="glass-panel" style={{ padding: '2rem', background: '#fff', borderTop: type === 'mcq' ? '4px solid #4f46e5' : type === 'essay' ? '4px solid #c026d3' : '4px solid #16a34a' }}>
                 
                 <div style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: type === 'mcq' ? '#4f46e5' : type === 'essay' ? '#c026d3' : '#16a34a', marginBottom: '0.5rem' }}>
                    Block {bIdx + 1}: {type === 'mcq' ? 'Multiple Choice' : type === 'essay' ? 'Written Response' : 'Photo Upload'}
                 </div>
                 
                 <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.5', fontWeight: 'bold' }}>
                   {b.text}
                 </h3>
                 
                 {/* Render MCQ Option */}
                 {type === 'mcq' && (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     {b.options.map((opt, oIdx) => {
                       const isSelected = mcqAnswers[bIdx] === oIdx;
                       return (
                         <div 
                           key={oIdx}
                           onClick={() => handleMcqSelect(bIdx, oIdx)}
                           style={{ 
                             padding: '12px 16px', borderRadius: '12px', border: `2px solid ${isSelected ? '#4f46e5' : 'var(--border-light)'}`,
                             background: isSelected ? '#eef2ff' : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                             display: 'flex', alignItems: 'center', gap: '12px'
                           }}
                         >
                           <div style={{ 
                             width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                             display: 'flex', justifyContent: 'center', alignItems: 'center'
                           }}>
                             {isSelected && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4f46e5' }}></div>}
                           </div>
                           <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? 'bold' : 'normal', color: 'var(--text-main)' }}>{opt}</span>
                         </div>
                       );
                     })}
                   </div>
                 )}

                 {/* Render Essay Area */}
                 {type === 'essay' && (
                    <textarea 
                       rows="6" 
                       value={essayTexts[bIdx] || ''}
                       onChange={e => handleEssayChange(bIdx, e.target.value)}
                       placeholder="Type your response here..."
                       style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '1rem', resize: 'vertical' }}
                    />
                 )}

                 {/* Render Photo File Input Area */}
                 {type === 'photo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                       <i className="ti ti-photo" style={{ fontSize: '3rem', color: '#16a34a' }}></i>
                       <input 
                         type="file" 
                         accept="image/*" 
                         onChange={e => handlePhotoSelect(bIdx, e.target.files[0])}
                         style={{ marginTop: '1rem' }}
                       />
                       {photoFiles[bIdx] && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ File prepared</span>}
                    </div>
                 )}

               </div>
             );
           })}

           <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button 
                onClick={submitCompoundTask} 
                disabled={submitting} 
                className="btn-primary" 
                style={{ padding: '14px 40px', fontSize: '1.2rem', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
                {submitting ? 'Uploading & Scoring...' : 'Submit Full Assignment'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
