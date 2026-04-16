'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createQuizSession, getAllLiveQuizzes, deleteLiveQuizBank } from '@/lib/firebaseUtils';

export default function AdminLiveQuizzes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);

  const fetchQuizzes = () => {
    setLoading(true);
    getAllLiveQuizzes().then(data => {
      setQuizzes(data.sort((a,b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Delete this Live Quiz Bank?")) {
      await deleteLiveQuizBank(id);
      fetchQuizzes();
    }
  };

  const handleCreateSession = async (quiz) => {
    setSessionLoading(true); 
    setError(null);
    try {
      const pin = await createQuizSession(quiz.id, quiz.sessionPoints, quiz.sessionExp, quiz.questions, quiz.bgTheme, quiz.bgMusic, quiz.title);
      if(pin) router.push(`/admin/quiz/${pin}`);
      else setError('Failed to create session. Check rules/connection.');
    } catch (err) {
      console.error(err); 
      setError('An error occurred starting the quiz.');
    }
    setSessionLoading(false);
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
         <div style={{ display: 'flex', gap: '10px' }}>
           <Link href="/admin/live/history" className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', background: '#e2e8f0', color: 'var(--text-main)' }}>
             <i className="ti ti-history" style={{ fontSize: '1.2rem' }}></i> Quiz History
           </Link>
           <Link href="/admin/live/create" className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
             <i className="ti ti-plus" style={{ fontSize: '1.2rem' }}></i> Create Custom Game
           </Link>
         </div>
       </div>

       {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
       {sessionLoading && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}><i className="ti ti-loader rotate"></i> Generating Live Session...</div>}

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
         {loading ? (
           <div style={{ color: 'var(--text-muted)' }}>Loading custom quiz banks...</div>
         ) : quizzes.length === 0 ? (
           <div style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2rem', borderRadius: '12px', gridColumn: '1 / -1', textAlign: 'center' }}>
             No Live Quizzes configured. Click "Create Custom Game" to build one.
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
