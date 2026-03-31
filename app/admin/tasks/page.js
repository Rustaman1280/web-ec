'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createTask, getAllTasks, deleteTask } from '@/lib/economyUtils';

export default function AdminTasksManager() {
  const router = useRouter();
  const { currentUser, profile, loading: authLoading } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Required');
  const [points, setPoints] = useState('100');
  const [exp, setExp] = useState('100');
  const [deadlineDate, setDeadlineDate] = useState(''); // YYYY-MM-DD
  const [blocks, setBlocks] = useState([]); // { id, type: 'mcq' | 'essay' | 'photo', text: string, options?: string[], correctIndex?: number }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const data = await getAllTasks();
    // sort by newest
    setTasks(data.sort((a,b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  const handleDeleteTask = async (id) => {
    if(confirm("Are you sure you want to delete this task?")) {
       await deleteTask(id);
       fetchTasks();
    }
  };

  // Block Builder Handlers
  const handleAddBlock = (type) => {
    const newBlock = { id: Date.now().toString(), type, text: '' };
    if (type === 'mcq') {
       newBlock.options = ['', '', '', ''];
       newBlock.correctIndex = 0;
    }
    setBlocks([...blocks, newBlock]);
  };

  const handleRemoveBlock = (idx) => {
    setBlocks(blocks.filter((_, i) => i !== idx));
  };

  const setBlockField = (idx, field, value) => {
    const updated = [...blocks];
    updated[idx][field] = value;
    setBlocks(updated);
  };

  const setOptionText = (bIdx, optIdx, value) => {
    const updated = [...blocks];
    updated[bIdx].options[optIdx] = value;
    setBlocks(updated);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(!title) return;
    
    if (blocks.length === 0) return alert("Please add at least 1 block to this assignment.");
    
    // Basic validation
    for (let i = 0; i < blocks.length; i++) {
       const b = blocks[i];
       if (!b.text.trim()) return alert(`Block ${i+1} is missing instructions/text.`);
       if (b.type === 'mcq') {
         for(let j=0; j<4; j++) {
           if(!b.options[j].trim()) return alert(`Block ${i+1} is missing Option ${j+1}.`);
         }
       }
    }

    let deadlineMs = null;
    if (deadlineDate) {
       // Set deadline to the end of the selected day
       const dateObj = new Date(deadlineDate);
       dateObj.setHours(23, 59, 59, 999);
       deadlineMs = dateObj.getTime();
    }

    setIsSubmitting(true);
    await createTask(title, type, points, exp, blocks, deadlineMs);
    
    setTitle(''); setBlocks([]); setDeadlineDate('');
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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Create New Task</h2>
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
               <div>
                 <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Assignment Title</label>
                 <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Unit 3 Test" />
               </div>
               <div>
                 <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Deadline (Optional)</label>
                 <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
               </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Category</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="Required">Required</option>
                  <option value="Optional">Optional</option>
                  <option value="Practice">Practice</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Total Completion Pts</label>
                <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} min="0" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Total Completion EXP</label>
                <input type="number" value={exp} onChange={(e) => setExp(e.target.value)} min="0" required />
              </div>
            </div>

            {/* Hybrid Block Builder */}
            <div style={{ borderTop: '2px dashed var(--border-light)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Task Blocks ({blocks.length})</h3>
                 <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => handleAddBlock('mcq')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>+ MCQ</button>
                    <button type="button" onClick={() => handleAddBlock('essay')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fae8ff', color: '#c026d3', border: '1px solid #f5d0fe' }}>+ Essay</button>
                    <button type="button" onClick={() => handleAddBlock('photo')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>+ Photo</button>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {blocks.map((b, bIndex) => (
                   <div key={b.id} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px', border: b.type === 'mcq' ? '2px solid #c7d2fe' : b.type === 'essay' ? '2px solid #f5d0fe' : '2px solid #bbf7d0' }}>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: b.type === 'mcq' ? '#4f46e5' : b.type === 'essay' ? '#c026d3' : '#16a34a' }}>
                           Block {bIndex + 1}: {b.type === 'mcq' ? 'Multiple Choice' : b.type === 'essay' ? 'Text / Essay' : 'Photo Upload'}
                        </div>
                        <i className="ti ti-trash" style={{ color: '#ef4444', cursor: 'pointer', padding: '4px' }} onClick={() => handleRemoveBlock(bIndex)} title="Remove Block"></i>
                     </div>
                     
                     {/* Text / Instruction common for all */}
                     <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Instruction / Prompt / Question</label>
                     <textarea 
                       placeholder={`e.g. ${b.type === 'mcq' ? 'Choose the correct grammar:' : b.type === 'essay' ? 'Write a poem about winter:' : 'Upload a photo of your notebook:'}`} 
                       value={b.text} onChange={e => setBlockField(bIndex, 'text', e.target.value)} 
                       style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }} 
                       required rows={b.type === 'essay' ? 3 : 2}
                     />
                     
                     {/* MCQ specific options */}
                     {b.type === 'mcq' && (
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                          {b.options.map((opt, oIndex) => (
                             <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: b.correctIndex === oIndex ? '#e0e7ff' : 'transparent', padding: '4px', borderRadius: '8px' }}>
                               <input type="radio" name={`correct-${b.id}`} checked={b.correctIndex === oIndex} onChange={() => setBlockField(bIndex, 'correctIndex', oIndex)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                               <input type="text" value={opt} onChange={e => setOptionText(bIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} style={{ padding: '8px', fontSize: '0.9rem', flex: 1 }} required />
                             </div>
                          ))}
                       </div>
                     )}

                   </div>
                 ))}
                 {blocks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem', border: '2px dashed var(--border-light)', borderRadius: '12px' }}>Start building your assignment by adding blocks above.</div>}
              </div>

            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting || blocks.length === 0} style={{ marginTop: '1rem', padding: '16px', fontSize: '1.1rem' }}>
              {isSubmitting ? 'Publishing Task...' : 'Publish Form'}
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
                {tasks.map(t => {
                  const isExpired = t.deadline && now > t.deadline;
                  return (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', border: `1px solid ${isExpired ? '#fecaca' : 'var(--border-light)'}`, borderRadius: '12px', background: isExpired ? '#fef2f2' : '#f8fafc', position: 'relative' }}>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px', textDecoration: isExpired ? 'line-through' : 'none' }}>{t.title}</h4>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                         <span style={{ fontWeight: '900', color: 'var(--text-main)', background: '#cbd5e1', padding: '2px 8px', borderRadius: '12px' }}>{t.blocks ? t.blocks.length : (t.questions?.length || 0)} Blocks</span>
                         <span>•</span>
                         <span>{t.type}</span>
                         <span>•</span>
                         {t.deadline ? (
                           <span style={{ color: isExpired ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>
                              <i className="ti ti-clock"></i> Due: {new Date(t.deadline).toLocaleDateString()}
                           </span>
                         ) : <span>Forever</span>}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{t.rewardPoints} Pts</div>
                        <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>+{t.rewardExp} EXP</div>
                      </div>
                      <button onClick={() => handleDeleteTask(t.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }} title="Delete Task">
                         <i className="ti ti-trash"></i>
                      </button>
                    </div>

                  </div>
                )})}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
