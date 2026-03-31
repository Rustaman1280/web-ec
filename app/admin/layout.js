import AdminGuard from '@/components/AdminGuard';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-dark)',
        display: 'flex',
        position: 'relative'
      }}>
        
        <AdminSidebar />
        
        <main style={{ flex: 1, padding: '1rem', paddingLeft: '0', overflowY: 'auto' }}>
          {children}
        </main>
        
        {/* Visual warning for small screens */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1024px) {
            #desktop-warning {
              display: flex !important;
            }
          }
        `}} />
        <div id="desktop-warning" className="glass-panel" style={{
          display: 'none',
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          textAlign: 'center', padding: '2rem'
        }}>
          <h2 className="heading-xl" style={{ fontSize: '3rem' }}>Desktop Required</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '500px' }}>
            The Admin Control Panel is optimized for large screens. Please view this on a desktop browser or projector.
          </p>
        </div>
      </div>
    </AdminGuard>
  );
}
