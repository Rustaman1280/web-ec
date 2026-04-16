'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllQuizHistory } from '@/lib/firebaseUtils';

export default function AdminQuizHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllQuizHistory().then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white' };
    if (rank === 2) return { emoji: '🥈', bg: 'linear-gradient(135deg, #94a3b8, #64748b)', color: 'white' };
    if (rank === 3) return { emoji: '🥉', bg: 'linear-gradient(135deg, #ea580c, #c2410c)', color: 'white' };
    return { emoji: '#' + rank, bg: '#e2e8f0', color: '#333' };
  };

  return (
    <div className="container" style={{ padding: '0.5rem 1.5rem', paddingLeft: '0' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
         <div>
           <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Quiz History</h2>
           <p style={{ color: 'var(--text-muted)' }}>
             Browse all past live quiz sessions and their results.
           </p>
         </div>
         <Link href="/admin/live" className="btn-primary" style={{ background: '#e2e8f0', color: 'var(--text-main)', textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <i className="ti ti-arrow-left"></i> Back to Quizzes
         </Link>
       </div>

       {loading ? (
         <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading quiz history...</div>
       ) : history.length === 0 ? (
         <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
           <i className="ti ti-history-off" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}></i>
           No quiz sessions have been played yet.
         </div>
       ) : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {history.map((h) => (
             <div key={h.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
             >
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <i className="ti ti-device-gamepad" style={{ color: 'var(--primary)' }}></i>
                         {h.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                         <span><i className="ti ti-calendar"></i> {new Date(h.playedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                         <span><i className="ti ti-clock"></i> {new Date(h.playedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                         <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>{h.totalParticipants}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Players</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                         <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent)' }}>{h.totalQuestions}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Questions</div>
                      </div>
                      <div style={{ background: 'var(--bg-surface)', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                         <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{h.pin}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PIN</div>
                      </div>
                   </div>
                </div>

                {/* Top Players */}
                <div style={{ padding: '1.5rem 2rem' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Top Players</div>
                   <div style={{ display: 'flex', gap: '12px' }}>
                      {(h.topPlayers || []).map((p) => {
                         const badge = getRankBadge(p.rank);
                         return (
                            <div key={p.id} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                               <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: badge.bg, color: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 'bold', flexShrink: 0 }}>
                                  {badge.emoji}
                               </div>
                               <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{p.score} pts</div>
                               </div>
                               {p.correctCount !== undefined && (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', fontWeight: 'bold', borderLeft: '1px solid var(--border-light)', paddingLeft: '10px' }}>
                                     <span style={{ color: '#10b981' }}><i className="ti ti-check"></i> {p.correctCount}</span>
                                     <span style={{ color: '#ef4444' }}><i className="ti ti-x"></i> {p.wrongCount}</span>
                                  </div>
                               )}
                            </div>
                         );
                      })}
                      {(!h.topPlayers || h.topPlayers.length === 0) && (
                         <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No players recorded.</div>
                      )}
                   </div>
                </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
}
