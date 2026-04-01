'use client';
import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { registerStudentWithoutLogin } from '@/lib/adminAuthUtils';
import { recordTransaction, fetchUserTransactions, fetchUserTaskResults } from '@/lib/economyUtils';

export default function AdminStudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingUid, setEditingUid] = useState(null);
  const [editPts, setEditPts] = useState('');
  const [editExp, setEditExp] = useState('');
  const [editNick, setEditNick] = useState('');

  const [expandedUid, setExpandedUid] = useState(null);
  const [userTxns, setUserTxns] = useState([]);
  const [userTasksRecord, setUserTasksRecord] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Bonus Form State
  const [bonusPts, setBonusPts] = useState('50');
  const [bonusExp, setBonusExp] = useState('50');
  const [bonusDesc, setBonusDesc] = useState('Offline Activity / Keaktifan');
  const [submittingBonus, setSubmittingBonus] = useState(false);

  // Add Student State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNick, setNewNick] = useState('');
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
      await registerStudentWithoutLogin(newName, newEmail, newPassword, newNick);
      setRegSuccess(`Successfully registered ${newName}!`);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewNick('');
      setShowAddForm(false);
      await fetchStudents(); // Refresh table
    } catch(err) {
      console.error(err);
      setRegError(err.message || 'Failed to register student.');
    }
    setRegistering(false);
  };

  const startEditing = (uid, currentPts, currentExp, currentNick) => {
    setEditingUid(uid);
    setEditPts(currentPts || 0);
    setEditExp(currentExp || 0);
    setEditNick(currentNick || '');
  };

  const toggleExpandStudent = async (uid) => {
    if (expandedUid === uid) {
      setExpandedUid(null);
      return;
    }
    setExpandedUid(uid);
    setLoadingTxns(true);
    
    // Fetch concurrently
    const [txns, tasksRes] = await Promise.all([
       fetchUserTransactions(uid),
       fetchUserTaskResults(uid)
    ]);
    
    setUserTxns(txns);
    setUserTasksRecord(tasksRes);
    setLoadingTxns(false);
  };

  const handleSaveData = async (uid, oldPts, oldExp) => {
    if (isNaN(editPts) || isNaN(editExp)) return;
    try {
      const diffPts = parseInt(editPts) - (oldPts || 0);
      const diffExp = parseInt(editExp) - (oldExp || 0);
      await update(ref(database, `users/${uid}`), { points: parseInt(editPts), exp: parseInt(editExp), nickname: editNick });
      if (diffPts !== 0 || diffExp !== 0) {
         await recordTransaction(uid, 'admin_override', 'Admin adjustment', diffPts, diffExp);
      }
      setEditingUid(null);
      await fetchStudents();
    } catch(err) {
      console.error(err);
      toast.error("Failed to update economy data.");
    }
  };

  const handleGiveBonus = async (e, uid, currentPts, currentExp) => {
    e.preventDefault();
    const pts = parseInt(bonusPts) || 0;
    const exp = parseInt(bonusExp) || 0;
    if (pts === 0 && exp === 0) return toast.error("Please enter at least some Points or EXP to give.");
    if (!bonusDesc.trim()) return toast.error("Please enter a reason for the bonus.");

    setSubmittingBonus(true);
    try {
       await update(ref(database, `users/${uid}`), {
          points: (currentPts || 0) + pts,
          exp: (currentExp || 0) + exp
       });
       await recordTransaction(uid, 'offline_bonus', bonusDesc, pts, exp);
       toast.success("Bonus points added successfully!");
       
       // Reset form and refresh
       setBonusPts('50');
       setBonusExp('50');
       setBonusDesc('Offline Activity / Keaktifan');
       
       await fetchStudents();
       toggleExpandStudent(uid); // Refresh ledger
       toggleExpandStudent(uid); 
    } catch (err) {
       console.error(err);
       toast.error("Failed to give bonus.");
    }
    setSubmittingBonus(false);
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
            
            <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) auto', gap: '1rem', alignItems: 'end' }}>
               <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Full Name</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="John Doe" />
               </div>
               <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Greeting Name</label>
                  <input type="text" value={newNick} onChange={e => setNewNick(e.target.value)} placeholder="e.g. John" />
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
         <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
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
                 <React.Fragment key={stu.uid}>
                   <tr style={{ borderBottom: '1px solid var(--border-light)', background: expandedUid === stu.uid ? 'var(--bg-glass)' : 'transparent' }}>
                     <td style={{ padding: '1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => toggleExpandStudent(stu.uid)}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', color: 'var(--primary)'}}>
                          <i className={`ti ${expandedUid === stu.uid ? 'ti-chevron-down' : 'ti-chevron-right'}`} style={{ fontWeight: 'bold' }}></i>
                       </div>
                       <div style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)',
                          color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold',
                          backgroundImage: stu.photoUrl ? `url(${stu.photoUrl})` : 'none', backgroundSize: 'cover'
                       }}>
                         {!stu.photoUrl && (stu.nickname || stu.fullName || '?').charAt(0).toUpperCase()}
                       </div>
                       <div style={{ flex: 1 }}>
                         <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{stu.fullName}</div>
                         {editingUid === stu.uid ? (
                            <input type="text" value={editNick} onChange={e => setEditNick(e.target.value)} placeholder="Greeting Name" style={{ width: '100%', padding: '4px', fontSize: '0.8rem', borderRadius: '4px' }} />
                         ) : (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stu.nickname && stu.nickname !== stu.fullName ? `AKA ${stu.nickname}` : 'No Custom Nickname'}</div>
                         )}
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
                           <button onClick={() => handleSaveData(stu.uid, stu.points, stu.exp)} style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>✓</button>
                           <button onClick={() => setEditingUid(null)} style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>✕</button>
                         </div>
                       ) : (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '900', color: 'var(--primary)' }}>
                           {stu.points || 0} Pts
                           <i className="ti ti-pencil" onClick={() => startEditing(stu.uid, stu.points, stu.exp, stu.nickname || stu.fullName)} style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', background: 'var(--bg-dark)', borderRadius: '4px' }} title="Edit Name & Pts"></i>
                         </div>
                       )}
                     </td>
                   </tr>
                   {expandedUid === stu.uid && (
                     <tr style={{ background: 'var(--bg-dark)' }}>
                        <td colSpan="4" style={{ padding: '2rem' }}>
                           
                           {/* Quick Actions (Give Bonus) */}
                           <div style={{ marginBottom: '2rem', background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                              <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <i className="ti ti-star"></i> Give Bonus (Offline Activity)
                              </h4>
                              <form onSubmit={(e) => handleGiveBonus(e, stu.uid, stu.points, stu.exp)} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                 <div style={{ flex: '1 1 120px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Points Added</label>
                                    <input type="number" value={bonusPts} onChange={e => setBonusPts(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                                 </div>
                                 <div style={{ flex: '1 1 120px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>EXP Added</label>
                                    <input type="number" value={bonusExp} onChange={e => setBonusExp(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                                 </div>
                                 <div style={{ flex: '2 1 200px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Reason / Description</label>
                                    <input type="text" value={bonusDesc} onChange={e => setBonusDesc(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                                 </div>
                                 <button type="submit" disabled={submittingBonus} style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: submittingBonus ? 'wait' : 'pointer' }}>
                                    {submittingBonus ? '...' : '+ Give'}
                                 </button>
                              </form>
                           </div>

                           <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '2rem' }}>
                               
                               {/* Task Results */}
                               <div>
                                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <i className="ti ti-checklist"></i> Completed Tasks
                                  </h4>
                                  {loadingTxns ? (
                                    <div style={{ color: 'var(--text-muted)' }}>Loading records...</div>
                                  ) : userTasksRecord.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>No tasks completed.</div>
                                  ) : (
                                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                                      {userTasksRecord.map((tr, i) => (
                                        <div key={tr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: i < userTasksRecord.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                          <div>
                                             <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{tr.title}</div>
                                             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(tr.claimedAt).toLocaleDateString()} {new Date(tr.claimedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                             <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '0.85rem' }}>+{tr.rewardPoints} Pts</div>
                                             <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.85rem' }}>+{tr.rewardExp} EXP</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                               </div>

                               {/* Economy Ledger */}
                               <div>
                                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <i className="ti ti-history"></i> Economy Ledger
                                  </h4>
                                  {loadingTxns ? (
                                    <div style={{ color: 'var(--text-muted)' }}>Loading records...</div>
                                  ) : userTxns.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>No transactions recorded.</div>
                                  ) : (
                                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
                                      {userTxns.map((txn, i) => (
                                        <div key={txn.id} style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr min-content', gap: '1rem', padding: '1rem', borderBottom: i < userTxns.length - 1 ? '1px solid var(--border-light)' : 'none', alignItems: 'center' }}>
                                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(txn.timestamp).toLocaleDateString()} <br/>{new Date(txn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </div>
                                          <div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{txn.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{txn.type.replace('_', ' ')}</div>
                                          </div>
                                          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {(txn.pointChange !== 0) && (
                                              <div style={{ fontWeight: 'bold', color: (txn.pointChange || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                                                {(txn.pointChange || 0) >= 0 ? '+' : ''}{txn.pointChange} Pts
                                              </div>
                                            )}
                                            {(txn.expChange !== 0) && (
                                              <div style={{ fontWeight: 'bold', color: (txn.expChange || 0) >= 0 ? 'var(--accent)' : '#ef4444' }}>
                                                {(txn.expChange || 0) >= 0 ? '+' : ''}{txn.expChange} EXP
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                               </div>
                           </div>
                        </td>
                     </tr>
                   )}
                 </React.Fragment>
               ))
             )}
           </tbody>
         </table>
         </div>
       </div>
    </div>
  );
}
