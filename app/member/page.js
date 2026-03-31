'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
export default function StudentDashboard() {
  const router = useRouter();
  const { currentUser, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', alignItems: 'center', marginTop: '30vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Student Profile...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Profile Header */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Hi, <span className="text-gradient">{profile.name}</span></h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Student Account</div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fbbf24' }}>{profile.totalScore || 0}</div>
           <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Points</div>
        </div>
      </div>

      {/* Featured Action */}
      <div className="glass-panel" style={{ padding: '2.5rem', background: 'var(--gradient-primary)', border: 'none', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Live Quiz</h3>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>Join an active classroom session being shown on the projector.</p>
          <Link href="/member/join" className="btn-primary" style={{ background: '#fff', color: 'var(--primary)', padding: '10px 30px', textDecoration: 'none', display: 'inline-block' }}>
            Enter Game PIN
          </Link>
        </div>
        {/* Background Decoration */}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '10rem', opacity: 0.1, fontWeight: '900' }}>?</div>
      </div>

      {/* Grid Menu */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button className="glass-panel" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
           <i className="ti ti-notebook" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i>
           <div style={{ fontWeight: 'bold' }}>Practice Tests</div>
        </button>
        <button className="glass-panel" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
           <i className="ti ti-device-gamepad-2" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}></i>
           <div style={{ fontWeight: 'bold' }}>Mini Games</div>
        </button>
        <button className="glass-panel" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
           <i className="ti ti-medal" style={{ fontSize: '2.5rem', color: '#fbbf24' }}></i>
           <div style={{ fontWeight: 'bold' }}>Leaderboards</div>
        </button>
        <button className="glass-panel" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
           <i className="ti ti-award" style={{ fontSize: '2.5rem', color: '#10b981' }}></i>
           <div style={{ fontWeight: 'bold' }}>Badges</div>
        </button>
      </div>

    </div>
  );
}
