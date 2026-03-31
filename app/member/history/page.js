'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserTransactions } from '@/lib/economyUtils';
import Link from 'next/link';

export default function PointHistory() {
  const { currentUser, profile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchUserTransactions(currentUser.uid).then(txns => {
        setTransactions(txns);
        setLoading(false);
      });
    }
  }, [currentUser]);

  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h2 className="heading-xl" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bank Statement</h2>
            <p style={{ color: 'var(--text-muted)' }}>Track all your incoming and outgoing Points and EXP.</p>
         </div>
         <Link href="/member" className="btn-primary" style={{ background: '#e2e8f0', color: 'var(--text-main)', textDecoration: 'none', padding: '10px 20px' }}>
            Back to Dashboard
         </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.5rem' }}>
         <div className="glass-panel" style={{ padding: '2rem', background: 'var(--gradient-primary)', color: 'white', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ fontSize: '3rem', fontWeight: '900' }}>{profile.points || 0}</div>
            <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Spendable Points</div>
         </div>
         <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-glass)', color: 'var(--accent)', textAlign: 'center', border: '2px solid var(--accent)', borderRadius: '16px' }}>
            <div style={{ fontSize: '3rem', fontWeight: '900' }}>{profile.exp || 0}</div>
            <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Total EXP</div>
         </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden', padding: '0', background: 'white' }}>
         <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}><i className="ti ti-history"></i> Transaction Log</h3>
         </div>
         
         {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your transactions...</div>
         ) : transactions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</div>
         ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               {transactions.map((txn, i) => (
                 <div key={txn.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 100px', gap: '1rem', padding: '1.5rem', borderBottom: i < transactions.length - 1 ? '1px solid var(--border-light)' : 'none', alignItems: 'center' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                     {new Date(txn.timestamp).toLocaleDateString()} <br/>
                     <span style={{ fontWeight: 'bold' }}>{new Date(txn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <div>
                     <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '5px' }}>{txn.title}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '12px', display: 'inline-block' }}>{txn.type.replace('_', ' ')}</div>
                   </div>
                   <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: (txn.pointChange || 0) >= 0 ? '#10b981' : '#ef4444', textAlign: 'right' }}>
                     {(txn.pointChange || 0) > 0 ? '+' : ''}{txn.pointChange || 0} Pts
                   </div>
                   <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: (txn.expChange || 0) >= 0 ? 'var(--accent)' : '#ef4444', textAlign: 'right' }}>
                     {(txn.expChange || 0) > 0 ? '+' : ''}{txn.expChange || 0} EXP
                   </div>
                 </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
