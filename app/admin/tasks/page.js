'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createTask, getAllTasks } from '@/lib/economyUtils';

export default function AdminTasksManager() {
  const router = useRouter();
  const { currentUser, profile, loading: authLoading } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Required');
  const [points, setPoints] = useState('100');
  const [exp, setExp] = useState('100');
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const data = await getAllTasks();
    setTasks(data);
    setLoading(false);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(!title) return;
    
    // Basic validation
    for (let i = 0; i < questions.length; i++) {
       if(!questions[i].text) return alert(`Question ${i+1} is missing text.`);
       for(let j=0; j<4; j++) {
         if(!questions[i].options[j]) return alert(`Question ${i+1} is missing Option ${j+1}.`);
       }
    }

    setIsSubmitting(true);
    await createTask(title, type, points, exp, questions);
    
    setTitle(''); setQuestions([]);
    await fetchTasks();
    setIsSubmitting(false);
  };

  if(authLoading || !profile) return <div style={{textAlign: 'center', marginTop: '30vh'}}>Authenticating...</div>;

  return (
    <div className="container" style={{ padding: '0.5rem 1.5rem', paddingLeft: '0' }}>
      <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>Task Manager</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 500px)', gap: '2rem', alignItems: 'start' }}>
        
        {/* Create Task Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Create Assessment Task</h2>
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Assignment Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Chapter 3: Grammar Exam" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Type</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="Required">Required</option>
                  <option value="Optional">Optional</option>
                  <option value="Practice">Practice</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Reward Pts</label>
                <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} min="0" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Reward EXP</label>
                <input type="number" value={exp} onChange={(e) => setExp(e.target.value)} min="0" required />
              </div>
            </div>

            <div style={{ borderTop: '2px dashed var(--border-light)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Questions ({questions.length})</h3>
                 <button type="button" onClick={handleAddQuestion} style={{ background: '#f1f5f9', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #cbd5e1', cursor: 'pointer' }}>+ Add Question</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {questions.map((q, qIndex) => (
                   <div key={q.id} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong style={{ color: 'var(--text-muted)' }}>Question {qIndex + 1}</strong>
                        <i className="ti ti-trash" style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => handleRemoveQuestion(qIndex)}></i>
                     </div>
                     <input type="text" placeholder="Enter your question here..." value={q.text} onChange={e => setQuestionField(qIndex, 'text', e.target.value)} style={{ marginBottom: '10px' }} required />
                     
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
                 {questions.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>No questions added yet. Click &quot;+ Add Question&quot; to begin.</div>}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting || questions.length === 0} style={{ marginTop: '1rem', padding: '16px', fontSize: '1.1rem' }}>
              {isSubmitting ? 'Publishing Task...' : 'Publish Assessment'}
            </button>
          </form>
        </div>

        {/* Existing Tasks List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Published Tasks</h2>
          {loading ? (
             <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
             <p style={{ color: 'var(--text-muted)' }}>No tasks have been created yet.</p>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', border: '1px solid var(--border-light)', borderRadius: '12px', background: '#f8fafc' }}>
                    <div>
                      <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{t.title}</h4>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                         <span>{t.type}</span> • <span>{t.questions?.length || 0} Questions</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{t.rewardPoints} Pts</div>
                      <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{t.rewardExp} EXP</div>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
