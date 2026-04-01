'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export default function LeaderboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [motm, setMotm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('main'); // 'main', 'motm', 'all'

  const fetchData = async () => {
    setLoading(true);
    if (!database) { setLoading(false); return; }
    
    try {
       const [usersSnap, configSnap] = await Promise.all([
          get(ref(database, 'users')),
          get(ref(database, 'config/motm'))
       ]);

       if(usersSnap.exists()) {
         const data = usersSnap.val();
         const sortedUsers = Object.keys(data)
           .filter(uid => data[uid].role !== 'admin')
           .map(uid => ({
             uid,
             name: data[uid].nickname || data[uid].fullName || data[uid].name,
             fullName: data[uid].fullName || data[uid].name || 'Student',
             photoUrl: data[uid].photoUrl || null,
             exp: data[uid].exp || 0,
             isCurrentUser: uid === profile?.uid
           }))
           .sort((a,b) => b.exp - a.exp);
         
         setLeaderboard(sortedUsers);
       }

       if (configSnap.exists()) {
          setMotm(configSnap.val());
       }
    } catch(err) {
       console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if(!authLoading && profile) {
      // eslint-disable-next-line
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  if (authLoading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading...</div>;
  }

  // --- RENDERING SUBSCREENS ---
  
  if (view === 'motm') {
     return (
       <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
         <button onClick={() => setView('main')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
           <i className="ti ti-arrow-left"></i> Back to Leaderboards
         </button>
         
         {motm ? (
           <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '3px solid var(--primary)', background: 'var(--gradient-primary)', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <i className="ti ti-award" style={{ position: 'absolute', right: '-20px', top: '-10px', fontSize: '12rem', opacity: 0.1 }}></i>
              
              <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                 <div style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', opacity: 0.9 }}>Member of the Month</div>
              </div>
              
              {motm.photoUrl ? (
                  <img src={motm.photoUrl} alt="MOTM" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', margin: '0 auto 1.5rem auto', position: 'relative', zIndex: 1, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }} />
              ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontWeight: 'bold', position: 'relative', zIndex: 1, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                     {(motm.name || 'S').charAt(0).toUpperCase()}
                  </div>
              )}
              
              <h3 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                 {motm.name}
              </h3>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', maxWidth: '90%', position: 'relative', zIndex: 1, fontStyle: 'italic', fontSize: '1.1rem', backdropFilter: 'blur(5px)' }}>
                 "{motm.quote}"
              </div>
           </div>
         ) : (
           <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <i className="ti ti-crown" style={{ fontSize: '3rem', color: 'var(--border-light)', marginBottom: '1rem' }}></i>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No Member of the Month yet</h3>
              <p style={{ color: 'var(--text-muted)' }}>The admin hasn't selected an outstanding member yet.</p>
           </div>
         )}
       </div>
     );
  }

  if (view === 'all') {
     return (
       <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
         <button onClick={() => setView('main')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
           <i className="ti ti-arrow-left"></i> Back to Leaderboards
         </button>
         
         <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>All Members</h2>
           <p style={{ color: 'var(--text-muted)' }}>Get to know everyone in the English Club!</p>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', gridColumn: '1 / -1' }}>No registered members yet.</div>
            ) : (
              leaderboard.sort((a,b) => a.fullName.localeCompare(b.fullName)).map(user => (
                <div key={user.uid} className="glass-panel" style={{ 
                  padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
                  background: user.uid === profile.uid ? 'var(--bg-glass)' : 'var(--bg-surface)',
                  border: user.uid === profile.uid ? '1px solid var(--primary)' : '1px solid var(--border-light)'
                }}>
                  
                  {user.photoUrl ? (
                     <img src={user.photoUrl} alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                     <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--border-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        {(user.name || 'S').charAt(0).toUpperCase()}
                     </div>
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                       {user.name} {user.uid === profile.uid && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>(You)</span>}
                    </div>
                    {user.name !== user.fullName && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.fullName}</div>
                    )}
                  </div>
                  
                  <div style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                     Member
                  </div>

                </div>
              ))
            )}
         </div>
       </div>
     );
  }

  // --- RENDERING DEFAULT VIEW (Top 5 + Buttons) ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Top 5 Leaderboard */}
      <div>
         <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Top 5 Players</h2>
           <p style={{ color: 'var(--text-muted)' }}>Rankings are based on total <strong>EXP</strong>.</p>
         </div>

         {loading ? (
           <div style={{ textAlign: 'center', padding: '2rem' }}>Syncing leaderboard...</div>
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No players yet.</div>
              ) : (
                leaderboard.slice(0, 5).map((user, idx) => (
                  <div key={user.uid} className="glass-panel" style={{ 
                    padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: user.uid === profile.uid ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-surface)',
                    border: user.uid === profile.uid ? '2px solid var(--primary)' : '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        background: user.photoUrl 
                           ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${user.photoUrl})` 
                           : (idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : 'var(--border-light)'),
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: user.photoUrl ? 'white' : (idx < 3 ? 'white' : 'var(--text-muted)'), 
                        fontWeight: 'bold', flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: user.uid === profile.uid ? 'bold' : 'normal', margin: 0 }}>
                          {user.name} {user.uid === profile.uid && '(You)'}
                        </h3>
                        {user.name !== user.fullName && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.fullName}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent)' }}>
                      {user.exp} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>EXP</span>
                    </div>
                  </div>
                ))
              )}
           </div>
         )}
      </div>

      {/* Grid Buttons */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          
          <button onClick={() => setView('motm')} className="glass-panel" style={{ 
            padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', 
            background: 'var(--bg-surface)', border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'all 0.2s' 
          }}>
             <i className="ti ti-star" style={{ fontSize: '2.5rem', color: '#fbbf24' }}></i>
             <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>MOTM</div>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Check out this month's spotlight!</div>
          </button>
          
          <button onClick={() => setView('all')} className="glass-panel" style={{ 
            padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', 
            background: 'var(--bg-surface)', border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'all 0.2s' 
          }}>
             <i className="ti ti-users" style={{ fontSize: '2.5rem', color: '#3b82f6' }}></i>
             <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>All Members</div>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Meet everyone in the club.</div>
          </button>

        </div>
      )}

    </div>
  );
}
