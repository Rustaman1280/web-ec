'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomBar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Home', path: '/member', icon: 'ti-home' },
    { name: 'Tasks', path: '/member/tasks', icon: 'ti-clipboard-list' },
    { name: 'Leaderboard', path: '/member/leaderboard', icon: 'ti-trophy' },
    { name: 'Profile', path: '/member/profile', icon: 'ti-user' }
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: 'var(--bg-surface)', 
      borderTop: '1px solid var(--border-light)',
      display: 'flex', justifyContent: 'space-around', 
      padding: '12px 0', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      zIndex: 100, boxShadow: '0 -4px 15px rgba(0,0,0,0.03)',
      maxWidth: '480px', margin: '0 auto'
    }}>
       {navItems.map(item => {
         const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/member');
         return (
           <Link key={item.name} href={item.path} style={{
             display: 'flex', flexDirection: 'column', alignItems: 'center',
             color: isActive ? 'var(--primary)' : 'var(--text-muted)',
             textDecoration: 'none', gap: '6px'
           }}>
             <i className={`ti ${item.icon}`} style={{ fontSize: '1.6rem' }}></i>
             <span style={{ fontSize: '0.75rem', fontWeight: isActive ? '700' : '500' }}>{item.name}</span>
           </Link>
         );
       })}
    </div>
  );
}
