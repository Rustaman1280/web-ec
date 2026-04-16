'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createLiveQuizBank, updateLiveQuizBank, getLiveQuizById, uploadImageFile, getCustomQuizThemes, addCustomQuizTheme } from '@/lib/firebaseUtils';

export default function KahootQuizBuilderPage() {
  return (
    <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontSize: '1.2rem' }}>Loading...</div>}>
      <KahootQuizBuilder />
    </Suspense>
  );
}

function KahootQuizBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  // Settings & Theme State
  const [showSettings, setShowSettings] = useState(!editId); 
  const [showThemes, setShowThemes] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('ti-device-gamepad');
  const [sessionPoints, setSessionPoints] = useState('0');
  const [sessionExp, setSessionExp] = useState('0');
  
  const [activeTheme, setActiveTheme] = useState('default');
  const [activeMusic, setActiveMusic] = useState('none');
  const [savedThemes, setSavedThemes] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(!!editId);
  
  // Upload States
  const [isUploadingGlobalBg, setIsUploadingGlobalBg] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  
  // Questions State
  const [questions, setQuestions] = useState([
    { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctIndex: 0, correctIndices: [0], questionType: 'single', timeLimit: 20, readingTime: 5, rewardPoints: 50, rewardExp: 10, mediaUrl: '', isDoublePoints: false }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
     getCustomQuizThemes().then(themes => {
        setSavedThemes(themes);
     });
  }, []);

  // Load quiz data for editing
  useEffect(() => {
     if (editId) {
        getLiveQuizById(editId).then(quiz => {
           if (quiz) {
              setTitle(quiz.title || '');
              setDescription(quiz.description || '');
              setColor(quiz.color || '#3b82f6');
              setIcon(quiz.icon || 'ti-device-gamepad');
              setSessionPoints(String(quiz.sessionPoints || 0));
              setSessionExp(String(quiz.sessionExp || 0));
              setActiveTheme(quiz.bgTheme || 'default');
              setActiveMusic(quiz.bgMusic || 'none');
              if (quiz.questions && quiz.questions.length > 0) {
                 setQuestions(quiz.questions.map((q, i) => ({ ...q, id: q.id || String(Date.now() + i) })));
              }
           } else {
              toast.error('Quiz not found!');
              router.push('/admin/live');
           }
           setLoadingQuiz(false);
        });
     }
  }, [editId, router]);

  const activeQ = questions[activeIndex];

  // Modify Active Question
  const updateActiveQ = (field, value) => {
    const updated = [...questions];
    updated[activeIndex][field] = value;
    setQuestions(updated);
  };

  const updateActiveOption = (optIdx, value) => {
    const updated = [...questions];
    updated[activeIndex].options[optIdx] = value;
    setQuestions(updated);
  };

  // Upload Handlers
  const handleUploadBackground = async (e) => {
     const file = e.target.files?.[0];
     if(!file) return;
     setIsUploadingGlobalBg(true);
     const toastId = toast.loading("Uploading background to Cloudinary...");
     try {
       const url = await uploadImageFile(file, 'quiz_themes');
       if(url) {
          await addCustomQuizTheme(url);
          setSavedThemes([...savedThemes, url]);
          setActiveTheme(`url(${url})`);
          toast.success("Background applied and saved!", { id: toastId });
       }
     } catch(err) {
       console.error(err);
       toast.error(err.message || "Upload failed.", { id: toastId });
     }
     setIsUploadingGlobalBg(false);
  };

  const handleUploadMedia = async (e) => {
     const file = e.target.files?.[0];
     if(!file) return;
     setIsUploadingMedia(true);
     const toastId = toast.loading("Uploading media to Cloudinary...");
     try {
       const url = await uploadImageFile(file, 'quiz_media');
       if(url) {
          updateActiveQ('mediaUrl', url);
          toast.success("Media uploaded!", { id: toastId });
       }
     } catch(err) {
       console.error(err);
       toast.error(err.message || "Upload failed.", { id: toastId });
     }
     setIsUploadingMedia(false);
  };

  // Actions
  const handleAddQuestion = () => {
    const newQ = { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctIndex: 0, correctIndices: [0], questionType: 'single', timeLimit: 20, readingTime: 5, rewardPoints: 50, rewardExp: 10, mediaUrl: '', isDoublePoints: false };
    setQuestions([...questions, newQ]);
    setActiveIndex(questions.length);
  };

  const handleDuplicate = () => {
    const dup = { ...activeQ, id: Date.now().toString() };
    dup.options = [...activeQ.options];
    if (activeQ.correctIndices) dup.correctIndices = [...activeQ.correctIndices];
    const updated = [...questions];
    updated.splice(activeIndex + 1, 0, dup);
    setQuestions(updated);
    setActiveIndex(activeIndex + 1);
  };

  const handleDelete = () => {
    if (questions.length === 1) return toast.error("A quiz must have at least one question.");
    const updated = questions.filter((_, i) => i !== activeIndex);
    setQuestions(updated);
    setActiveIndex(Math.max(0, activeIndex - 1));
  };

  const handleSave = async () => {
    if (!title.trim()) {
       setShowSettings(true);
       return toast.error("Please provide a Quiz Title in Settings.");
    }
    for (let i=0; i<questions.length; i++) {
       const q = questions[i];
       if (!q.text.trim()) return toast.error(`Question ${i+1} is missing text.`);
       for (let j=0; j<4; j++) {
          if (!q.options[j].trim()) return toast.error(`Question ${i+1} is missing Option ${j+1}.`);
       }
       if (q.questionType === 'multiple' && (!q.correctIndices || q.correctIndices.length === 0)) {
          return toast.error(`Question ${i+1} must have at least one correct answer.`);
       }
    }

    setIsSubmitting(true);

    try {
      if (editId) {
        await updateLiveQuizBank(editId, title, description || 'A fun live quiz!', color, icon, sessionPoints || '0', sessionExp || '0', questions, activeTheme, activeMusic);
        toast.success("Quiz updated successfully!");
      } else {
        await createLiveQuizBank(title, description || 'A fun live quiz!', color, icon, sessionPoints || '0', sessionExp || '0', questions, activeTheme, activeMusic);
        toast.success("Quiz saved successfully!");
      }
      router.push('/admin/live');
    } catch(err) {
      console.error(err);
      toast.error("Failed to save quiz");
    }
    setIsSubmitting(false);
  };

  const handleExit = () => {
    if(confirm("Exit without saving? Changes will be lost!")) {
      router.push('/admin/live');
    }
  };

  // UI Helpers
  const shapeColors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
  const shapeIcons = [
     <svg key="tri" viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px' }}><polygon points="16,4 28,28 4,28"/></svg>,
     <svg key="dia" viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px', transform: 'rotate(45deg)' }}><rect x="6" y="6" width="20" height="20"/></svg>,
     <svg key="cir" viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px' }}><circle cx="16" cy="16" r="12"/></svg>,
     <svg key="squ" viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px' }}><rect x="6" y="6" width="20" height="20"/></svg>
  ];

  const themeBackgrounds = {
     default: '#f8f9fa',
     purple: 'linear-gradient(135deg, #4b1b85, #791a88)',
     space: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
     sunny: 'linear-gradient(135deg, #f6d365, #fda085)',
     ocean: 'linear-gradient(135deg, #2b5876, #4e4376)'
  };

  const getActiveBackgroundStyles = () => {
     let bg = themeBackgrounds[activeTheme];
     if(activeTheme.startsWith('url')) bg = activeTheme;

     if(bg.startsWith('url')) {
        return { background: `${bg} center/cover no-repeat` };
     }
     return { background: bg };
  };

  const themeCanvas = {
     default: '#f2f2f2',
     purple: 'rgba(255,255,255,0.15)',
     space: 'rgba(255,255,255,0.05)',
     sunny: 'rgba(255,255,255,0.3)',
     ocean: 'rgba(0,0,0,0.2)'
  };

  const musicOptions = [
     { id: 'none', label: 'No Music', file: '' },
     { id: 'lobby1', label: 'Kahoot Classic', file: '/music/lobby1.mp3' },
     { id: 'lobby2', label: 'Intense Build', file: '/music/lobby2.mp3' },
     { id: 'lobby3', label: 'Chill Lo-Fi', file: '/music/lobby3.mp3' }
  ];

  const currentMusicUrl = musicOptions.find(m => m.id === activeMusic)?.file;
  
  const isCorrectOption = (idx) => {
     return activeQ.questionType === 'multiple' ? (activeQ.correctIndices || []).includes(idx) : activeQ.correctIndex === idx;
  };

  if (loadingQuiz) {
     return <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
        <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }}></i> Loading Quiz...
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
     </div>;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: '"Inter", system-ui, sans-serif', ...getActiveBackgroundStyles() }}>
       {/* Background Audio */}
       {currentMusicUrl && <audio src={currentMusicUrl} autoPlay loop />}

       {/* Top Bar */}
       <div style={{ height: '60px', background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EC</span>
                <span style={{ color: '#e21b3c' }}>Quiz</span>
             </h1>
             <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                 <input 
                   type="text" 
                   placeholder="Enter quiz title..." 
                   value={title} 
                   onChange={(e) => setTitle(e.target.value)} 
                   style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 'bold', width: '200px', color: 'white', fontSize: '0.95rem' }}
                 />
                 <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="ti ti-settings" style={{ fontSize: '0.85rem' }}></i> Settings
                 </button>
             </div>
             <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowThemes(true)}>
                <i className="ti ti-palette"></i> Themes
             </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <button onClick={handleExit} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem' }}>Exit</button>
             <button onClick={handleSave} disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '8px 24px', borderRadius: '8px', fontWeight: 'bold', color: 'white', cursor: isSubmitting ? 'wait' : 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
               <i className={`ti ${isSubmitting ? 'ti-loader' : 'ti-device-floppy'}`} style={{ marginRight: '6px' }}></i>
               {isSubmitting ? 'Saving...' : (editId ? 'Update' : 'Save')}
             </button>
          </div>
       </div>

       {/* Editor Body */}
       <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Sidebar (Slides) */}
          <div style={{ width: '220px', background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 10, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
             <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {questions.map((q, idx) => (
                   <div 
                      key={q.id} 
                      onClick={() => setActiveIndex(idx)}
                      style={{ 
                         background: activeIndex === idx ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', 
                         border: activeIndex === idx ? '2px solid #6366f1' : '2px solid transparent',
                         borderRadius: '10px', padding: '8px', cursor: 'pointer', position: 'relative',
                         transition: 'all 0.15s'
                      }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: activeIndex === idx ? '#a5b4fc' : '#64748b', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                         <span style={{ background: activeIndex === idx ? '#6366f1' : '#334155', color: 'white', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900' }}>{idx + 1}</span>
                         {q.isDoublePoints && <span style={{ background: '#f59e0b', color: 'white', padding: '1px 5px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '900' }}>⚡2x</span>}
                         {q.questionType === 'multiple' && <span style={{ background: '#3b82f6', color: 'white', padding: '1px 5px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '900' }}>MULTI</span>}
                      </div>
                      <div style={{ background: q.mediaUrl ? `url(${q.mediaUrl}) center/cover no-repeat rgba(30,41,59,0.8)` : 'rgba(30,41,59,0.5)', height: '65px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#475569', border: '1px solid rgba(255,255,255,0.05)' }}>
                         {q.text ? <div style={{ fontSize: '0.55rem', color: '#cbd5e1', padding: '4px 6px', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{q.text}</div> : (!q.mediaUrl && <i className="ti ti-photo"></i>)}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); const u = [...questions]; u.splice(idx,1); if(u.length===0) return toast.error("Minimum 1 question"); setQuestions(u); setActiveIndex(Math.min(idx, u.length-1)); }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}>
                         <i className="ti ti-x" style={{ color: '#ef4444', fontSize: '0.7rem' }}></i>
                      </button>
                   </div>
                ))}
             </div>
             <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={handleAddQuestion} style={{ width: '100%', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                   <i className="ti ti-plus"></i> Add question
                </button>
             </div>
          </div>

          {/* Main Canvas */}
          <div style={{ flex: 1, background: activeTheme.startsWith('url') ? 'rgba(0,0,0,0.3)' : (themeCanvas[activeTheme] || themeCanvas.default), backdropFilter: activeTheme !== 'default' ? 'blur(10px)' : 'none', display: 'flex', flexDirection: 'column', padding: '25px 35px', overflowY: 'auto' }}>
             
             {/* Question Text Input */}
             <div style={{ width: '100%', background: 'white', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', marginBottom: '25px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${shapeColors[0]}, ${shapeColors[1]}, ${shapeColors[2]}, ${shapeColors[3]})` }}></div>
                <input 
                  type="text" 
                  placeholder="Start typing your question" 
                  value={activeQ.text} 
                  onChange={(e) => updateActiveQ('text', e.target.value)}
                  style={{ width: '100%', padding: '22px', fontSize: '1.6rem', textAlign: 'center', border: 'none', outline: 'none', borderRadius: '12px', fontWeight: 'bold', color: '#1e293b' }}
                />
             </div>

             {/* Media Area */}
             <div style={{ flex: 1, position: 'relative', minHeight: '180px', maxHeight: '350px', borderRadius: '12px', margin: '0 auto', width: '55%' }}>
                <input type="file" id="mediaUpload" accept="image/*" onChange={handleUploadMedia} style={{ display: 'none' }} disabled={isUploadingMedia} />
                <label htmlFor="mediaUpload" style={{ position: 'absolute', inset: 0, background: activeQ.mediaUrl ? `url(${activeQ.mediaUrl}) center/contain no-repeat rgba(255,255,255,0.95)` : 'rgba(255,255,255,0.95)', borderRadius: '12px', border: activeQ.mediaUrl ? 'none' : '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', cursor: isUploadingMedia ? 'wait' : 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', transition: 'border-color 0.2s' }}>
                   {!activeQ.mediaUrl && !isUploadingMedia && (
                     <>
                        <i className="ti ti-photo-plus" style={{ fontSize: '3.5rem', marginBottom: '8px' }}></i>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Add media</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#cbd5e1' }}>Click to upload image</div>
                     </>
                   )}
                   {isUploadingMedia && <i className="ti ti-loader" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}></i>}
                </label>
                {activeQ.mediaUrl && (
                    <div onClick={() => updateActiveQ('mediaUrl', '')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <i className="ti ti-trash"></i> Remove
                    </div>
                )}
             </div>

             {/* Answers Area */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '25px', height: '170px', flexShrink: 0 }}>
                {activeQ.options.map((opt, idx) => (
                   <div key={idx} style={{ 
                      background: 'white', borderRadius: '12px', display: 'flex', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      border: `3px solid ${isCorrectOption(idx) ? '#10b981' : 'transparent'}`, transition: 'all 0.2s',
                      transform: isCorrectOption(idx) ? 'scale(1.01)' : 'scale(1)'
                   }}>
                      <div style={{ width: '70px', background: shapeColors[idx], display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                         {shapeIcons[idx]}
                         {isCorrectOption(idx) && <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-check" style={{ color: 'white', fontSize: '0.7rem' }}></i></div>}
                      </div>
                      <div style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                         <textarea 
                           placeholder={`Add answer ${idx + 1}`} 
                           value={opt}
                           onChange={(e) => updateActiveOption(idx, e.target.value)}
                           style={{ width: '85%', height: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: '1.05rem', fontWeight: 'bold', color: '#1e293b' }}
                         />
                         
                         {/* Dynamic check marker */}
                         <div 
                           onClick={() => {
                              if (activeQ.questionType === 'multiple') {
                                 const current = activeQ.correctIndices || [activeQ.correctIndex];
                                 const updated = current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx];
                                 updateActiveQ('correctIndices', updated);
                              } else {
                                 updateActiveQ('correctIndex', idx);
                              }
                           }}
                           style={{ 
                              position: 'absolute', right: '12px', width: '36px', height: '36px', 
                              borderRadius: activeQ.questionType === 'multiple' ? '8px' : '50%', 
                              border: `3px solid ${isCorrectOption(idx) ? '#10b981' : '#e2e8f0'}`,
                              background: isCorrectOption(idx) ? '#10b981' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s',
                              boxShadow: isCorrectOption(idx) ? '0 4px 10px rgba(16,185,129,0.3)' : 'none'
                           }}>
                            {isCorrectOption(idx) && <i className="ti ti-check" style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}></i>}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Right Sidebar (Settings) */}
          <div style={{ width: '270px', background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 10, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
             <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: '700' }}>Properties</h3>
                   <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>Q{activeIndex + 1}</span>
                </div>

                <div style={{ marginBottom: '18px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <i className="ti ti-list-check" style={{ color: '#6366f1' }}></i> Answer Mode
                   </label>
                   <select 
                      value={activeQ.questionType || 'single'} 
                      onChange={(e) => {
                         updateActiveQ('questionType', e.target.value);
                         if(e.target.value === 'multiple' && !activeQ.correctIndices) {
                             updateActiveQ('correctIndices', [activeQ.correctIndex]);
                         }
                      }}
                      style={{ width: '100%', padding: '10px', fontSize: '0.9rem', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#1e293b', color: 'white' }}>
                      <option value="single">Single Answer</option>
                      <option value="multiple">Multiple Answers</option>
                   </select>
                </div>

                <div style={{ marginBottom: '18px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <i className="ti ti-clock" style={{ color: '#f59e0b' }}></i> Time limit
                   </label>
                   <select 
                      value={activeQ.timeLimit} 
                      onChange={(e) => updateActiveQ('timeLimit', parseInt(e.target.value))}
                      style={{ width: '100%', padding: '10px', fontSize: '0.9rem', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#1e293b', color: 'white' }}>
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="20">20 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="120">2 minutes</option>
                   </select>
                </div>

                <div style={{ marginBottom: '18px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <i className="ti ti-eye" style={{ color: '#10b981' }}></i> Reading time
                   </label>
                   <select 
                      value={activeQ.readingTime || 5} 
                      onChange={(e) => updateActiveQ('readingTime', parseInt(e.target.value))}
                      style={{ width: '100%', padding: '10px', fontSize: '0.9rem', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#1e293b', color: 'white' }}>
                      <option value="3">3 seconds</option>
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="15">15 seconds</option>
                   </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                   <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', marginBottom: '6px', color: '#94a3b8', fontSize: '0.75rem' }}>
                         <i className="ti ti-coin" style={{ color: '#6366f1' }}></i> Points
                      </label>
                      <input 
                         type="number"
                         value={activeQ.rewardPoints} 
                         onChange={(e) => updateActiveQ('rewardPoints', parseInt(e.target.value) || 0)}
                         style={{ width: '100%', padding: '8px', fontSize: '0.9rem', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#1e293b', color: 'white' }} 
                      />
                   </div>
                   <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', marginBottom: '6px', color: '#94a3b8', fontSize: '0.75rem' }}>
                         <i className="ti ti-star" style={{ color: '#f59e0b' }}></i> EXP
                      </label>
                      <input 
                         type="number"
                         value={activeQ.rewardExp} 
                         onChange={(e) => updateActiveQ('rewardExp', parseInt(e.target.value) || 0)}
                         style={{ width: '100%', padding: '8px', fontSize: '0.9rem', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#1e293b', color: 'white' }} 
                      />
                   </div>
                </div>

                {/* Double Points Toggle */}
                <div style={{ marginBottom: '18px' }}>
                   <button 
                      onClick={() => updateActiveQ('isDoublePoints', !activeQ.isDoublePoints)}
                      style={{ 
                         width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer',
                         background: activeQ.isDoublePoints ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1e293b',
                         color: activeQ.isDoublePoints ? 'white' : '#64748b',
                         border: activeQ.isDoublePoints ? '2px solid #fbbf24' : '2px solid #334155',
                         transition: 'all 0.2s',
                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                         boxShadow: activeQ.isDoublePoints ? '0 4px 15px rgba(245,158,11,0.3)' : 'none'
                      }}
                   >
                      <i className={`ti ${activeQ.isDoublePoints ? 'ti-bolt' : 'ti-bolt-off'}`} style={{ fontSize: '1.1rem' }}></i>
                      {activeQ.isDoublePoints ? '⚡ DOUBLE POINTS' : 'Double Points Off'}
                   </button>
                </div>
             </div>

             <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
                <button onClick={handleDelete} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                   <i className="ti ti-trash"></i> Delete
                </button>
                <button onClick={handleDuplicate} style={{ flex: 1, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                   <i className="ti ti-copy"></i> Duplicate
                </button>
             </div>
          </div>
       </div>

       {/* Quiz Settings Modal */}
       {showSettings && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => { if(title.trim()) setShowSettings(false); }}>
             <div style={{ background: '#1e293b', width: '500px', borderRadius: '16px', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                   <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="ti ti-settings" style={{ color: '#6366f1' }}></i> {editId ? 'Edit Quiz' : 'Quiz Settings'}
                   </h2>
                   {title.trim() && (
                      <button onClick={() => setShowSettings(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', padding: '6px 10px', borderRadius: '8px' }}>&times;</button>
                   )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>Title</label>
                      <input 
                         type="text" 
                         value={title} 
                         onChange={e => setTitle(e.target.value)} 
                         placeholder="Enter quiz title..." 
                         style={{ width: '100%', padding: '10px 14px', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#0f172a', color: 'white', fontSize: '1rem' }} 
                      />
                   </div>
                   
                   <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>Description</label>
                      <textarea 
                         value={description} 
                         onChange={e => setDescription(e.target.value)} 
                         placeholder="Optional description..." 
                         style={{ width: '100%', padding: '10px 14px', border: '1px solid #334155', borderRadius: '8px', resize: 'vertical', minHeight: '70px', outline: 'none', background: '#0f172a', color: 'white' }} 
                      />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>Theme Color</label>
                          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: '40px', cursor: 'pointer', border: '1px solid #334155', borderRadius: '8px', background: '#0f172a' }} />
                       </div>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>Cover Icon</label>
                          <select value={icon} onChange={e => setIcon(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#0f172a', color: 'white' }}>
                             <option value="ti-device-gamepad">Gamepad</option>
                             <option value="ti-abc">ABC</option>
                             <option value="ti-books">Books</option>
                             <option value="ti-world">World/Globe</option>
                             <option value="ti-brain">Brain</option>
                          </select>
                       </div>
                   </div>

                   <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '5px 0' }} />

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem', color: '#818cf8' }}>Base Session Points</label>
                          <input type="number" value={sessionPoints} onChange={e => setSessionPoints(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#0f172a', color: 'white' }} />
                          <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>Prize for completing game</div>
                       </div>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem', color: '#f59e0b' }}>Base Session EXP</label>
                          <input type="number" value={sessionExp} onChange={e => setSessionExp(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px', border: '1px solid #334155', borderRadius: '8px', outline: 'none', background: '#0f172a', color: 'white' }} />
                          <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>Prize for completing game</div>
                       </div>
                   </div>

                   <button 
                      onClick={() => { if(!title.trim()) toast.error('Title is required'); else setShowSettings(false); }} 
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white', border: 'none', padding: '12px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer', marginTop: '5px', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                      Done
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* Themes & Music Picker Modal */}
       {showThemes && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowThemes(false)}>
             <div style={{ background: '#1e293b', width: '550px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                
                <div style={{ background: '#0f172a', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ti ti-palette" style={{ color: '#a855f7' }}></i> Themes & Audio
                   </h2>
                   <button onClick={() => setShowThemes(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b', padding: '5px 10px', borderRadius: '8px' }}><i className="ti ti-x"></i></button>
                </div>

                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                   
                   <div>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>Background Theme</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                         {Object.keys(themeBackgrounds).map(key => (
                            <div 
                               key={key} 
                               onClick={() => setActiveTheme(key)}
                               style={{ 
                                  height: '55px', background: themeBackgrounds[key], borderRadius: '10px', cursor: 'pointer',
                                  border: activeTheme === key ? '3px solid #6366f1' : '1px solid #334155',
                                  display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: activeTheme === key ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
                               }}>
                               {activeTheme === key && <i className="ti ti-check" style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}></i>}
                            </div>
                         ))}

                         {savedThemes.map((url, i) => (
                            <div 
                               key={i} 
                               onClick={() => setActiveTheme(`url(${url})`)}
                               style={{ 
                                  height: '55px', background: `url(${url}) center/cover`, borderRadius: '10px', cursor: 'pointer',
                                  border: activeTheme === `url(${url})` ? '3px solid #6366f1' : '1px solid #334155',
                                  display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: activeTheme === `url(${url})` ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
                               }}>
                               {activeTheme === `url(${url})` && <i className="ti ti-check" style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}></i>}
                            </div>
                         ))}

                         <label style={{ 
                               height: '55px', background: '#0f172a', borderRadius: '10px', cursor: isUploadingGlobalBg ? 'wait' : 'pointer',
                               border: '1px dashed #475569',
                               display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#475569'
                            }}
                            title="Upload Custom Background"
                            >
                            <input type="file" accept="image/*" onChange={handleUploadBackground} style={{ display: 'none' }} disabled={isUploadingGlobalBg} />
                            {isUploadingGlobalBg ? <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }}></i> : <><i className="ti ti-upload"></i><span style={{fontSize:'9px'}}>Upload</span></>}
                         </label>
                      </div>
                   </div>

                   <div>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>Lobby Music</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                         {musicOptions.map(m => (
                            <div 
                               key={m.id} 
                               onClick={() => setActiveMusic(m.id)}
                               style={{ 
                                  padding: '10px 15px', background: activeMusic === m.id ? 'rgba(99,102,241,0.15)' : '#0f172a', borderRadius: '10px', cursor: 'pointer',
                                  border: activeMusic === m.id ? '2px solid #6366f1' : '1px solid #334155',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                               }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: activeMusic === m.id ? '#a5b4fc' : '#94a3b8', fontSize: '0.9rem' }}>
                                  <i className={`ti ${m.id === 'none' ? 'ti-music-off' : 'ti-music'}`}></i> {m.label}
                               </div>
                               {activeMusic === m.id && <i className="ti ti-check" style={{ color: '#6366f1', fontWeight: 'bold' }}></i>}
                            </div>
                         ))}
                      </div>
                   </div>

                   <button 
                      onClick={() => setShowThemes(false)} 
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white', border: 'none', padding: '12px', fontSize: '0.95rem', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer', width: '100%', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                      Apply & Close
                   </button>
                </div>
             </div>
          </div>
       )}

       <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
    </div>
  );
}
