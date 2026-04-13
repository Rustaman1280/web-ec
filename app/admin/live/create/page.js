'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createLiveQuizBank, uploadImageFile, getCustomQuizThemes, addCustomQuizTheme } from '@/lib/firebaseUtils';

export default function KahootQuizBuilder() {
  const router = useRouter();
  
  // Settings & Theme State
  const [showSettings, setShowSettings] = useState(true); 
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
  
  // Upload States
  const [isUploadingGlobalBg, setIsUploadingGlobalBg] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  
  // Questions State
  const [questions, setQuestions] = useState([
    { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctIndex: 0, correctIndices: [0], questionType: 'single', timeLimit: 20, rewardPoints: 50, rewardExp: 10, mediaUrl: '' }
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
     getCustomQuizThemes().then(themes => {
        setSavedThemes(themes);
     });
  }, []);

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
    const newQ = { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctIndex: 0, correctIndices: [0], questionType: 'single', timeLimit: 20, rewardPoints: 50, rewardExp: 10, mediaUrl: '' };
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
      await createLiveQuizBank(title, description || 'A fun live quiz!', color, icon, sessionPoints || '0', sessionExp || '0', questions, activeTheme, activeMusic);
      toast.success("Quiz saved successfully!");
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
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px' }}><polygon points="16,4 28,28 4,28"/></svg>, // Triangle
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px', transform: 'rotate(45deg)' }}><rect x="6" y="6" width="20" height="20"/></svg>, // Diamond
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px' }}><circle cx="16" cy="16" r="12"/></svg>, // Circle
     <svg viewBox="0 0 32 32" fill="white" style={{ width: '20px', height: '20px' }}><rect x="6" y="6" width="20" height="20"/></svg> // Square
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', ...getActiveBackgroundStyles() }}>
       {/* Background Audio */}
       {currentMusicUrl && <audio src={currentMusicUrl} autoPlay loop />}

       {/* Top Bar */}
       <div style={{ height: '60px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexShrink: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px' }}>
                EnglishClub<span style={{ color: '#e21b3c' }}>!</span> 
             </h1>
             <div style={{ background: '#f2f2f2', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSettings(true)}>
                 <input 
                   type="text" 
                   placeholder="Enter quiz title..." 
                   value={title} 
                   onChange={(e) => setTitle(e.target.value)} 
                   style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: 'bold', width: '200px' }}
                   onClick={(e) => e.stopPropagation()}
                 />
                 <button style={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', marginLeft: '10px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Settings</button>
             </div>
             <button style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', color: 'var(--primary)', borderRadius: '4px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowThemes(true)}>
                <i className="ti ti-palette"></i> Themes
             </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <button onClick={handleExit} style={{ background: '#f2f2f2', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#333' }}>Exit</button>
             <button onClick={handleSave} disabled={isSubmitting} style={{ background: '#26890c', border: 'none', padding: '10px 24px', borderRadius: '4px', fontWeight: 'bold', color: 'white', cursor: isSubmitting ? 'wait' : 'pointer' }}>
               {isSubmitting ? 'Saving...' : 'Save'}
             </button>
          </div>
       </div>

       {/* Editor Body */}
       <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Sidebar (Slides) */}
          <div style={{ width: '240px', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 5px rgba(0,0,0,0.05)', zIndex: 10 }}>
             <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {questions.map((q, idx) => (
                   <div 
                      key={q.id} 
                      onClick={() => setActiveIndex(idx)}
                      style={{ 
                         background: activeIndex === idx ? '#e2f0fb' : '#f2f2f2', 
                         border: activeIndex === idx ? '2px solid #1368ce' : '2px solid transparent',
                         borderRadius: '8px', padding: '8px', cursor: 'pointer', position: 'relative'
                      }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', marginBottom: '6px' }}>{idx + 1} Quiz</div>
                      <div style={{ background: q.mediaUrl ? `url(${q.mediaUrl}) center/cover no-repeat white` : 'white', height: '80px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#ccc', border: '1px solid #ddd' }}>
                         {q.text ? <div style={{ fontSize: '0.6rem', color: '#333', background: 'rgba(255,255,255,0.8)', padding: '4px', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{q.text}</div> : (!q.mediaUrl && <i className="ti ti-photo"></i>)}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); const u = [...questions]; u.splice(idx,1); if(u.length===0) return toast.error("Minimum 1 question"); setQuestions(u); setActiveIndex(Math.min(idx, u.length-1)); }} style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}>
                         <i className="ti ti-trash" style={{ color: '#ef4444', fontSize: '0.8rem' }}></i>
                      </button>
                   </div>
                ))}
             </div>
             <div style={{ padding: '15px', borderTop: '1px solid #eee' }}>
                <button onClick={handleAddQuestion} style={{ width: '100%', background: '#1368ce', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                   <i className="ti ti-plus"></i> Add question
                </button>
             </div>
          </div>

          {/* Main Canvas */}
          <div style={{ flex: 1, background: activeTheme.startsWith('url') ? 'rgba(255,255,255,0.25)' : (themeCanvas[activeTheme] || themeCanvas.default), backdropFilter: activeTheme !== 'default' ? 'blur(10px)' : 'none', display: 'flex', flexDirection: 'column', padding: '30px 40px', overflowY: 'auto' }}>
             
             {/* Question Text Input */}
             <div style={{ width: '100%', background: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                <input 
                  type="text" 
                  placeholder="Start typing your question" 
                  value={activeQ.text} 
                  onChange={(e) => updateActiveQ('text', e.target.value)}
                  style={{ width: '100%', padding: '20px', fontSize: '1.8rem', textAlign: 'center', border: 'none', outline: 'none', borderRadius: '8px', fontWeight: 'bold' }}
                />
             </div>

             {/* Media Area */}
             <div style={{ flex: 1, position: 'relative', minHeight: '200px', maxHeight: '400px', borderRadius: '8px', margin: '0 auto', width: '60%' }}>
                <input type="file" id="mediaUpload" accept="image/*" onChange={handleUploadMedia} style={{ display: 'none' }} disabled={isUploadingMedia} />
                <label htmlFor="mediaUpload" style={{ position: 'absolute', inset: 0, background: activeQ.mediaUrl ? `url(${activeQ.mediaUrl}) center/contain no-repeat rgba(255,255,255,0.9)` : 'rgba(255,255,255,0.9)', borderRadius: '8px', border: activeQ.mediaUrl ? 'none' : '2px dashed #999', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#666', cursor: isUploadingMedia ? 'wait' : 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                   {!activeQ.mediaUrl && !isUploadingMedia && (
                     <>
                        <i className="ti ti-photo-plus" style={{ fontSize: '4rem', marginBottom: '10px' }}></i>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Find and insert media</div>
                        <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>Click to Upload</div>
                     </>
                   )}
                   {isUploadingMedia && <i className="ti ti-loader rotate" style={{ fontSize: '3rem' }}></i>}
                </label>
                {activeQ.mediaUrl && (
                    <div onClick={() => updateActiveQ('mediaUrl', '')} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', zIndex: 2 }}>
                       <i className="ti ti-trash"></i> Remove
                    </div>
                )}
             </div>

             {/* Answers Area */}
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px', height: '180px', flexShrink: 0 }}>
                {activeQ.options.map((opt, idx) => (
                   <div key={idx} style={{ 
                      background: 'white', borderRadius: '8px', display: 'flex', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      border: `2px solid ${isCorrectOption(idx) ? '#26890c' : 'transparent'}`, transition: 'all 0.2s'
                   }}>
                      <div style={{ width: '80px', background: shapeColors[idx], display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                         {shapeIcons[idx]}
                      </div>
                      <div style={{ flex: 1, padding: '15px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                         <textarea 
                           placeholder={`Add answer ${idx + 1}${idx > 1 ? ' (optional)' : ''}`} 
                           value={opt}
                           onChange={(e) => updateActiveOption(idx, e.target.value)}
                           style={{ width: '85%', height: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}
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
                              position: 'absolute', right: '15px', width: '40px', height: '40px', 
                              borderRadius: activeQ.questionType === 'multiple' ? '8px' : '50%', 
                              border: `4px solid ${isCorrectOption(idx) ? '#26890c' : '#eee'}`,
                              background: isCorrectOption(idx) ? '#26890c' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s'
                           }}>
                            {isCorrectOption(idx) && <i className="ti ti-check" style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}></i>}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Right Sidebar (Settings) */}
          <div style={{ width: '280px', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)', zIndex: 10 }}>
             <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Question properties</h3>
                   <i className="ti ti-bulb" style={{ color: '#fbbf24', fontSize: '1.2rem' }}></i>
                </div>

                <div style={{ marginBottom: '20px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      <i className="ti ti-list-check"></i> Answer Mode
                   </label>
                   <select 
                      value={activeQ.questionType || 'single'} 
                      onChange={(e) => {
                         updateActiveQ('questionType', e.target.value);
                         if(e.target.value === 'multiple' && !activeQ.correctIndices) {
                             updateActiveQ('correctIndices', [activeQ.correctIndex]);
                         }
                      }}
                      style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}>
                      <option value="single">Single Answer</option>
                      <option value="multiple">Multiple Answers</option>
                   </select>
                   <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                      {activeQ.questionType === 'multiple' ? 'Players select all correct.' : 'Players pick one answer.'}
                   </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      <i className="ti ti-clock"></i> Time limit
                   </label>
                   <select 
                      value={activeQ.timeLimit} 
                      onChange={(e) => updateActiveQ('timeLimit', parseInt(e.target.value))}
                      style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}>
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="20">20 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="120">2 minutes</option>
                   </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      <i className="ti ti-coin" style={{ color: 'var(--primary)' }}></i> Points per correct
                   </label>
                   <input 
                      type="number"
                      value={activeQ.rewardPoints} 
                      onChange={(e) => updateActiveQ('rewardPoints', parseInt(e.target.value) || 0)}
                      placeholder="e.g. 50"
                      style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} 
                   />
                </div>

                <div style={{ marginBottom: '20px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      <i className="ti ti-star" style={{ color: 'var(--accent)' }}></i> EXP per correct
                   </label>
                   <input 
                      type="number"
                      value={activeQ.rewardExp} 
                      onChange={(e) => updateActiveQ('rewardExp', parseInt(e.target.value) || 0)}
                      placeholder="e.g. 10"
                      style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} 
                   />
                </div>
             </div>

             <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                <button onClick={handleDelete} style={{ flex: 1, background: 'white', color: '#666', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                <button onClick={handleDuplicate} style={{ flex: 1, background: 'white', color: '#333', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Duplicate</button>
             </div>
          </div>
       </div>

       {/* Quiz Settings Modal */}
       {showSettings && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => { if(title.trim()) setShowSettings(false); }}>
             <div style={{ background: 'white', width: '500px', borderRadius: '8px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.5rem' }}>Quiz summary</h2>
                   {title.trim() && (
                      <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
                   )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Title</label>
                      <input 
                         type="text" 
                         value={title} 
                         onChange={e => setTitle(e.target.value)} 
                         placeholder="Enter quiz title..." 
                         style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} 
                      />
                   </div>
                   
                   <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Description</label>
                      <textarea 
                         value={description} 
                         onChange={e => setDescription(e.target.value)} 
                         placeholder="Optional description..." 
                         style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', minHeight: '80px', outline: 'none' }} 
                      />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Theme Color (Dashboard)</label>
                          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: '40px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }} />
                       </div>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Cover Icon</label>
                          <select value={icon} onChange={e => setIcon(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}>
                             <option value="ti-device-gamepad">Gamepad</option>
                             <option value="ti-abc">ABC</option>
                             <option value="ti-books">Books</option>
                             <option value="ti-world">World/Globe</option>
                             <option value="ti-brain">Brain</option>
                          </select>
                       </div>
                   </div>

                   <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--primary)' }}>Base Session Points</label>
                          <input type="number" value={sessionPoints} onChange={e => setSessionPoints(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} />
                          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Prize for completing game</div>
                       </div>
                       <div>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--accent)' }}>Base Session EXP</label>
                          <input type="number" value={sessionExp} onChange={e => setSessionExp(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }} />
                          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Prize for completing game</div>
                       </div>
                   </div>

                   <button 
                      onClick={() => { if(!title.trim()) toast.error('Title is required'); else setShowSettings(false); }} 
                      style={{ background: '#26890c', color: 'white', border: 'none', padding: '12px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
                      Done
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* Themes & Music Picker Modal */}
       {showThemes && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowThemes(false)}>
             <div style={{ background: 'white', width: '550px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                
                <div style={{ background: 'var(--bg-dark)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="ti ti-palette"></i> Themes & Audio
                   </h2>
                   <button onClick={() => setShowThemes(false)} style={{ background: 'var(--bg-glass)', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px 10px', borderRadius: '8px' }}><i className="ti ti-x"></i></button>
                </div>

                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                   
                   <div>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>Background Theme</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                         {Object.keys(themeBackgrounds).map(key => (
                            <div 
                               key={key} 
                               onClick={() => setActiveTheme(key)}
                               style={{ 
                                  height: '60px', background: themeBackgrounds[key], borderRadius: '8px', cursor: 'pointer',
                                  border: activeTheme === key ? '3px solid var(--primary)' : '1px solid #ccc',
                                  display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: activeTheme === key ? '0 4px 10px rgba(99,102,241,0.3)' : 'none'
                               }}>
                               {activeTheme === key && <i className="ti ti-check" style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}></i>}
                            </div>
                         ))}

                         {savedThemes.map((url, i) => (
                            <div 
                               key={i} 
                               onClick={() => setActiveTheme(`url(${url})`)}
                               style={{ 
                                  height: '60px', background: `url(${url}) center/cover`, borderRadius: '8px', cursor: 'pointer',
                                  border: activeTheme === `url(${url})` ? '3px solid var(--primary)' : '1px solid #ccc',
                                  display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: activeTheme === `url(${url})` ? '0 4px 10px rgba(99,102,241,0.3)' : 'none'
                               }}>
                               {activeTheme === `url(${url})` && <i className="ti ti-check" style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}></i>}
                            </div>
                         ))}

                         {/* Custom Image Upload Block */}
                         <label style={{ 
                               height: '60px', background: '#f8f9fa', borderRadius: '8px', cursor: isUploadingGlobalBg ? 'wait' : 'pointer',
                               border: '1px dashed #ccc',
                               display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#666'
                            }}
                            title="Upload Custom Background"
                            >
                            <input type="file" accept="image/*" onChange={handleUploadBackground} style={{ display: 'none' }} disabled={isUploadingGlobalBg} />
                            {isUploadingGlobalBg ? <i className="ti ti-loader rotate"></i> : <><i className="ti ti-upload"></i><span style={{fontSize:'10px'}}>Upload</span></>}
                         </label>
                      </div>
                   </div>

                   <div>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>Lobby Music</h4>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>Place your mp3 files in the <code>public/music</code> directory (e.g. <code>lobby1.mp3</code>).</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                         {musicOptions.map(m => (
                            <div 
                               key={m.id} 
                               onClick={() => setActiveMusic(m.id)}
                               style={{ 
                                  padding: '12px 15px', background: activeMusic === m.id ? '#e2f0fb' : '#f8fafc', borderRadius: '8px', cursor: 'pointer',
                                  border: activeMusic === m.id ? '2px solid #1368ce' : '1px solid #e2e8f0',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                               }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: activeMusic === m.id ? '#1368ce' : '#333' }}>
                                  <i className={`ti ${m.id === 'none' ? 'ti-music-off' : 'ti-music'}`}></i> {m.label}
                               </div>
                               {activeMusic === m.id && <i className="ti ti-check" style={{ color: '#1368ce', fontWeight: 'bold' }}></i>}
                            </div>
                         ))}
                      </div>
                   </div>

                   <button 
                      onClick={() => setShowThemes(false)} 
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', width: '100%', marginTop: '10px' }}>
                      Apply & Close
                   </button>
                </div>
             </div>
          </div>
       )}

    </div>
  );
}
