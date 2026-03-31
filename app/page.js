import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'English Club | Join Platform',
  description: 'Interactive real-time quiz platform for English Club members',
}

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h1 className="heading-xl">English Club <br/><span className="text-gradient">Challenge</span></h1>
          <p className={styles.subtitle}>Test your skills in real-time battles!</p>
          
          <div className={styles.actions}>
            <Link href="/member" className="btn-primary" style={{ display: 'block', width: '100%', marginBottom: '1rem', textDecoration: 'none' }}>
              Join a Quiz Now
            </Link>
            
            <Link href="/admin" className={styles.adminLink}>
              Admin Login Access
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
