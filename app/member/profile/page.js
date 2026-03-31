'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/authUtils';

export default function ProfilePage() {
  const { currentUser, profile, loading } = useAuth();
  const router = useRouter();

  if (loading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading...</div>;
  }

  const handleLogout = async () => {
    await logoutUser();
    router.push('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ 
          width: '100px', height: '100px', 
          borderRadius: '50%', background: 'var(--gradient-primary)', 
          margin: '0 auto 1.5rem', display: 'flex', 
          justifyContent: 'center', alignItems: 'center',
          color: 'white', fontSize: '3rem', fontWeight: 'bold'
        }}>
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="heading-xl" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{profile.name}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{currentUser.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Score</div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>{profile.totalScore || 0}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Quizzes Played</div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent)' }}>{profile.quizzesPlayed || 0}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '1rem' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontWeight: '500' }}>Account Settings</span>
            <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)' }}></i>
          </li>
          <li style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontWeight: '500' }}>Notification Preferences</span>
            <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)' }}></i>
          </li>
          <li style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontWeight: '500' }}>Help & Support</span>
            <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)' }}></i>
          </li>
        </ul>
      </div>

      <button onClick={handleLogout} style={{ 
        padding: '1rem', width: '100%', 
        background: 'rgba(239, 68, 68, 0.1)', 
        color: '#ef4444', 
        borderRadius: '16px', 
        fontWeight: 'bold', fontSize: '1.1rem',
        marginTop: '1rem' 
      }}>
        Sign Out
      </button>

    </div>
  );
}
