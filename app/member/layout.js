import BottomBar from '@/components/BottomBar';
import MemberTopbar from '@/components/MemberTopbar';

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
      {/* Stats Mobile Header */}
      <MemberTopbar />
      
      <main style={{ padding: '1.5rem', minHeight: 'calc(100vh - 65px)', paddingBottom: '90px' }}>
        {children}
      </main>

      <BottomBar />
    </div>
  );
}
