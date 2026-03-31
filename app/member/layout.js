import BottomBar from '@/components/BottomBar';

export default function MemberLayout({ children }) {
  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-dark)',
      position: 'relative',
      boxShadow: '0 0 50px rgba(0,0,0,0.05)',
      overflowX: 'hidden'
    }}>
      {/* Small mobile header */}
      <header style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border-light)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-glass)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>EC <span className="text-gradient">Quiz</span></h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Player Mode</div>
        </div>
      </header>
      
      <main style={{ padding: '1.5rem', minHeight: 'calc(100vh - 65px)', paddingBottom: '90px' }}>
        {children}
      </main>

      <BottomBar />
    </div>
  );
}
