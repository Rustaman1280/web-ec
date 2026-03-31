'use client';
import { useAuth } from '@/hooks/useAuth';

export default function LeaderboardPage() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading...</div>;
  }

  // Simulated global top students
  const leaderboard = [
    { name: 'Siti Aminah', score: 3450 },
    { name: profile.name, score: profile.totalScore || 0, isCurrentUser: true }, // Put current user in the mix to feel real
    { name: 'Budi Santoso', score: 2100 },
    { name: 'Kevin Wijaya', score: 1850 },
    { name: 'Rini Rahma', score: 900 }
  ].sort((a,b) => b.score - a.score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Top Players</h2>
        <p style={{ color: 'var(--text-muted)' }}>Compete to reach the #1 spot!</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {leaderboard.map((user, idx) => (
          <div key={idx} className="glass-panel" style={{ 
            padding: '1.5rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: user.isCurrentUser ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-surface)',
            border: user.isCurrentUser ? '2px solid var(--primary)' : '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '40px', height: '40px', 
                borderRadius: '50%', 
                background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : 'var(--border-light)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: idx < 3 ? 'white' : 'var(--text-muted)', fontWeight: 'bold'
              }}>
                {idx + 1}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: user.isCurrentUser ? 'bold' : 'normal' }}>
                {user.name} {user.isCurrentUser && '(You)'}
              </h3>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>
              {user.score} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
