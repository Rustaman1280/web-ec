'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { transferPointsByEmail } from '@/lib/economyUtils';
import Link from 'next/link';

export default function TransferPoints() {
  const { currentUser, profile } = useAuth();
  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const TRANSACTION_FEE = 5; // Global flat fee

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if(!receiverEmail || !amount) {
       setError("Complete all fields.");
       return;
    }
    const sendAmt = parseInt(amount);
    if(isNaN(sendAmt) || sendAmt <= 0) {
       setError("Amount must be a positive integer.");
       return;
    }
    
    // Quick frontend check
    if((profile.points || 0) < sendAmt + TRANSACTION_FEE) {
       setError(`Insufficient balance. You need ${sendAmt + TRANSACTION_FEE} Pts to perform this transfer.`);
       return;
    }

    setLoading(true);
    try {
       const res = await transferPointsByEmail(currentUser.uid, receiverEmail, sendAmt, TRANSACTION_FEE);
       if(res.success) {
          setSuccessMsg(res.msg);
          setReceiverEmail('');
          setAmount('');
          // Refresh window slightly later so user can read message
          setTimeout(() => {
             window.location.reload();
          }, 2000);
       } else {
          setError(res.msg);
      }
    } catch(err) {
       setError(err.message || 'An error occurred during transfer.');
    } finally {
       setLoading(false);
    }
  };

  if(!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
       
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
         <h2 className="heading-xl" style={{ fontSize: '2rem', margin: 0 }}><i className="ti ti-send" style={{ color: 'var(--primary)' }}></i> Share Points</h2>
         <Link href="/member" className="btn-primary" style={{ background: '#e2e8f0', color: 'var(--text-main)', textDecoration: 'none', padding: '10px 20px' }}>
            Back
         </Link>
       </div>

       <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Your Available Balance</div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>{profile.points || 0} Pts</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
             Transfer Fee: <br/><strong style={{ color: '#ef4444' }}>{TRANSACTION_FEE} Pts / Transact</strong>
          </div>
       </div>

       <div className="glass-panel" style={{ padding: '2rem' }}>
          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
          {successMsg && <div style={{ background: '#ecfdf5', color: '#10b981', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontWeight: 'bold' }}>{successMsg}</div>}

          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             
             <div>
               <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>Recipient Email</label>
               <input 
                 type="email" 
                 required 
                 value={receiverEmail} 
                 onChange={e => setReceiverEmail(e.target.value)} 
                 placeholder="friend@student.com"
                 style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '1rem' }}
               />
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Make sure this exact email is registered in English Club.</div>
             </div>

             <div>
               <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>Amount to Send</label>
               <div style={{ position: 'relative' }}>
                 <input 
                   type="number" 
                   required 
                   value={amount} 
                   onChange={e => setAmount(e.target.value)} 
                   placeholder="100"
                   min="1"
                   style={{ width: '100%', padding: '12px 16px', paddingRight: '60px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '1.5rem', fontWeight: 'bold' }}
                 />
                 <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-muted)' }}>Pts</span>
               </div>
             </div>

             <div style={{ background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                   <span>Send Amount</span>
                   <span style={{ fontWeight: 'bold' }}>{amount || 0} Pts</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#ef4444' }}>
                   <span>Tax (Fee)</span>
                   <span style={{ fontWeight: 'bold' }}>+ {TRANSACTION_FEE} Pts</span>
                </div>
                <hr style={{ border: 'none', borderTop: '2px dashed var(--border-light)', margin: '12px 0' }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                   <span>Total Deducted</span>
                   <span>{(parseInt(amount) || 0) + TRANSACTION_FEE} Pts</span>
                </div>
             </div>

             <button type="submit" disabled={loading} className="btn-primary anim-pop" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                {loading ? 'Processing...' : 'Send Points Now'}
             </button>

          </form>
       </div>

    </div>
  );
}
