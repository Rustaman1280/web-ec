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

      {/* Attendance & Featured Action */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0, 2fr)', gap: '1.5rem' }}>
         <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-glass)', border: '2px solid var(--primary)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Daily Check-In</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Get +5 EXP every day!</p>
            <button className="btn-primary anim-pop" style={{ padding: '10px 20px', borderRadius: '8px' }} onClick={async (e) => {
              const { recordAttendance } = await import('@/lib/economyUtils');
              const success = await recordAttendance(profile.id);
              if (success) {
                alert("Attendance recorded! +5 EXP 🎉");
                window.location.reload();
              } else {
                alert("You already checked in today.");
              }
            }}>
               Hadir Hari Ini <i className="ti ti-calendar-check"></i>
            </button>
         </div>
         
         <div className="glass-panel" style={{ padding: '2.5rem', background: 'var(--gradient-primary)', border: 'none', position: 'relative', overflow: 'hidden' }}>
           <div style={{ position: 'relative', zIndex: 1 }}>
             <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Live Quiz</h3>
             <p style={{ marginBottom: '1.5rem', color: 'white', opacity: 0.9 }}>Join an active classroom session being shown on the projector.</p>
             <Link href="/member/join" className="btn-primary" style={{ background: '#fff', color: 'var(--primary)', padding: '10px 30px', textDecoration: 'none', display: 'inline-block' }}>
               Enter Game PIN
             </Link>
           </div>
           {/* Background Decoration */}
           <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '10rem', opacity: 0.1, fontWeight: '900', color: 'white' }}>?</div>
         </div>
      </div>

      {/* Grid Menu */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
        <Link href="/member/history" className="glass-panel" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
           <i className="ti ti-history" style={{ fontSize: '2.5rem', color: '#10b981' }}></i>
           <div style={{ fontWeight: 'bold' }}>Ledger</div>
        </Link>
        <Link href="/member/transfer" className="glass-panel" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
           <i className="ti ti-send" style={{ fontSize: '2.5rem', color: '#3b82f6' }}></i>
           <div style={{ fontWeight: 'bold' }}>Share Pts</div>
        </Link>
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
