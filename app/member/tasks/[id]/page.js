'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getTaskById, claimTaskReward, getUserCompletedTasks } from '@/lib/economyUtils';

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, profile, loading: authLoading } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { passed: boolean, message: string }

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      const taskId = params.id;
      
      // Check if already completed to prevent re-entry
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
      // eslint-disable-next-line
      fetchTask();    
    }
  }, [authLoading, currentUser, params.id]);

  const handleSelect = (qIdx, oIdx) => {
    setAnswers({ ...answers, [qIdx]: oIdx });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < task.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    let correctCount = 0;
    
    // Auto-Grade
    task.questions.forEach((q, idx) => {
       if (answers[idx] === q.correctIndex) {
         correctCount++;
       }
    });

    const passThreshold = task.questions.length; // strict pass (must get 100%)
    if (correctCount >= passThreshold) {
       // Payout
       const success = await claimTaskReward(currentUser.uid, task.id, task.rewardPoints, task.rewardExp);
       if (success) {
         setResult({ passed: true, message: `Perfect! You earned +${task.rewardPoints} Pts & +${task.rewardExp} EXP!` });
       } else {
         setResult({ passed: false, message: 'Reward failed to issue. Already claimed?' });
       }
    } else {
       setResult({ passed: false, message: `You scored ${correctCount}/${task.questions.length}. You need a perfect score to claim the reward. Try again!` });
    }
    setSubmitting(false);
  };

  if (authLoading || loading) return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading Assignment...</div>;
  if (!task) return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Task not found!</div>;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <button onClick={() => router.push('/member/tasks')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="ti ti-arrow-left"></i> Back to Tasks
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-block', background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>
          {task.type} Assessment
        </div>
        <h2 className="heading-xl" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{task.title}</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Reward: {task.rewardPoints} Pts</span>
          <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Reward: {task.rewardExp} EXP</span>
        </div>
      </div>

      {result && result.passed ? (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', border: '2px solid #10b981' }}>
           <i className="ti ti-circle-check" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1rem' }}></i>
           <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '1rem', color: '#10b981' }}>Assignment Complete</h3>
           <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>{result.message}</p>
           <button onClick={() => router.push('/member/tasks')} className="btn-primary" style={{ padding: '12px 24px', background: '#10b981', border: 'none' }}>
              Return to Hub
           </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           {result && !result.passed && (
             <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', border: '1px solid #fecaca', fontWeight: 'bold' }}>
               <i className="ti ti-alert-triangle" style={{ marginRight: '8px' }}></i> {result.message}
             </div>
           )}

           {task.questions.map((q, qIdx) => (
             <div key={qIdx} className="glass-panel" style={{ padding: '1.5rem', background: '#fff' }}>
               <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                 <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginRight: '8px' }}>{qIdx + 1}.</span> 
                 {q.text}
               </h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {q.options.map((opt, oIdx) => {
                   const isSelected = answers[qIdx] === oIdx;
                   return (
                     <div 
                       key={oIdx}
                       onClick={() => handleSelect(qIdx, oIdx)}
                       style={{ 
                         padding: '12px 16px', borderRadius: '12px', border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                         background: isSelected ? 'var(--bg-surface)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                         display: 'flex', alignItems: 'center', gap: '12px'
                       }}
                     >
                       <div style={{ 
                         width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--primary)' : '#cbd5e1'}`,
                         display: 'flex', justifyContent: 'center', alignItems: 'center'
                       }}>
                         {isSelected && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                       </div>
                       <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? 'bold' : 'normal', color: 'var(--text-main)' }}>{opt}</span>
                     </div>
                   );
                 })}
               </div>
             </div>
           ))}

           <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Attempt: {Object.keys(answers).length} / {task.questions.length} Answered</span>
              <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="btn-primary" 
                style={{ padding: '14px 32px', fontSize: '1.1rem', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Grading...' : 'Submit Answers'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
