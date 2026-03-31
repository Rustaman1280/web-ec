import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="admin-layout-container" style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-dark)',
        display: 'flex',
        position: 'relative'
      }}>
        
        <AdminSidebar />
        
        <main className="admin-main-content" style={{ flex: 1, padding: '1rem', paddingLeft: '0', overflowY: 'auto' }}>
          {children}
        </main>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1024px) {
            .admin-layout-container {
               flex-direction: column !important;
            }
            .admin-main-content {
              padding-left: 1rem !important;
            }
          }
        `}} />
      </div>
    </AdminGuard>
  );
}
