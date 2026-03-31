'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerStudent } from '@/lib/authUtils';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if(password.length < 6) {
         setError('Password must be at least 6 characters.');
         setLoading(false);
         return;
      }
      await registerStudent(name, email, password);
      router.push('/member');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="heading-xl" style={{ fontSize: '2.5rem' }}>Join the Club</h2>
          <p style={{ color: 'var(--text-muted)' }}>Create your Student Account</p>
        </div>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input 
            type="text" 
            placeholder="Full Name (for Leaderboard)" 
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input 
            type="email" 
            placeholder="Student Email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Create Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
