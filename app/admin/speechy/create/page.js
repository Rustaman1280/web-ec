'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveSpeechyBank } from '@/lib/firebaseUtils';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import Link from 'next/link';

function SpeechyBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('New Speechy Challenge');
  const [description, setDescription] = useState('Read the text clearly to score points!');
  const [targetText, setTargetText] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('ti-microphone');
  const [sessionPoints, setSessionPoints] = useState(500);
  const [sessionExp, setSessionExp] = useState(500);

  useEffect(() => {
    if (editId) {
      get(ref(database, `speechy_banks/${editId}`)).then(snap => {
        if (snap.exists()) {
          const data = snap.val();
          setTitle(data.title || '');
          setDescription(data.description || '');
          setTargetText(data.targetText || '');
          setColor(data.color || '#6366f1');
          setIcon(data.icon || 'ti-microphone');
          setSessionPoints(data.sessionPoints || 500);
          setSessionExp(data.sessionExp || 500);
        }
        setLoading(false);
      });
    }
  }, [editId]);

  const handleSave = async () => {
    if (!title.trim() || !targetText.trim()) {
      alert("Title and Target Text are required!");
      return;
    }
    setSaving(true);
    await saveSpeechyBank(editId, {
      title,
      description,
      targetText,
      color,
      icon,
      sessionPoints,
      sessionExp
    });
    router.push('/admin/speechy');
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading editor...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f172a', color: '#e2e8f0' }}>
      
      {/* Configuration Form */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/admin/speechy" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
              <i className="ti ti-arrow-left"></i> Back to Speechy Games
            </Link>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>{editId ? 'Edit Speechy Game' : 'Create Speechy Game'}</h2>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ 
              background: 'var(--gradient-primary)', color: 'white', padding: '12px 30px', 
              borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
            }}
          >
            {saving ? 'Saving...' : 'Save Game'}
          </button>
        </div>

        <div className="glass-panel" style={{ background: '#1e293b', border: '1px solid #334155', padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'white' }}>Game Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#94a3b8' }}>Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#94a3b8' }}>Theme Color</label>
              <input 
                type="color" 
                value={color} 
                onChange={e => setColor(e.target.value)}
                style={{ width: '100%', height: '46px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', cursor: 'pointer' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#94a3b8' }}>Description</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
              />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ background: '#1e293b', border: '1px solid #334155', padding: '2rem', marginBottom: '2rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h3 style={{ margin: 0, color: 'white' }}>Target Text (English)</h3>
           </div>
           <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter the text passage that participants must read. The Web Speech API will evaluate their pronunciation based on this text.</p>
           
           <textarea 
             value={targetText}
             onChange={e => setTargetText(e.target.value)}
             placeholder="e.g. The quick brown fox jumps over the lazy dog."
             style={{ 
                width: '100%', height: '200px', padding: '15px', borderRadius: '8px', 
                border: '2px solid #475569', background: '#0f172a', color: 'white', 
                fontSize: '1.2rem', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.5'
             }}
           />
        </div>
      </div>

      {/* Sidebar Properties */}
      <div style={{ width: '350px', background: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
           <h3 style={{ margin: 0, fontSize: '1.2rem' }}><i className="ti ti-settings"></i> Game Settings</h3>
        </div>
        
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#cbd5e1' }}>Icon (Tabler Icons)</label>
            <input 
              type="text" 
              value={icon} 
              onChange={e => setIcon(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            />
            <div style={{ marginTop: '10px', fontSize: '2rem', color }}>
               <i className={`ti ${icon}`}></i>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#cbd5e1' }}>Completion Points (Coins)</label>
            <input 
              type="number" 
              value={sessionPoints} 
              onChange={e => setSessionPoints(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            />
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Base coins awarded upon completing the text.</div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#cbd5e1' }}>Completion EXP</label>
            <input 
              type="number" 
              value={sessionExp} 
              onChange={e => setSessionExp(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            />
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Experience points for completing the game.</div>
          </div>

        </div>
      </div>
      
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
      <SpeechyBuilder />
    </Suspense>
  );
}
