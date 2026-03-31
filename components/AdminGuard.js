'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }) {
  const { currentUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser || profile?.role !== 'admin') {
         router.push('/auth/login');
      }
    }
  }, [currentUser, profile, loading, router]);

  if(loading || !profile || profile.role !== 'admin') {
     return <div style={{textAlign: 'center', marginTop: '40vh', color: 'var(--text-main)', fontSize: '1.2rem'}}>Verifying Admin Access...</div>;
  }

  return <>{children}</>;
}
