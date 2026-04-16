'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPlayerQuizHistory } from '@/lib/firebaseUtils';
import Link from 'next/link';

export default function MemberQuizHistory() {
  const { currentUser, profile } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      getPlayerQuizHistory(currentUser.uid).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [currentUser]);

  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white', emoji: '🥇', label: 'Champion' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #94a3b8, #64748b)', color: 'white', emoji: '🥈', label: '2nd Place' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #ea580c, #c2410c)', color: 'white', emoji: '🥉', label: '3rd Place' };
    return { bg: 'var(--bg-surface)', color: 'var(--text-main)', emoji: '🎮', label: 'Finished' };
  };

  // Stats
  const totalGames = history.length;
  const totalWins = history.filter(h => h.myRank === 1).length;
  const topFinishes = history.filter(h => h.myRank <= 3).length;
  const avgScore = totalGames > 0 ? Math.round(history.reduce((s, h) => s + h.myScore, 0) / totalGames) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h2 className="heading-xl" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quiz History</h2>
            <p style={{ color: 'var(--text-muted)' }}>Your performance across all live quiz sessions.</p>
         </div>
         <Link href="/member" className="btn-primary" style={{ background: '#e2e8f0', color: 'var(--text-main)', textDecoration: 'none', padding: '10px 20px' }}>
            Back to Dashboard
         </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
         <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', background: 'var(--gradient-primary)', color: 'white', borderRadius: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900' }}>{totalGames}</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Games Played</div>
         </div>
         <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', borderRadius: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900' }}>{totalWins}</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Wins</div>
         </div>
         <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', border: '2px solid var(--primary)', borderRadius: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>{topFinishes}</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Top 3 Finishes</div>
         </div>
         <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', border: '2px solid var(--accent)', borderRadius: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent)' }}>{avgScore}</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Avg Score</div>
         </div>
      </div>

      {/* History Cards */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your quiz history...</div>
      ) : history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="ti ti-history-off" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}></i>
          You haven't played any quizzes yet. Join one from the dashboard!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((h) => {
            const rank = getRankStyle(h.myRank);
            return (
              <div key={h.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', transition: 'transform 0.2s' }}
                 onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                 {/* Rank Badge */}
                 <div style={{ width: '90px', background: rank.bg, color: rank.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '15px 0' }}>
                    <div style={{ fontSize: '2rem' }}>{rank.emoji}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{rank.label}</div>
                 </div>
                 
                 {/* Info */}
                 <div style={{ flex: 1, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 6px 0' }}>{h.title}</h3>
                       <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span><i className="ti ti-calendar"></i> {new Date(h.playedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span><i className="ti ti-users"></i> {h.totalParticipants} players</span>
                          <span><i className="ti ti-list-numbers"></i> {h.totalQuestions} questions</span>
                       </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'right' }}>
                       {(h.myCorrectCount !== undefined) && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                             <span style={{ color: '#10b981' }}><i className="ti ti-check"></i> {h.myCorrectCount}</span>
                             <span style={{ color: '#ef4444' }}><i className="ti ti-x"></i> {h.myWrongCount}</span>
                          </div>
                       )}
                       <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>{h.myScore}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                             {h.myRank <= 3 ? `#${h.myRank} of ${h.totalParticipants}` : `${h.totalParticipants} players`}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
