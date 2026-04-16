'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/lib/authUtils';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menu = [
    { name: 'Dashboard', path: '/admin', icon: 'ti-dashboard' },
    { name: 'Live Quizzes', path: '/admin/live', icon: 'ti-device-tv' },
    { name: 'Speechy Games', path: '/admin/speechy', icon: 'ti-microphone' },
    { name: 'Task Manager', path: '/admin/tasks', icon: 'ti-clipboard-list' },
    { name: 'Student Management', path: '/admin/students', icon: 'ti-users' },
    { name: 'Attendance', path: '/admin/attendance', icon: 'ti-calendar-check' },
    { name: 'Member of Month', path: '/admin/motm', icon: 'ti-award' },
    { name: 'Points & EXP Control', path: '/admin/economy', icon: 'ti-scale-outline' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .admin-mobile-header {
           display: none;
        }
        .admin-sidebar-drawer {
           position: sticky;
           top: 1rem;
           margin: 1rem;
           width: 280px;
           height: calc(100vh - 2rem);
           flex-shrink: 0;
           transition: transform 0.3s ease;
           z-index: 1000;
        }
        .admin-sidebar-overlay {
           display: none;
        }

        @media (max-width: 1024px) {
           .admin-mobile-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1rem;
              background: var(--bg-glass);
              border-bottom: 1px solid var(--border-light);
              backdrop-filter: blur(10px);
              position: sticky;
              top: 0;
              z-index: 900;
           }
           .admin-sidebar-drawer {
              position: fixed;
              top: 0;
              left: 0;
              height: 100vh;
              margin: 0;
              border-radius: 0;
              transform: translateX(-100%);
              background: var(--bg-dark);
              box-shadow: 4px 0 15px rgba(0,0,0,0.1);
           }
           .admin-sidebar-drawer.open {
              transform: translateX(0);
           }
           .admin-sidebar-overlay.open {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.5);
              z-index: 999;
           }
        }
      `}} />

      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
         <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setIsOpen(true)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)', padding: '5px' }}>
               <i className="ti ti-menu-2"></i>
            </button>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>
               EC <span className="text-gradient">Admin</span>
            </h1>
         </div>
      </div>

      {/* Mobile Overlay */}
      <div className={`admin-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>

      {/* Actual Sidebar */}
      <div className={`glass-panel admin-sidebar-drawer ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
             <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>
               EC <span className="text-gradient">Admin</span>
             </h1>
             <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>Control Panel</div>
           </div>
           
           <button className="admin-mobile-header" onClick={() => setIsOpen(false)} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <i className="ti ti-x"></i>
           </button>
        </div>
        
        <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
           {menu.map(item => {
             const isActive = item.path === '/admin' ? pathname === item.path : pathname.startsWith(item.path);
             return (
               <Link key={item.name} href={item.disabled ? '#' : item.path} onClick={() => setIsOpen(false)} style={{
                 display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                 borderRadius: '12px', textDecoration: 'none', transition: 'all 0.2s',
                 background: isActive ? 'var(--gradient-primary)' : 'transparent',
                 color: isActive ? 'white' : (item.disabled ? 'var(--text-muted)' : 'var(--text-main)'),
                 fontWeight: isActive ? 'bold' : '600',
                 pointerEvents: item.disabled ? 'none' : 'auto',
                 opacity: item.disabled ? 0.3 : 1
               }}>
                 <i className={`ti ${item.icon}`} style={{ fontSize: '1.4rem' }}></i>
                 <span>{item.name}</span>
               </Link>
             );
           })}
        </div>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-light)' }}>
           <button onClick={() => { logoutUser().then(() => { window.location.href='/'; }); }} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
              width: '100%', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.2)', 
              cursor: 'pointer', transition: 'all 0.2s'
           }}>
             <i className="ti ti-logout" style={{ fontSize: '1.4rem' }}></i>
             <span>Sign Out</span>
           </button>
        </div>
      </div>
    </>
  );
}
