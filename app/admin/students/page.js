'use client';
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { registerStudentWithoutLogin } from '@/lib/adminAuthUtils';

export default function AdminStudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Edit State
  const [editingUid, setEditingUid] = useState(null);
  const [editPts, setEditPts] = useState('');
  const [editExp, setEditExp] = useState('');

  // Add Student State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

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
    // eslint-disable-next-line
    fetchStudents();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(''); setRegSuccess('');
    if (!newName || !newEmail || newPassword.length < 6) {
      setRegError('All fields required. Password must be 6+ chars.');
      return;
    }
    
    setRegistering(true);
    try {
      await registerStudentWithoutLogin(newName, newEmail, newPassword);
      setRegSuccess(`Successfully registered ${newName}!`);
      setNewName(''); setNewEmail(''); setNewPassword('');
      setShowAddForm(false);
      await fetchStudents(); // Refresh table
    } catch(err) {
      console.error(err);
      setRegError(err.message || 'Failed to register student.');
    }
    setRegistering(false);
  };

  const startEditing = (uid, currentPts, currentExp) => {
    setEditingUid(uid);
    setEditPts(currentPts || 0);
    setEditExp(currentExp || 0);
  };

  const handleSaveData = async (uid) => {
    if (isNaN(editPts) || isNaN(editExp)) return;
    try {
      await update(ref(database, `users/${uid}`), { points: parseInt(editPts), exp: parseInt(editExp) });
      setEditingUid(null);
      await fetchStudents();
    } catch(err) {
      console.error(err);
      alert("Failed to update economy data.");
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
         <div>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Student Management</h2>
           <p style={{ color: 'var(--text-muted)' }}>
             Monitor registered students, track their EXP Leaderboard rank, and manually adjust their Points.
           </p>
         </div>
         <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <i className="ti ti-user-plus" style={{ fontSize: '1.2rem' }}></i> {showAddForm ? 'Close Form' : 'Register New Student'}
         </button>
       </div>

       {showAddForm && (
         <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: '#f8fafc', border: '2px dashed var(--primary)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--primary)' }}>Add New Student</h3>
            
            {regError && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{regError}</div>}
            {regSuccess && <div style={{ color: '#10b981', marginBottom: '1rem', fontWeight: 'bold' }}>{regSuccess}</div>}
            
            <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) auto', gap: '1rem', alignItems: 'end' }}>
               <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Full Name</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="John Doe" />
               </div>
               <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Email</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required placeholder="student@example.com" />
               </div>
               <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 6 chars" />
               </div>
               <button type="submit" disabled={registering} style={{ padding: '14px 24px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: registering ? 'wait' : 'pointer', height: '100%' }}>
                  {registering ? 'Creating...' : '+ Add'}
               </button>
            </form>
         </div>
       )}
       
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
                   
                   <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                     {editingUid === stu.uid ? (
                       <input type="number" value={editExp} onChange={e => setEditExp(e.target.value)} style={{ width: '80px', padding: '6px', borderRadius: '6px' }} />
                     ) : (
                       stu.exp || 0
                     )}
                   </td>
                   
                   <td style={{ padding: '1rem' }}>
                     {editingUid === stu.uid ? (
                       <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                         <input 
                           type="number" 
                           value={editPts} 
                           onChange={(e) => setEditPts(e.target.value)} 
                           style={{ width: '80px', padding: '6px', borderRadius: '6px' }}
                         />
                         <button onClick={() => handleSaveData(stu.uid)} style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>✓</button>
                         <button onClick={() => setEditingUid(null)} style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>✕</button>
                       </div>
                     ) : (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '900', color: 'var(--primary)' }}>
                         {stu.points || 0} Pts
                         <i className="ti ti-pencil" onClick={() => startEditing(stu.uid, stu.points, stu.exp)} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', background: 'var(--bg-dark)', borderRadius: '4px' }} title="Edit Points & EXP"></i>
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
