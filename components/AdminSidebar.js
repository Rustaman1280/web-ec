'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/lib/authUtils';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menu = [
    { name: 'Dashboard', path: '/admin', icon: 'ti-dashboard' },
    { name: 'Live Quizzes', path: '/admin/live', icon: 'ti-device-tv' },
    { name: 'Task Manager', path: '/admin/tasks', icon: 'ti-clipboard-list' },
    { name: 'Student Management', path: '/admin/students', icon: 'ti-users' },
    { name: 'Attendance', path: '/admin/attendance', icon: 'ti-calendar-check' },
  ];

  return (
    <div className="glass-panel" style={{ 
      width: '280px', height: 'calc(100vh - 2rem)', 
      margin: '1rem', display: 'flex', flexDirection: 'column', 
      position: 'sticky', top: '1rem', flexShrink: 0
    }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
         <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>
           EC <span className="text-gradient">Admin</span>
         </h1>
         <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>Control Panel</div>
      </div>
      
      <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
         {menu.map(item => {
           // Exact match for dashboard, startswith for subroutes
           const isActive = item.path === '/admin' ? pathname === item.path : pathname.startsWith(item.path);
           return (
             <Link key={item.name} href={item.disabled ? '#' : item.path} style={{
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
  );
}
