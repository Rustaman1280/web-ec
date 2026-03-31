'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser, getUserProfile } from '@/lib/authUtils';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      // Wait for profile verification (optional runtime check)
      const profile = await getUserProfile(user.uid);
      if(profile?.role === 'admin') {
         router.push('/admin');
      } else {
         router.push('/member');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please try again or check your Firebase credentials.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="heading-xl" style={{ fontSize: '2.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to continue your journey</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input 
            type="email" 
            placeholder="Student Email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
