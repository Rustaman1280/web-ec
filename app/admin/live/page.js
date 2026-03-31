'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuizSession } from '@/lib/firebaseUtils';

export default function AdminLiveQuizzes() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 3 Hardcoded Question Banks
  const QUIZ_BANKS = [
    {
      id: 'grammar-basics',
      title: 'Grammar Basics',
      description: 'Test foundational grammar structures like past tense and subject-verb agreement.',
      color: 'var(--primary)',
      icon: 'ti-abc',
      questions: [
        { id: 'q1', text: 'Questions Banks are currently hardcoded. What is the past tense of "Go"?', options: ['Went', 'Gone', 'Going', 'Goed'], correctIndex: 0, timeLimit: 20 },
        { id: 'q2', text: 'Choose the correct sentence:', options: ['He do not like apples.', 'He unlikes apples.', 'He does not like apples.', 'He not like apples.'], correctIndex: 2, timeLimit: 30 },
        { id: 'q3', text: 'Which word is an adjective?', options: ['Run', 'Beautiful', 'Quickly', 'Happiness'], correctIndex: 1, timeLimit: 20 }
      ]
    },
    {
      id: 'vocab-challenge',
      title: 'Vocabulary Challenge',
      description: 'A rapid-fire synonyms and antonyms challenge to test student reflexes.',
      color: 'var(--accent)',
      icon: 'ti-books',
      questions: [
        { id: 'v1', text: 'What is the synonym of "Huge"?', options: ['Tiny', 'Massive', 'Narrow', 'Light'], correctIndex: 1, timeLimit: 15 },
        { id: 'v2', text: 'What is the antonym of "Complex"?', options: ['Simple', 'Hard', 'Intricate', 'Confusing'], correctIndex: 0, timeLimit: 15 },
        { id: 'v3', text: 'Which word means "extremely happy"?', options: ['Gloomy', 'Ecstatic', 'Bored', 'Anxious'], correctIndex: 1, timeLimit: 15 },
        { id: 'v4', text: 'Which is a noun?', options: ['Fast', 'Run', 'Apple', 'Quickly'], correctIndex: 2, timeLimit: 15 }
      ]
    },
    {
      id: 'general-knowledge',
      title: 'Trivia Mix',
      description: 'Fun general knowledge questions in English.',
      color: '#10b981',
      icon: 'ti-world',
      questions: [
        { id: 't1', text: 'Which animal is known as the King of the Jungle?', options: ['Tiger', 'Elephant', 'Lion', 'Bear'], correctIndex: 2, timeLimit: 15 },
        { id: 't2', text: 'What color do you get by mixing Red and Yellow?', options: ['Green', 'Orange', 'Purple', 'Brown'], correctIndex: 1, timeLimit: 15 },
        { id: 't3', text: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], correctIndex: 2, timeLimit: 20 }
      ]
    }
  ];

  const handleCreateSession = async (quiz) => {
    setLoading(true); setError(null);
    try {
      const pin = await createQuizSession(quiz.id, quiz.questions);
      if(pin) router.push(`/admin/quiz/${pin}`);
      else setError('Failed to create session. Check rules/connection.');
    } catch (err) {
      console.error(err); setError('An error occurred starting the quiz.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '1rem' }}>
       <h2 className="heading-xl" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>Live Quizzes</h2>
       <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
         Select a Question Bank below to instantly launch a live projector session. Students can copy the PIN to join.
       </p>

       {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</div>}
       {loading && <div style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}><i className="ti ti-loader rotate"></i> Generating Live Session...</div>}

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
         {QUIZ_BANKS.map(quiz => (
           <div key={quiz.id} className="glass-panel" style={{ 
              padding: '2rem', 
              borderTop: `4px solid ${quiz.color}`,
              display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s', cursor: 'default'
           }}
           onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
           onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
           >
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
               <div style={{ 
                 width: '50px', height: '50px', borderRadius: '12px', background: `${quiz.color}20`, 
                 display: 'flex', justifyContent: 'center', alignItems: 'center', color: quiz.color
               }}>
                 <i className={`ti ${quiz.icon}`} style={{ fontSize: '1.8rem' }}></i>
               </div>
               <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{quiz.title}</h3>
             </div>
             
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '2rem' }}>
               {quiz.description}
             </p>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', background: 'var(--border-light)', padding: '4px 10px', borderRadius: '20px' }}>
                 {quiz.questions.length} Questions
               </span>
               <button 
                 onClick={() => handleCreateSession(quiz)} 
                 disabled={loading} 
                 style={{ 
                   background: quiz.color, color: 'white', padding: '10px 20px', 
                   borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: loading ? 'wait' : 'pointer',
                   boxShadow: `0 4px 14px ${quiz.color}40`
                 }}>
                 Host Game
               </button>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
}
