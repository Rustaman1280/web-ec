'use client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { getDailyStreakData } from '@/lib/economyUtils';

export default function MemberTopbar() {
  const { currentUser, profile } = useAuth();
  const [streakData, setStreakData] = useState({ streakCount: 0 });

  useEffect(() => {
    if (currentUser) {
      getDailyStreakData(currentUser.uid).then(res => setStreakData(res));
    }
  }, [currentUser]);

  return (
      <header style={{
        padding: '0.8rem 1.2rem',
        borderBottom: '1px solid var(--border-light)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-glass)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
         {/* Left Side: Streak & Points */}
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
               <i className="ti ti-flame" style={{ color: '#ef4444', fontSize: '1.1rem' }}></i>
               <span style={{ fontWeight: '900', color: '#ef4444', fontSize: '0.9rem' }}>{streakData.streakCount || 0}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
               <i className="ti ti-coin" style={{ color: '#fbbf24', fontSize: '1.1rem' }}></i>
               <span style={{ fontWeight: '900', color: '#fbbf24', fontSize: '0.9rem' }}>{profile?.points || 0}</span>
            </div>
         </div>

         {/* Right Side: EXP */}
         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
            <i className="ti ti-star" style={{ color: 'var(--accent)', fontSize: '1.1rem' }}></i>
            <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '0.9rem' }}>{profile?.exp || 0} EXP</span>
         </div>
      </header>
  );
}
