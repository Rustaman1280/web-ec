'use client';
import { useAuth } from '@/hooks/useAuth';

export default function TasksPage() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return <div style={{ textAlign: 'center', marginTop: '30vh' }}>Loading Tasks...</div>;
  }

  // Placeholder Tasks Data
  const tasks = [
    { title: 'Grammar Basics Quiz', type: 'Required', status: 'Pending', reward: '+100 pts' },
    { title: 'Reading Comprehension 1', type: 'Optional', status: 'Pending', reward: '+50 pts' },
    { title: 'Vocabulary List A', type: 'Practice', status: 'Completed', reward: '+20 pts' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="heading-xl" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your Tasks</h2>
        <p style={{ color: 'var(--text-muted)' }}>Complete assignments to earn points.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.map((task, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>{task.title}</h3>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{task.type}</span> • 
                <span style={{ color: task.status === 'Completed' ? '#10b981' : '#f59e0b' }}>{task.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{task.reward}</span>
              {task.status !== 'Completed' && (
                <button style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  Start
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
