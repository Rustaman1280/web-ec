'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GamesHub() {
  const router = useRouter();

  return (
    <div style={{ padding: '2rem 1.5rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/member')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>Games <i className="ti ti-device-gamepad-2" style={{ color: 'var(--accent)' }}></i></h2>
        <p style={{ color: 'var(--text-muted)' }}>Play interactive games to improve your English skills.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
         {/* Speechy Game Card */}
         <Link href="/member/speechy" className="glass-panel" style={{ 
            padding: '1.5rem', 
            borderLeft: '4px solid #f43f5e',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            position: 'relative',
            textDecoration: 'none',
            color: 'inherit'
         }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f43f5e20', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  <i className="ti ti-microphone-2"></i>
               </div>
               <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Speaking Lab (Speechy)</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                     Train your pronunciation
                  </div>
               </div>
            </div>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: '0' }}>Read the texts aloud and get evaluated instantly word by word.</p>
            <div className="btn-primary" style={{ textAlign: 'center', background: '#f43f5e', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none' }}>
               Play Speechy
            </div>
         </Link>

         {/* More games can be added here in the future */}
      </div>
    </div>
  );
}
