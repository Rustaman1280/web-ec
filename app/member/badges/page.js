'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function BadgesPage() {
  const { currentUser, profile, loading: authLoading } = useAuth();
  
  // All possible badges in the game/club
  const ALL_BADGES = [
    { id: 'motm', name: 'Member of the Month', icon: 'ti-star', desc: 'Awarded by the Admin for outstanding monthly performance.', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
    { id: 'first_quiz', name: 'Ice Breaker', icon: 'ti-device-gamepad-2', desc: 'Participated in your first Live Quiz.', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { id: 'rich', name: 'Wealthy Student', icon: 'ti-coin', desc: 'Accumulated over 1,000 Points.', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  ];

  if (authLoading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading...</div>;
  }

  const userBadges = profile.badges || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href="/member" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="ti ti-arrow-left"></i> Back
        </Link>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Trophy Room</h2>
        <p style={{ color: 'var(--text-muted)' }}>Collect badges to show off your achievements to the club!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
        
        {ALL_BADGES.map(badgeDef => {
           const isUnlocked = !!userBadges[badgeDef.id];
           const earnedDate = isUnlocked ? new Date(userBadges[badgeDef.id].earnedAt).toLocaleDateString() : null;

           return (
             <div key={badgeDef.id} className="glass-panel" style={{ 
               padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem',
               background: isUnlocked ? 'var(--bg-glass)' : 'var(--bg-surface)',
               border: isUnlocked ? `2px solid ${badgeDef.color}` : '1px solid var(--border-light)',
               opacity: isUnlocked ? 1 : 0.6,
               filter: isUnlocked ? 'none' : 'grayscale(100%)',
               position: 'relative', overflow: 'hidden'
             }}>
                
                {isUnlocked && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: badgeDef.bg, zIndex: 0 }}></div>
                )}
                
                <div style={{ 
                   width: '70px', height: '70px', borderRadius: '50%', 
                   background: isUnlocked ? badgeDef.color : 'var(--border-light)', 
                   display: 'flex', justifyContent: 'center', alignItems: 'center', 
                   color: 'white', fontSize: '2.5rem', zIndex: 1,
                   boxShadow: isUnlocked ? `0 4px 15px ${badgeDef.bg}` : 'none'
                }}>
                   <i className={`ti ${badgeDef.icon}`}></i>
                </div>
                
                <div style={{ zIndex: 1 }}>
                   <div style={{ fontWeight: '900', fontSize: '1.1rem', color: isUnlocked ? badgeDef.color : 'var(--text-main)', lineHeight: '1.2', marginBottom: '4px' }}>
                      {badgeDef.name}
                   </div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isUnlocked ? `Unlocked: ${earnedDate}` : 'Locked'}
                   </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', zIndex: 1, lineHeight: '1.4', marginTop: '0.5rem' }}>
                   {badgeDef.desc}
                </div>
             </div>
           );
        })}

      </div>

    </div>
  );
}
