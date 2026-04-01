'use client';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

export default function MotmAdminPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedUid, setSelectedUid] = useState('');
  const [quote, setQuote] = useState('');
  const [saving, setSaving] = useState(false);

  // Current State
  const [currentMotm, setCurrentMotm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!database) return;
    setLoading(true);
    
    try {
        const [usersSnap, configSnap] = await Promise.all([
           get(ref(database, 'users')),
           get(ref(database, 'config/motm'))
        ]);
        
        if(usersSnap.exists()) {
           const uData = usersSnap.val();
           const fetchedStudents = Object.keys(uData)
             .filter(uid => uData[uid].role !== 'admin')
             .map(uid => ({ uid, ...uData[uid] }))
             .sort((a,b) => (a.fullName || '').localeCompare(b.fullName || ''));
           setStudents(fetchedStudents);
        }
        
        if (configSnap.exists()) {
           const motmData = configSnap.val();
           setCurrentMotm(motmData);
           setSelectedUid(motmData.uid || '');
           setQuote(motmData.quote || '');
        } else {
           setCurrentMotm(null);
           setSelectedUid('');
           setQuote('');
        }
    } catch (err) {
        console.error("Error fetching admin motm data:", err);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedUid) return toast.error("Please select a student.");
    if (!quote.trim()) return toast.error("Please enter a quote or reason.");
    
    setSaving(true);
    try {
        const selectedStudent = students.find(s => s.uid === selectedUid);
        if(!selectedStudent) throw new Error("Student not found in list.");
        
        const motmData = {
            uid: selectedUid,
            quote: quote,
            updatedAt: Date.now(),
            name: selectedStudent.nickname || selectedStudent.fullName || 'Student',
            fullName: selectedStudent.fullName || 'Student',
            photoUrl: selectedStudent.photoUrl || ''
        };
        await set(ref(database, 'config/motm'), motmData);
        
        toast.success("Member of the Month updated successfully!");
        fetchData();
    } catch(err) {
        console.error("Failed to set MOTM:", err);
        toast.error("Failed to save. Check console for details.");
    }
    setSaving(false);
  };
  
  const handleClear = async () => {
    if(!confirm("Are you sure you want to remove the current Member of the Month?")) return;
    
    setSaving(true);
    try {
        await set(ref(database, 'config/motm'), null);
        toast.success("Removed successfully!");
        fetchData();
    } catch (err) {
        console.error(err);
        toast.error("Failed to remove.");
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Member of the Month</h2>
          <p style={{ color: 'var(--text-muted)' }}>Select a student to highlight on the Leaderboards hub.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
         <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--primary)' }}>Select Member</h3>
         
         <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
               <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Student</label>
               <select 
                  value={selectedUid} 
                  onChange={e => setSelectedUid(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', fontSize: '1rem' }}
               >
                  <option value="" disabled>-- Select a Student --</option>
                  {students.map(stu => (
                     <option key={stu.uid} value={stu.uid}>
                        {stu.fullName} {stu.nickname && stu.nickname !== stu.fullName ? `(AKA ${stu.nickname})` : ''} - {stu.points || 0} Pts
                     </option>
                  ))}
               </select>
            </div>

            <div>
               <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Achievement Quote / Reason</label>
               <textarea 
                  value={quote} 
                  onChange={e => setQuote(e.target.value)}
                  placeholder="e.g. For consistently participating in discussions and helping other members learn vocabulary!"
                  required
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', fontSize: '1rem', resize: 'vertical' }}
               ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
               <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '12px 24px', fontWeight: 'bold', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save as MOTM'}
               </button>
               {currentMotm && (
                 <button type="button" onClick={handleClear} disabled={saving} style={{ padding: '12px 24px', fontWeight: 'bold', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer' }}>
                    Remove Current MOTM
                 </button>
               )}
            </div>

         </form>
      </div>

      {currentMotm && (
         <div className="glass-panel" style={{ padding: '2rem', border: '2px solid var(--primary)', background: 'var(--gradient-primary)', color: 'white' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', opacity: 0.9 }}>Current Preview:</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
               {currentMotm.photoUrl ? (
                  <img src={currentMotm.photoUrl} alt="MOTM" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
               ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
                     {(currentMotm.name || 'S').charAt(0)}
                  </div>
               )}
               <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.2rem' }}>{currentMotm.name}</div>
                  <div style={{ fontSize: '1rem', opacity: 0.9, fontStyle: 'italic' }}>"{currentMotm.quote}"</div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
