'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export default function LeaderboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    if (!database) { setLoading(false); return; }
    
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if(snapshot.exists()) {
      const data = snapshot.val();
      // Map and sort by exp
      const sortedUsers = Object.keys(data)
        .filter(uid => data[uid].role !== 'admin') // Exclude admins
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
    setLoading(false);
  };

  useEffect(() => {
    if(!authLoading && profile) {
      // eslint-disable-next-line
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  if (authLoading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Top Players</h2>
        <p style={{ color: 'var(--text-muted)' }}>Rankings are based on total <strong>EXP</strong>.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center' }}>Syncing leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No players yet.</div>
        ) : (
          leaderboard.map((user, idx) => (
            <div key={user.uid} className="glass-panel" style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: user.uid === profile.uid ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-surface)',
              border: user.uid === profile.uid ? '2px solid var(--primary)' : '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', height: '40px', 
                  borderRadius: '50%', 
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
    </div>
  );
}
