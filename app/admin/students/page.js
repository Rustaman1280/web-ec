'use client';
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

export default function AdminStudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Economy Edit States
  const [editingUi, setEditingUi] = useState({ uid: null, field: null }); // field: 'exp' or 'points'
  const [editAmount, setEditAmount] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    if (!database) { setLoading(false); return; }
    
    const usersSnap = await get(ref(database, 'users'));
    if(usersSnap.exists()) {
       const uData = usersSnap.val();
       const sortedStudents = Object.keys(uData)
         .filter(uid => uData[uid].role !== 'admin')
         .map(uid => ({ uid, ...uData[uid] }))
         .sort((a,b) => (b.exp || 0) - (a.exp || 0)); // default sort by EXP
       setStudents(sortedStudents);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openEditor = (uid, field) => {
    setEditingUi({ uid, field });
    setEditAmount('');
  };

  const handleEconomyAction = async (uid, field, actionType) => {
    if (!editAmount || isNaN(editAmount)) return;
    const amount = parseInt(editAmount);
    
    try {
      const userRef = ref(database, `users/${uid}`);
      const snap = await get(userRef);
      if(snap.exists()) {
         const current = snap.val()[field] || 0;
         let newValue = current;
         
         if(actionType === 'add') newValue += amount;
         else if(actionType === 'sub') newValue = Math.max(0, current - amount);
         else if(actionType === 'set') newValue = Math.max(0, amount);
         
         await update(userRef, { [field]: newValue });
         setEditingUi({ uid: null, field: null });
         await fetchStudents();
      }
    } catch(err) {
      console.error(err);
      alert("Failed to update " + field);
    }
  };

  return (
    <div style={{ padding: '0.5rem 1.5rem', paddingLeft: '0' }}>
       <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>Student Management</h2>
       <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
         Monitor registered students, track their EXP Leaderboard rank, and manually adjust their Points & EXP.
       </p>
       
       <div className="glass-panel" style={{ overflow: 'hidden', padding: '1rem' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
           <thead>
             <tr style={{ background: 'var(--bg-dark)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
               <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderRadius: '12px 0 0 12px' }}>Student Name</th>
               <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>Email</th>
               <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>EXP (Rank)</th>
               <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderRadius: '0 12px 12px 0' }}>Spendable Points</th>
             </tr>
           </thead>
           <tbody>
             {loading ? (
               <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</td></tr>
             ) : students.length === 0 ? (
               <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students registered yet.</td></tr>
             ) : (
               students.map((stu) => (
                 <tr key={stu.uid} style={{ borderBottom: '1px solid var(--border-light)' }}>
                   <td style={{ padding: '1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)',
                        color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold',
                        backgroundImage: stu.photoUrl ? `url(${stu.photoUrl})` : 'none', backgroundSize: 'cover'
                     }}>
                       {!stu.photoUrl && (stu.nickname || stu.fullName || '?').charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{stu.fullName}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stu.nickname && stu.nickname !== stu.fullName ? `AKA ${stu.nickname}` : 'No Custom Nickname'}</div>
                     </div>
                   </td>
                   
                   <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{stu.email}</td>
                   
                   {/* EXP COLUMN */}
                   <td style={{ padding: '1rem' }}>
                     {editingUi.uid === stu.uid && editingUi.field === 'exp' ? (
                       <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', maxWidth: '180px' }}>
                         <input 
                           type="number" min="0" placeholder="Amount" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} 
                           style={{ width: '100%', padding: '6px', borderRadius: '6px' }}
                         />
                         <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                           <button onClick={() => handleEconomyAction(stu.uid, 'exp', 'add')} style={{ flex: 1, background: '#10b981', color: 'white', padding: '6px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>+</button>
                           <button onClick={() => handleEconomyAction(stu.uid, 'exp', 'sub')} style={{ flex: 1, background: '#ef4444', color: 'white', padding: '6px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>-</button>
                           <button onClick={() => handleEconomyAction(stu.uid, 'exp', 'set')} style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>Set</button>
                           <button onClick={() => setEditingUi({ uid: null, field: null })} style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>✕</button>
                         </div>
                       </div>
                     ) : (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '900', color: 'var(--accent)' }}>
                         {stu.exp || 0}
                         <i className="ti ti-pencil" onClick={() => openEditor(stu.uid, 'exp')} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', background: 'var(--bg-dark)', borderRadius: '4px' }}></i>
                       </div>
                     )}
                   </td>
                   
                   {/* POINTS COLUMN */}
                   <td style={{ padding: '1rem' }}>
                     {editingUi.uid === stu.uid && editingUi.field === 'points' ? (
                       <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', maxWidth: '180px' }}>
                         <input 
                           type="number" min="0" placeholder="Amount" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} 
                           style={{ width: '100%', padding: '6px', borderRadius: '6px' }}
                         />
                         <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                           <button onClick={() => handleEconomyAction(stu.uid, 'points', 'add')} style={{ flex: 1, background: '#10b981', color: 'white', padding: '6px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>+</button>
                           <button onClick={() => handleEconomyAction(stu.uid, 'points', 'sub')} style={{ flex: 1, background: '#ef4444', color: 'white', padding: '6px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>-</button>
                           <button onClick={() => handleEconomyAction(stu.uid, 'points', 'set')} style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>Set</button>
                           <button onClick={() => setEditingUi({ uid: null, field: null })} style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', border: 'none' }}>✕</button>
                         </div>
                       </div>
                     ) : (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '900', color: 'var(--primary)' }}>
                         {stu.points || 0} Pts
                         <i className="ti ti-pencil" onClick={() => openEditor(stu.uid, 'points')} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', background: 'var(--bg-dark)', borderRadius: '4px' }}></i>
                       </div>
                     )}
                   </td>
                 </tr>
               ))
             )}
           </tbody>
         </table>
       </div>
    </div>
  );
}
