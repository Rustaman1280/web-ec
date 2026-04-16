'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { currentUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (currentUser && profile) {
        if (profile.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/member');
        }
      } else {
        router.push('/auth/login');
      }
    }
  }, [currentUser, profile, loading, router]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 'bold' }}>
      Loading...
    </div>
  );
}
