export default function AdminLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-dark)',
      position: 'relative'
    }}>
      <header className="glass-panel" style={{
        padding: '1.5rem 3rem',
        margin: '1rem',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: '1rem',
        zIndex: 50
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
          EC Admin <span className="text-gradient">Control Panel</span>
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
             Host Area
          </div>
        </div>
      </header>
      
      <main style={{ padding: '1rem 3rem' }}>
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        textAlign: 'center', padding: '2rem'
      }}>
        <h2 className="heading-xl" style={{ fontSize: '3rem' }}>Desktop Required</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '500px' }}>
          The Admin Projector View is optimized for large screens. Please view this on a desktop browser or projector.
        </p>
      </div>
    </div>
  );
}
