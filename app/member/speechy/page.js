'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllSpeechyBanks, getSpeechySubmissions } from '@/lib/firebaseUtils';
import { useAuth } from '@/hooks/useAuth';

export default function SpeechyHub() {
  const router = useRouter();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [completions, setCompletions] = useState({});

  useEffect(() => {
    if (!profile) return;
    
    const fetchData = async () => {
      const allBanks = await getAllSpeechyBanks();
      
      const compMap = {};
      for (const bank of allBanks) {
         const subs = await getSpeechySubmissions(bank.id);
         if (subs && subs[profile.id]) {
            compMap[bank.id] = subs[profile.id];
         }
      }
      
      setBanks(allBanks.sort((a,b) => b.createdAt - a.createdAt));
      setCompletions(compMap);
      setLoading(false);
    };
    
    fetchData();
  }, [profile]);

  if (!profile || loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Speaking Lab...</div>;

  return (
    <div style={{ padding: '2rem 1.5rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/member')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>Speaking Lab <i className="ti ti-microphone-2" style={{ color: '#f43f5e' }}></i></h2>
        <p style={{ color: 'var(--text-muted)' }}>Train your pronunciation. Read the texts aloud and get evaluated instantly by our AI.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {banks.length === 0 ? (
           <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No Speaking tasks available right now. Check back later!
           </div>
        ) : banks.map(bank => {
           const myResult = completions[bank.id];
           
           return (
             <div key={bank.id} className="glass-panel" style={{ 
               padding: '1.5rem', 
               borderLeft: `4px solid ${bank.color || '#f43f5e'}`,
               display: 'flex', flexDirection: 'column', gap: '1rem',
               position: 'relative'
             }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: `${bank.color || '#f43f5e'}20`, color: bank.color || '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                         <i className={`ti ${bank.icon || 'ti-message-circle-2'}`}></i>
                      </div>
                      <div>
                         <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{bank.title}</h3>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {bank.sessionPoints} Coins • {bank.sessionExp} EXP
                         </div>
                      </div>
                   </div>
                   
                   {myResult && (
                      <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Accuracy</div>
                         <div style={{ fontSize: '1.5rem', fontWeight: '900', color: myResult.bestAccuracy >= 80 ? '#10b981' : '#f59e0b' }}>
                            {Math.round(myResult.bestAccuracy)}%
                         </div>
                      </div>
                   )}
                </div>

                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: '0 0 10px 0' }}>{bank.description}</p>
                
                <Link href={`/member/speechy/play/${bank.id}`} className="btn-primary" style={{ 
                   textAlign: 'center', background: myResult ? 'var(--bg-glass)' : (bank.color || '#f43f5e'), 
                   color: myResult ? 'var(--text-main)' : 'white', 
                   border: myResult ? '1px solid var(--border-light)' : 'none',
                   textDecoration: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold'
                }}>
                   {myResult ? 'Try Again (Improve Score)' : 'Start Speaking!'}
                </Link>
             </div>
           );
        })}
      </div>
    </div>
  );
}
