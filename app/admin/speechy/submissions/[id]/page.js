'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { database, getSpeechySubmissions } from '@/lib/firebaseUtils';
import { ref, get } from 'firebase/database';
import Link from 'next/link';

export default function SpeechySubmissions() {
  const params = useParams();
  const bankId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [bankTitle, setBankTitle] = useState('Loading...');
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!bankId) return;
    const fetchData = async () => {
      // Get bank title
      const bankSnap = await get(ref(database, `speechy_banks/${bankId}`));
      if (bankSnap.exists()) {
        setBankTitle(bankSnap.val().title || 'Speechy Task');
      }

      const submissionsObj = await getSpeechySubmissions(bankId);
      const subArray = Object.entries(submissionsObj)
        .map(([uid, data]) => ({ uid, ...data }))
        .sort((a, b) => b.accuracy - a.accuracy); // Sort highest accuracy first
      
      setSubmissions(subArray);
      setLoading(false);
    };
    fetchData();
  }, [bankId]);

  return (
    <div className="container" style={{ padding: '0.5rem 1.5rem', paddingLeft: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
        <Link href="/admin/speechy" className="btn-primary" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-light)', textDecoration: 'none', padding: '10px 15px' }}>
          <i className="ti ti-arrow-left"></i> Back
        </Link>
        <div>
          <h2 className="heading-xl" style={{ margin: 0, fontSize: '2rem' }}>Submissions</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{bankTitle}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <i className="ti ti-loader rotate" style={{ fontSize: '2rem', marginBottom: '10px' }}></i><br />
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
            No one has submitted this task yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '15px' }}>Rank</th>
                  <th style={{ padding: '15px' }}>Student Name</th>
                  <th style={{ padding: '15px' }}>Highest Accuracy</th>
                  <th style={{ padding: '15px' }}>Completed On</th>
                  <th style={{ padding: '15px' }}>Transcript Match</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => (
                  <tr key={sub.uid} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                     <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '1.2rem', color: idx < 3 ? 'var(--primary)' : 'var(--text-main)' }}>#{idx + 1}</td>
                     <td style={{ padding: '15px', fontWeight: 'bold' }}>{sub.name}</td>
                     <td style={{ padding: '15px' }}>
                        <span style={{ 
                            background: sub.accuracy >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                            color: sub.accuracy >= 80 ? '#10b981' : '#f59e0b',
                            padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold'
                        }}>
                            {Math.round(sub.accuracy || sub.bestAccuracy)}%
                        </span>
                     </td>
                     <td style={{ padding: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {new Date(sub.lastPlayedAt).toLocaleString()}
                     </td>
                     <td style={{ padding: '15px' }}>
                        <button 
                            onClick={() => alert(sub.transcript)} 
                            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                            View Recording Text
                        </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
