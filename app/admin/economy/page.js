'use client';
import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { recordTransaction } from '@/lib/economyUtils';

export default function AdminEconomyManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedUser, setSelectedUser] = useState(null);
  const [ptsAdjust, setPtsAdjust] = useState('0');
  const [expAdjust, setExpAdjust] = useState('0');
  const [reason, setReason] = useState('Pelanggaran / Penalty');
  const [submitting, setSubmitting] = useState(false);

  // Search
  const [searchFilter, setSearchFilter] = useState('');

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

  const handleAdjustStats = async (e) => {
    e.preventDefault();
    if(!selectedUser) return toast.error("Please select a user first.");

    const pts = parseInt(ptsAdjust) || 0;
    const exp = parseInt(expAdjust) || 0;
    if (pts === 0 && exp === 0) return toast.error("Please enter a non-zero value for Points or EXP.");
    if (!reason.trim()) return toast.error("Please enter a reason for this adjustment.");

    setSubmitting(true);
    try {
       const newPts = Math.max(0, (selectedUser.points || 0) + pts); // Prevents negative total, though technically you could allow debt, usually we clamp at 0
       const newExp = Math.max(0, (selectedUser.exp || 0) + exp);

       await update(ref(database, `users/${selectedUser.uid}`), {
          points: newPts,
          exp: newExp
       });
       
       await recordTransaction(selectedUser.uid, 'admin_economy', reason, pts, exp);
       
       toast.success("Points/EXP adjusted successfully!");
       
       // Reset form
       setPtsAdjust('0');
       setExpAdjust('0');
       setReason('Pelanggaran / Penalty');
       setSelectedUser(null);
       
       await fetchStudents();
    } catch (err) {
       console.error(err);
       toast.error("Failed to adjust stats.");
    }
    setSubmitting(false);
  };

  const toggleHideStats = async (uid, currentVal) => {
    try {
        await update(ref(database, `users/${uid}`), {
            hideStats: !currentVal
        });
        toast.success(currentVal ? "Stats un-hidden for user." : "Stats hidden for user.");
        await fetchStudents();
    } catch (e) {
        console.error(e);
        toast.error("Failed to toggle hide stats.");
    }
  };

  const filteredStudents = students.filter(s => 
     (s.fullName || '').toLowerCase().includes(searchFilter.toLowerCase()) || 
     (s.nickname || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ padding: '1rem' }}>
       <div style={{ marginBottom: '2rem' }}>
         <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Points & EXP Control</h2>
         <p style={{ color: 'var(--text-muted)' }}>
           Manage Member Economy safely: Deduct points for penalties, add points, and toggle stat visibility. 
         </p>
       </div>
       
       <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '2rem' }}>
          
          {/* Left Panel: Student List */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>All Students</h3>
                <input 
                   type="text" 
                   placeholder="Search members..." 
                   value={searchFilter} 
                   onChange={(e) => setSearchFilter(e.target.value)}
                   style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', width: '200px' }} 
                />
             </div>
             
             <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                {loading ? (
                   <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
                ) : filteredStudents.length === 0 ? (
                   <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students found.</div>
                ) : (
                   filteredStudents.map((stu, i) => (
                      <div key={stu.uid} style={{ 
                         display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', 
                         borderBottom: i < filteredStudents.length - 1 ? '1px solid var(--border-light)' : 'none',
                         background: selectedUser?.uid === stu.uid ? 'rgba(99, 102, 241, 0.05)' : 'white'
                      }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                               width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)',
                               color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold',
                               backgroundImage: stu.photoUrl ? `url(${stu.photoUrl})` : 'none', backgroundSize: 'cover'
                            }}>
                               {!stu.photoUrl && (stu.nickname || stu.fullName || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <div style={{ fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 {stu.fullName} 
                                 {stu.hideStats && <i className="ti ti-eye-off" style={{ color: '#ef4444', fontSize: '1rem' }} title="Stats Hidden"></i>}
                               </div>
                               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                 {stu.nickname ? `Aka: ${stu.nickname}` : 'No Nickname'}
                               </div>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                               onClick={() => toggleHideStats(stu.uid, stu.hideStats)} 
                               style={{ 
                                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                                  background: stu.hideStats ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: stu.hideStats ? '#10b981' : '#ef4444'
                               }}
                               title={stu.hideStats ? "Show Stats on Leaderboard" : "Hide Stats from Leaderboard"}
                            >
                               {stu.hideStats ? 'Show Stats' : 'Hide Stats'}
                            </button>
                            <button 
                               onClick={() => setSelectedUser(stu)} 
                               style={{ 
                                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                                  background: selectedUser?.uid === stu.uid ? 'var(--primary)' : 'var(--bg-dark)',
                                  color: selectedUser?.uid === stu.uid ? 'white' : 'var(--text-main)'
                               }}
                            >
                               Select Target
                            </button>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>

          {/* Right Panel: Adjust Form */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: '#f8fafc', border: '2px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)' }}>Adjust Points / EXP</h3>
             
             {!selectedUser ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-light)', borderRadius: '12px', padding: '2rem' }}>
                   Select a student from the list to modify their Points or EXP.
                </div>
             ) : (
                <form onSubmit={handleAdjustStats} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', flex: 1 }}>
                   
                   <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Target Student</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedUser.fullName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>M: {selectedUser.points || 0} Pts • {selectedUser.exp || 0} EXP</div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                         <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Points Adjustment (+ / -)</label>
                         <input 
                            type="number" 
                            value={ptsAdjust} 
                            onChange={e => setPtsAdjust(e.target.value)} 
                            required 
                            placeholder="e.g. -50 or 50"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} 
                         />
                         <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>Use negative to deduct (e.g. -10)</div>
                      </div>
                      <div>
                         <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>EXP Adjustment (+ / -)</label>
                         <input 
                            type="number" 
                            value={expAdjust} 
                            onChange={e => setExpAdjust(e.target.value)} 
                            required 
                            placeholder="e.g. -50 or 50"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} 
                         />
                         <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>Use negative to deduct (e.g. -10)</div>
                      </div>
                   </div>

                   <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Reason / Note</label>
                      <input 
                         type="text" 
                         value={reason} 
                         onChange={e => setReason(e.target.value)} 
                         required 
                         placeholder="e.g. Talking during class, Cheats, or Positive behavior"
                         style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} 
                      />
                   </div>

                   <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                      <button type="button" onClick={() => setSelectedUser(null)} style={{ flex: 1, padding: '12px', background: 'white', color: 'var(--text-muted)', fontWeight: 'bold', border: '1px solid var(--border-light)', borderRadius: '12px', cursor: 'pointer' }}>
                         Cancel
                      </button>
                      <button type="submit" disabled={submitting} style={{ flex: 2, padding: '12px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: submitting ? 'wait' : 'pointer' }}>
                         {submitting ? 'Appling...' : 'Apply Changes'}
                      </button>
                   </div>
                </form>
             )}
          </div>
       </div>

       {/* Extra Info/Legend */}
       <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', borderLeft: '4px solid #fbbf24', borderRadius: '8px' }}>
          <strong>Info:</strong> Adjustments will be recorded in the student's transaction ledger. If you hide a student's stats, they will not be displayed on the Top 5 Leaderboard, and their points/EXP will be shown as <code>???</code> to themselves.
       </div>
    </div>
  );
}
