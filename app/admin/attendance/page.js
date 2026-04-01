'use client';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export default function AdminAttendance() {
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allStudents, setAllStudents] = useState({});

  useEffect(() => {
    // Preload all students for cross-referencing names
    const fetchStudents = async () => {
       if(!database) return;
       const snap = await get(ref(database, 'users'));
       if(snap.exists()) {
          const ud = snap.val();
          setAllStudents(ud);
       }
    };
    fetchStudents();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  const isWednesday = new Date(dateStr).getDay() === 3;

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      if(!database) return;
      
      const snap = await get(ref(database, `attendance/${dateStr}`));
      const data = snap.val() || {};
      setAttendances(data); // This is an object {uid: {timestamp}}
      setLoading(false);
    };
    fetchAttendance();
  }, [dateStr]);

  const togglePresence = async (uid) => {
     if(!isWednesday) {
        toast.error("Pilih hari Rabu untuk mengisi absensi!");
        return;
     }

     const isPresent = !!attendances[uid];
     const { adminMarkAttendance } = await import('@/lib/economyUtils');
     try {
       const success = await adminMarkAttendance(uid, dateStr, !isPresent);
       if(success) {
          setAttendances(prev => {
             const next = {...prev};
             if(isPresent) delete next[uid];
             else next[uid] = { timestamp: Date.now() };
             return next;
          });
       }
     } catch(err) {
       toast.error(err.message);
     }
  };

  const studentList = Object.keys(allStudents)
    .filter(uid => allStudents[uid].role !== 'admin')
    .map(uid => ({ uid, ...allStudents[uid] }))
    .filter(s => 
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div style={{ padding: '1rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
         <div>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Ekskul Attendance</h2>
           <p style={{ color: 'var(--text-muted)' }}>Sign the attendance sheet for the school meeting. Rewards will be sent automatically.</p>
         </div>
         <div style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: isWednesday ? '2px solid #10b981' : '1px solid var(--border-light)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Meeting Date</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <input 
                  type="date" 
                  value={dateStr} 
                  onChange={e => setDateStr(e.target.value)} 
                  style={{ border: 'none', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' }}
               />
               <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: isWednesday ? '#10b981' : '#fef2f2', color: isWednesday ? 'white' : '#ef4444', fontWeight: 'bold' }}>
                  {isWednesday ? 'Wednesday OK' : 'Not Wednesday'}
               </span>
            </div>
         </div>
       </div>

       <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
             <i className="ti ti-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
             <input 
                type="text" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '1rem' }} 
             />
          </div>
       </div>

       <div className="glass-panel" style={{ overflow: 'hidden', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 1rem' }}>
             <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Attendance Sheet: <span style={{ color: 'var(--primary)' }}>{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></h3>
             <div style={{ background: 'var(--bg-glass)', padding: '5px 15px', borderRadius: '50px', fontWeight: 'bold', border: '1px solid var(--border-light)' }}>
                {Object.keys(attendances).length} / {studentList.length} Present
             </div>
          </div>
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-dark)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderRadius: '12px 0 0 12px' }}>Student Profile</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>Email</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>Stats</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>Presence</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sheet...</td></tr>
              ) : studentList.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students found matching your search.</td></tr>
              ) : (
                studentList.map((stu) => {
                  const isPresent = !!attendances[stu.uid];
                  return (
                    <tr key={stu.uid} style={{ borderBottom: '1px solid var(--border-light)', background: isPresent ? 'rgba(16, 185, 129, 0.02)' : 'transparent' }}>
                      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                           width: '40px', height: '40px', borderRadius: '50%', 
                           background: isPresent ? '#10b981' : 'var(--border-light)',
                           color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold'
                        }}>
                          {(stu.fullName || stu.nickname || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: isPresent ? '#059669' : 'var(--text-main)' }}>{stu.fullName || stu.nickname}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stu.nickname && stu.nickname !== stu.fullName ? `AKA ${stu.nickname}` : 'Student'}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stu.email}</td>
                      <td style={{ padding: '1rem' }}>
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stu.points || 0} Pts • {stu.exp || 0} EXP</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                         <button 
                           onClick={() => togglePresence(stu.uid)}
                           title={!isWednesday ? "Pilih hari Rabu untuk mengisi absensi" : ""}
                           style={{ 
                             padding: '8px 20px', borderRadius: '50px', border: 'none', fontWeight: 'bold', 
                             cursor: !isWednesday ? 'not-allowed' : 'pointer',
                             background: isPresent ? '#10b981' : '#f1f5f9',
                             color: isPresent ? 'white' : '#64748b',
                             opacity: !isWednesday ? 0.5 : 1,
                             transition: 'all 0.2s'
                           }}
                         >
                           {isPresent ? <><i className="ti ti-check"></i> Present</> : 'Mark Present'}
                         </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          </div>
       </div>
    </div>
  );
}
