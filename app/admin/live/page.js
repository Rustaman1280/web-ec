'use client';
import toast from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createQuizSession, getAllLiveQuizzes, createLiveQuizBank, deleteLiveQuizBank } from '@/lib/firebaseUtils';

export default function AdminLiveQuizzes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  
  const [quizzes, setQuizzes] = useState([]);
  
  // Create Form State
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6'); // default blue
  const [icon, setIcon] = useState('ti-device-gamepad'); // default icon
  const [sessionPoints, setSessionPoints] = useState('0');
  const [sessionExp, setSessionExp] = useState('0');
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuizzes = () => {
    setLoading(true);
    getAllLiveQuizzes().then(data => {
      setQuizzes(data.sort((a,b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Delete this Live Quiz Bank?")) {
      await deleteLiveQuizBank(id);
      fetchQuizzes();
    }
  };

  const handleCreateSession = async (quiz) => {
    setSessionLoading(true); setError(null);
    try {
      const pin = await createQuizSession(quiz.id, quiz.sessionPoints, quiz.sessionExp, quiz.questions);
      if(pin) router.push(`/admin/quiz/${pin}`);
      else setError('Failed to create session. Check rules/connection.');
    } catch (err) {
      console.error(err); setError('An error occurred starting the quiz.');
    }
    setSessionLoading(false);
  };

  // Question Builder Handlers
  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 20, rewardPoints: '50', rewardExp: '10' }]);
  };
  const handleRemoveQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));
  const setQuestionField = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };
  const setOptionText = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const handleCreateBank = async (e) => {
    e.preventDefault();
    if (questions.length === 0) return toast.error("Add at least 1 question.");
    
    // Validate empty fields
    for (let i = 0; i < questions.length; i++) {
        if(!questions[i].text) return toast.error(`Question ${i+1} missing text.`);
        for(let j=0; j<4; j++) {
          if(!questions[i].options[j]) return toast.error(`Question ${i+1} missing Option ${j+1}.`);
        }
    }

    setIsSubmitting(true);
    await createLiveQuizBank(title, description, color, icon, sessionPoints, sessionExp, questions);
    setTitle(''); setDescription(''); setSessionPoints('0'); setSessionExp('0'); setQuestions([]); setIsCreating(false);
    await fetchQuizzes();
    setIsSubmitting(false);
  };

  return (
    <div className="container" style={{ padding: '0.5rem 1.5rem', paddingLeft: '0' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
         <div>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Live Quizzes</h2>
           <p style={{ color: 'var(--text-muted)' }}>
             Select a Custom Question Bank to instantly launch a live projector session.
           </p>
         </div>
         <button className="btn-primary" onClick={() => setIsCreating(!isCreating)} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <i className={isCreating ? "ti ti-x" : "ti ti-plus"} style={{ fontSize: '1.2rem' }}></i> {isCreating ? 'Cancel Creation' : 'Create Custom Game'}
         </button>
       </div>

       {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
       {sessionLoading && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}><i className="ti ti-loader rotate"></i> Generating Live Session...</div>}

       {isCreating && (
         <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderTop: '4px solid var(--primary)', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Quiz Builder</h3>
            
            <form onSubmit={handleCreateBank} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Game Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Grammar War" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Description</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Short description of the quiz..." />
                  </div>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Theme Color</label>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: '45px', padding: '2px', cursor: 'pointer' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Icon Class (Tabler)</label>
                    <select value={icon} onChange={e => setIcon(e.target.value)} style={{ width: '100%', padding: '12px', background: 'white' }}>
                       <option value="ti-device-gamepad">Gamepad</option>
                       <option value="ti-abc">ABC</option>
                       <option value="ti-books">Books</option>
                       <option value="ti-world">World/Globe</option>
                       <option value="ti-brain">Brain</option>
                       <option value="ti-bolt">Lightning</option>
                    </select>
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary)' }}>Base Session Points (Prize for completing game)</label>
                    <input type="number" value={sessionPoints} onChange={e => setSessionPoints(e.target.value)} style={{ width: '100%', padding: '12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent)' }}>Base Session EXP (Prize for completing game)</label>
                    <input type="number" value={sessionExp} onChange={e => setSessionExp(e.target.value)} style={{ width: '100%', padding: '12px' }} />
                  </div>
               </div>

               <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Questions ({questions.length})</h4>
                      <button type="button" onClick={handleAddQuestion} style={{ background: '#e2e8f0', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>+ Add Question</button>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {questions.map((q, qIndex) => (
                        <div key={q.id} style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                             <strong style={{ color: 'var(--text-muted)' }}>Question {qIndex + 1}</strong>
                             <i className="ti ti-trash" style={{ color: '#ef4444', cursor: 'pointer', padding: '4px' }} onClick={() => handleRemoveQuestion(qIndex)}></i>
                          </div>
                          
                          <div style={{ marginBottom: '10px' }}>
                             <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Question Text</label>
                             <input type="text" placeholder="Enter question..." value={q.text} onChange={e => setQuestionField(qIndex, 'text', e.target.value)} required style={{ width: '100%', padding: '10px' }} />
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '10px', marginBottom: '10px' }}>
                             <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Time (s)</label>
                                <input type="number" placeholder="Time(s)" value={q.timeLimit} onChange={e => setQuestionField(qIndex, 'timeLimit', e.target.value)} min="5" required style={{ width: '100%' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>Pts per Correct</label>
                                <input type="number" placeholder="Pts" value={q.rewardPoints} onChange={e => setQuestionField(qIndex, 'rewardPoints', e.target.value)} min="0" required style={{ width: '100%' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>EXP per Correct</label>
                                <input type="number" placeholder="EXP" value={q.rewardExp} onChange={e => setQuestionField(qIndex, 'rewardExp', e.target.value)} min="0" required style={{ width: '100%' }} />
                             </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                             {q.options.map((opt, oIndex) => (
                                <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === oIndex} onChange={() => setQuestionField(qIndex, 'correctIndex', oIndex)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                  <input type="text" value={opt} onChange={e => setOptionText(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} style={{ padding: '8px', fontSize: '0.9rem' }} required />
                                </div>
                             ))}
                          </div>
                        </div>
                      ))}
                   </div>
               </div>

               <button type="submit" disabled={isSubmitting || questions.length === 0} className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem', marginTop: '1rem' }}>
                 {isSubmitting ? 'Saving Configuration...' : 'Save Live Quiz Bank'}
               </button>
            </form>
         </div>
       )}

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
         {loading ? (
           <div style={{ color: 'var(--text-muted)' }}>Loading custom quiz banks...</div>
         ) : quizzes.length === 0 ? (
           <div style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2rem', borderRadius: '12px', gridColumn: '1 / -1', textAlign: 'center' }}>
             No Live Quizzes configured. Click &quot;Create Custom Game&quot; to build one.
           </div>
         ) : quizzes.map((quiz) => (
           <div key={quiz.id} className="glass-panel" style={{ 
              padding: '2rem', 
              borderTop: `4px solid ${quiz.color}`,
              display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s', cursor: 'default',
              position: 'relative'
           }}
           onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
           >
             <button onClick={() => handleDelete(quiz.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }} title="Delete Quiz Bank">
               <i className="ti ti-trash"></i>
             </button>

             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
               <div style={{ 
                 width: '50px', height: '50px', borderRadius: '12px', background: `${quiz.color}20`, 
                 display: 'flex', justifyContent: 'center', alignItems: 'center', color: quiz.color
               }}>
                 <i className={`ti ${quiz.icon}`} style={{ fontSize: '1.8rem' }}></i>
               </div>
               <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{quiz.title}</h3>
             </div>
             
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '2rem' }}>
               {quiz.description}
             </p>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', background: '#cbd5e1', padding: '4px 10px', borderRadius: '20px' }}>
                 {quiz.questions?.length || 0} Questions
               </span>
               <button 
                 onClick={() => handleCreateSession(quiz)} 
                 disabled={sessionLoading || !quiz.questions?.length} 
                 style={{ 
                   background: quiz.color, color: 'white', padding: '10px 20px', 
                   borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: sessionLoading ? 'wait' : 'pointer',
                   boxShadow: `0 4px 14px ${quiz.color}40`, opacity: quiz.questions?.length ? 1 : 0.5
                 }}>
                 Host Game
               </button>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
}
