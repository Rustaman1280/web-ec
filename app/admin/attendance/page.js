'use client';
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

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      if(!database) return;
      
      const snap = await get(ref(database, `attendance/${dateStr}`));
      if(snap.exists()) {
         const data = snap.val();
         // Transform to array
         const arr = Object.keys(data).map(uid => ({
            uid,
            timestamp: data[uid].timestamp
         })).sort((a,b) => b.timestamp - a.timestamp);
         setAttendances(arr);
      } else {
         setAttendances([]);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [dateStr]);

  return (
    <div style={{ padding: '1rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
         <div>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Attendance Monitor</h2>
           <p style={{ color: 'var(--text-muted)' }}>Track daily check-ins from students to award their streak and monitor activity.</p>
         </div>
         <div style={{ background: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Filter Date</label>
            <input 
               type="date" 
               value={dateStr} 
               onChange={e => setDateStr(e.target.value)} 
               style={{ border: 'none', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none' }}
            />
         </div>
       </div>

       <div className="glass-panel" style={{ overflow: 'hidden', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 1rem' }}>
             <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>Record for <span style={{ color: 'var(--primary)' }}>{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></h3>
             <div style={{ background: 'var(--bg-glass)', padding: '5px 15px', borderRadius: '50px', fontWeight: 'bold', border: '1px solid var(--border-light)' }}>
                {attendances.length} Students Present
             </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-dark)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderRadius: '12px 0 0 12px' }}>Student Profile</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>Email</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>Check-in Time</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderRadius: '0 12px 12px 0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</td></tr>
              ) : attendances.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No one checked in on this date.</td></tr>
              ) : (
                attendances.map((att) => {
                  const stu = allStudents[att.uid] || { fullName: 'Unknown User', email: 'N/A' };
                  return (
                    <tr key={att.uid} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                           width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)',
                           color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold'
                        }}>
                          {stu.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{stu.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stu.nickname ? `AKA ${stu.nickname}` : ''}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{stu.email}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                         {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                         <span style={{ background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            <i className="ti ti-check"></i> Present
                         </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
       </div>
    </div>
  );
}
