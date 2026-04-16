'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSpeechySession, getAllSpeechyBanks, deleteSpeechyBank } from '@/lib/firebaseUtils';

export default function AdminSpeechy() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);

  const fetchQuizzes = () => {
    setLoading(true);
    getAllSpeechyBanks().then(data => {
      setQuizzes(data.sort((a,b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Delete this Speechy Bank?")) {
      await deleteSpeechyBank(id);
      fetchQuizzes();
    }
  };

  return (
    <div className="container" style={{ padding: '0.5rem 1.5rem', paddingLeft: '0' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
         <div>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Speechy Games</h2>
           <p style={{ color: 'var(--text-muted)' }}>
             Select a Speechy text bank to launch a real-time pronunciation game on the projector.
           </p>
         </div>
         <div style={{ display: 'flex', gap: '10px' }}>
           <Link href="/admin/speechy/create" className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
             <i className="ti ti-plus" style={{ fontSize: '1.2rem' }}></i> Create Speechy Text
           </Link>
         </div>
       </div>

       {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
       {sessionLoading && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}><i className="ti ti-loader rotate"></i> Generating Live Session...</div>}

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
         {loading ? (
           <div style={{ color: 'var(--text-muted)' }}>Loading Speechy banks...</div>
         ) : quizzes.length === 0 ? (
           <div style={{ color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2rem', borderRadius: '12px', gridColumn: '1 / -1', textAlign: 'center' }}>
             No Speechy games configured. Click "Create Speechy Text" to build one.
           </div>
         ) : quizzes.map((quiz) => (
           <div key={quiz.id} className="glass-panel" style={{ 
              padding: '2rem', 
              borderTop: `4px solid ${quiz.color || '#3b82f6'}`,
              display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s', cursor: 'default',
              position: 'relative'
           }}
           onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
           >
             <button onClick={() => handleDelete(quiz.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }} title="Delete Bank">
               <i className="ti ti-trash"></i>
             </button>

             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
               <div style={{ 
                 width: '50px', height: '50px', borderRadius: '12px', background: `${quiz.color || '#3b82f6'}20`, 
                 display: 'flex', justifyContent: 'center', alignItems: 'center', color: quiz.color || '#3b82f6'
               }}>
                 <i className={`ti ${quiz.icon || 'ti-message-circle-2'}`} style={{ fontSize: '1.8rem' }}></i>
               </div>
               <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{quiz.title}</h3>
             </div>
             
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '2rem' }}>
               {quiz.description || 'Test your pronunciation skills reading this text!'}
             </p>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', background: '#3b82f6', padding: '4px 10px', borderRadius: '20px' }}>
                 Speechy Mode
               </span>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button 
                   onClick={() => router.push(`/admin/speechy/create?edit=${quiz.id}`)} 
                   style={{ 
                     background: 'var(--bg-surface)', color: 'var(--text-main)', padding: '10px 16px', 
                     borderRadius: '8px', fontWeight: 'bold', border: '1px solid var(--border-light)', cursor: 'pointer',
                     display: 'flex', alignItems: 'center', gap: '5px'
                   }}>
                   <i className="ti ti-pencil"></i> Edit
                 </button>
                 <button 
                   onClick={() => router.push(`/admin/speechy/submissions/${quiz.id}`)} 
                   style={{ 
                     background: quiz.color || '#3b82f6', color: 'white', padding: '10px 20px', 
                     borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                     boxShadow: `0 4px 14px ${(quiz.color || '#3b82f6')}40`
                   }}>
                   View Submissions
                 </button>
               </div>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
}
