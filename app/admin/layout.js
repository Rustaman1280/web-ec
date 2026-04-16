'use client';
import { usePathname } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isQuizProjector = pathname?.includes('/quiz/');

  return (
    <AdminGuard>
      <div className="admin-layout-container" style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-dark)',
        display: 'flex',
        position: 'relative'
      }}>
        
        {!isQuizProjector && <AdminSidebar />}
        
        <main className="admin-main-content" style={{ flex: 1, padding: isQuizProjector ? '0' : '1rem', paddingLeft: isQuizProjector ? '0' : '1rem', overflowY: 'auto' }}>
          {children}
        </main>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1024px) {
            .admin-layout-container {
               flex-direction: column !important;
            }
            .admin-main-content {
              padding-left: ${isQuizProjector ? '0' : '1rem'} !important;
            }
          }
        `}} />
      </div>
    </AdminGuard>
  );
}
