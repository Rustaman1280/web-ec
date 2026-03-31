'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getStreakData, recordAttendance } from '@/lib/economyUtils';

export default function StudentDashboard() {
  const router = useRouter();
  const { currentUser, profile, loading } = useAuth();
  const [streakData, setStreakData] = useState({ streakCount: 0, checkedInToday: false });
  const [loadingStreak, setLoadingStreak] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth/login');
    } else if (currentUser) {
      getStreakData(currentUser.uid).then(res => {
         setStreakData(res);
         setLoadingStreak(false);
      });
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
        
        <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
           <div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fbbf24' }}>{profile.points || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Points</div>
           </div>
           <div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent)' }}>{profile.exp || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>EXP</div>
           </div>
        </div>
      </div>

      {/* Attendance Horizontal UI */}
      {!loadingStreak && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Daily Claim <span style={{ color: 'var(--primary)' }}>🔥 {streakData.streakCount} Hari</span></h3>
             {!streakData.checkedInToday ? (
               <button className="btn-primary anim-pop" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem' }} onClick={async () => {
                 const res = await recordAttendance(currentUser.uid);
                 if (res && res.success) {
                   alert(`Daily claimed! +${res.rewardAmt} Pts & +${res.rewardAmt} EXP 🎉`);
                   window.location.reload();
                 }
               }}>
                 Klaim Bonus
               </button>
             ) : (
               <button disabled style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', background: '#e2e8f0', color: 'var(--text-muted)', border: 'none', fontWeight: 'bold' }}>
                 Terklaim <i className="ti ti-check"></i>
               </button>
             )}
           </div>

           <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
             {[5, 10, 15, 20, 30].map((rewardAmt, i) => {
                // Determine block state
                // If streakCount is 2 (checkedInToday=true), Day 1 & Day 2 are claimed (past & current focus)
                const isClaimed = streakData.streakCount > i || (streakData.checkedInToday && streakData.streakCount === i);
                const isTodayFocus = (!streakData.checkedInToday && streakData.streakCount === i) || (streakData.checkedInToday && streakData.streakCount - 1 === i);
                
                return (
                  <div key={i} style={{ 
                     flex: '0 0 auto',
                     width: '80px',
                     padding: '15px 10px',
                     borderRadius: '12px',
                     border: isTodayFocus ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                     background: isClaimed ? 'var(--bg-glass)' : (isTodayFocus ? '#fff' : '#f8fafc'),
                     display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                     boxShadow: isTodayFocus && !isClaimed ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none',
                     opacity: (!isClaimed && !isTodayFocus) ? 0.7 : 1
                  }}>
                     <div style={{ 
                        fontWeight: '900', 
                        color: isClaimed ? 'var(--text-muted)' : (isTodayFocus ? 'var(--primary)' : 'var(--text-main)'),
                        fontSize: '1rem' 
                     }}>
                        +{rewardAmt}
                     </div>
                     <div style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: isClaimed ? '#e2e8f0' : '#fbbf24', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: isClaimed ? 'var(--text-muted)' : 'white', fontWeight: 'bold', fontSize: '1.2rem',
                        boxShadow: !isClaimed ? 'inset 0 -3px 0 rgba(0,0,0,0.1)' : 'none'
                     }}>
                        <i className={isClaimed ? "ti ti-check" : "ti ti-star"}></i>
                     </div>
                     <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isTodayFocus ? 'var(--primary)' : 'var(--text-muted)' }}>
                        Hari {i+1}
                     </div>
                  </div>
                );
             })}
           </div>
        </div>
      )}

      {/* Featured Action (Live Quiz) */}
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

      {/* Grid Menu */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
