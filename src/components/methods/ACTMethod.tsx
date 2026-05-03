import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { Wind, Activity, ChevronRight, BookOpen, ChevronDown, ChevronUp, CheckCircle2, Play, Square, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const LIBRARY_VALUES = ['Health', 'Family', 'Freedom', 'Career', 'Self-respect', 'Energy', 'Longevity'];
const DAILY_EXERCISES = [
  { id: 'act-1', title: 'Leaves on a Stream', desc: 'Visualize thoughts floating away', duration: '5m' },
  { id: 'act-2', title: 'The Name Game', desc: 'A quick defusion technique', duration: '3m' },
  { id: 'act-3', title: 'Body Scan', desc: 'Grounding into the present moment', duration: '7m' },
];

export default function ACTMethod() {
  const { state, updateProfile, addActUrgeSurf } = useAppContext();
  
  const [showUrgeSurf, setShowUrgeSurf] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [showScience, setShowScience] = useState(false);

  // Values Setup
  const coreValues = state.profile?.actCoreValues || [];
  const [customValue, setCustomValue] = useState('');

  const toggleValue = async (val: string) => {
    const isEditing = coreValues.includes(val);
    const newValues = isEditing ? coreValues.filter(v => v !== val) : [...coreValues, val];
    if (newValues.length <= 5) {
      await updateProfile({ actCoreValues: newValues });
    }
  };

  const addCustomValue = async () => {
    if (customValue.trim() && coreValues.length < 5 && !coreValues.includes(customValue.trim())) {
      await updateProfile({ actCoreValues: [...coreValues, customValue.trim()] });
      setCustomValue('');
    }
  };

  // Urge Surfing State
  const [surfTime, setSurfTime] = useState(0);
  const [surfInterval, setSurfInterval] = useState<any>(null);
  const [surfPhase, setSurfPhase] = useState<'intro' | 'surfing' | 'summary'>('intro');

  const startSurfing = () => {
    setSurfPhase('surfing');
    setSurfTime(0);
    const int = setInterval(() => {
      setSurfTime(prev => prev + 1);
    }, 1000);
    setSurfInterval(int);
  };

  const endSurfing = async () => {
    if (surfInterval) clearInterval(surfInterval);
    const durationMinutes = Math.max(1, Math.round(surfTime / 60));
    await addActUrgeSurf({
      timestamp: new Date().toISOString(),
      durationMinutes
    });
    setSurfPhase('summary');
  };

  // Daily Exercise
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const completedExecs = state.profile?.actExercisesCompleted || [];

  const completeExercise = async (id: string) => {
    if (!completedExecs.includes(id)) {
      await updateProfile({ actExercisesCompleted: [...completedExecs, id] });
    }
    setActiveExercise(null);
  };

  const todayExercise = DAILY_EXERCISES[0];

  return (
    <div className="p-4 pt-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-6 space-y-3">
         <div className="flex justify-between items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand-dark font-bold text-xs rounded-lg border-2 border-brand/20">
              <Wind className="w-3.5 h-3.5" /> Core Focus
            </div>
         </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Acceptance & Commitment</h1>
        <p className="text-sm font-medium text-gray-500 leading-relaxed">Don't fight the urge—observe it, accept it, and let it pass.</p>
      </header>

      {coreValues.length > 0 && (
         <div className="flex overflow-x-auto gap-2 pb-4 mb-2 no-scrollbar">
            {coreValues.map(v => (
              <div key={v} className="bg-brand-surface border-2 border-brand/20 text-brand-dark px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-[0_2px_0_var(--color-brand-light)]">
                Anchor: {v}
              </div>
            ))}
         </div>
      )}

      <section className="space-y-4 mb-8">
        <div className="card-duo bg-brand/5 border-brand/20 relative overflow-hidden shadow-[0_4px_0_var(--color-brand-light)]">
          <div className="absolute -top-4 -right-4 p-4 opacity-5">
             <Activity className="w-32 h-32" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Urge Surfing Tool</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Ride the wave of a craving</p>
            </div>
            <div className="w-10 h-10 bg-brand rounded-xl border-2 border-brand-dark flex items-center justify-center shadow-[0_2px_0_var(--color-brand-dark)]">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </div>
          <button onClick={() => { setShowUrgeSurf(true); setSurfPhase('intro'); }} className="w-full btn-primary !bg-brand-dark hover:!bg-brand shadow-[0_4px_0_#1e1b4b] relative z-10 flex items-center justify-center gap-2 text-sm">
             <Play className="w-4 h-4 fill-white" /> Start surf
          </button>
        </div>

        <div className="card-duo">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h3 className="font-bold text-gray-900 text-base">My Core Values</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Setup your life anchors</p>
             </div>
             <button onClick={() => setShowValues(!showValues)} className="text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex justify-center items-center transition-colors">
                {showValues ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4"/>}
             </button>
          </div>

          {showValues ? (
             <div className="space-y-4 animate-in slide-in-from-top-2 border-t-2 border-gray-100 pt-4 mt-2">
                <p className="text-xs text-gray-500 font-bold mb-2">Select up to 5</p>
                <div className="flex flex-wrap gap-2">
                   {LIBRARY_VALUES.map(val => (
                      <button 
                         key={val}
                         onClick={() => toggleValue(val)}
                         className={cn("px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all", coreValues.includes(val) ? "bg-brand text-white border-brand-dark shadow-[0_2px_0_var(--color-brand-dark)]" : "bg-white text-gray-600 border-gray-200 hover:border-brand/40 shadow-[0_2px_0_#E5E7EB]")}
                      >
                         {val}
                      </button>
                   ))}
                </div>
                <div className="flex items-center gap-2 mt-4 bg-gray-50 p-2 rounded-2xl border-2 border-gray-200">
                   <input value={customValue} onChange={e => setCustomValue(e.target.value)} type="text" placeholder="Add custom value..." className="flex-1 bg-transparent px-3 py-1 text-sm font-medium focus:outline-none" />
                   <button onClick={addCustomValue} className="w-8 h-8 bg-brand/10 text-brand-dark rounded-xl flex items-center justify-center hover:bg-brand/20 active:scale-95 transition-transform border-2 border-brand/20">
                      <Plus className="w-4 h-4" />
                   </button>
                </div>
             </div>
          ) : (
             <div className="flex flex-wrap gap-2">
                {coreValues.length > 0 ? coreValues.map(v => (
                  <span key={v} className="px-3 py-1 bg-gray-100 border-2 border-gray-200 rounded-lg text-xs font-bold text-gray-700">{v}</span>
                )) : (
                  <p className="text-sm font-medium text-gray-400">No values set. Tap edit to setup.</p>
                )}
             </div>
          )}
        </div>

        <div className="card-duo">
           <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveExercise(todayExercise.id)}>
             <div>
               <h3 className="font-bold text-gray-900 text-base">Daily Defusion</h3>
               <p className="text-xs font-bold text-brand mt-0.5">{todayExercise.title}</p>
             </div>
             <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
               <ChevronRight className="w-4 h-4 text-gray-600" />
             </button>
           </div>
           
           <div className="mt-4 w-full bg-gray-100 rounded-full h-2.5 border-2 border-gray-100">
              <div className="bg-brand h-full rounded-full transition-all" style={{width: `${(completedExecs.length / DAILY_EXERCISES.length) * 100}%`}}></div>
           </div>
           <p className="text-[10px] text-gray-500 font-bold mt-2 text-right">{completedExecs.length}/{DAILY_EXERCISES.length} Exercises Done</p>
        </div>
      </section>

      <section className="card-duo bg-blue-50 border-blue-100 shadow-[0_4px_0_#dbeafe] transition-all duration-300">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowScience(!showScience)}>
           <h3 className="font-bold flex items-center gap-2 text-blue-900 text-sm">
              <BookOpen className="w-4 h-4 text-blue-500" /> Why this works
           </h3>
           {showScience ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
        </div>
        {showScience && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-white p-3 rounded-xl border-2 border-blue-100 mb-3">
              <h4 className="text-xs font-bold text-blue-600 mb-1">Science Fact</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                ACT is proven effective, especially for smokers with high anxiety. Instead of suppressing the urge, ACT teaches accepting cravings as temporary physical sensations while staying committed to your values.
              </p>
            </div>
            <div className="flex gap-2">
               <div className="flex-1 bg-white p-3 rounded-xl border-2 border-blue-100">
                  <p className="text-[10px] text-gray-500 font-bold mb-0.5">Total surfs</p>
                  <p className="text-lg font-bold text-gray-900">{state.actUrges.length}</p>
               </div>
               <div className="flex-1 bg-white p-3 rounded-xl border-2 border-blue-100 text-right">
                  <p className="text-[10px] text-gray-500 font-bold mb-0.5">Method fit</p>
                  <p className="text-sm font-bold text-blue-600 truncate">High Anxiety</p>
               </div>
            </div>
          </div>
        )}
      </section>

      {/* Surfing Modal */}
      {showUrgeSurf && (
        <div className="fixed inset-0 z-[60] bg-brand-dark flex flex-col justify-between animate-in fade-in">
          <div className="p-4 pt-12 text-center text-white relative z-10">
             <h2 className="text-xl font-bold mb-1">{surfPhase === 'intro' ? 'Ready to surf?' : surfPhase === 'surfing' ? 'Riding the wave...' : 'Urge surfed!'}</h2>
             {surfPhase === 'surfing' && (
                <div className="font-bold text-3xl opacity-90 mt-2 bg-black/20 inline-block px-4 py-2 rounded-2xl border-2 border-white/10">
                   {Math.floor(surfTime / 60)}:{(surfTime % 60).toString().padStart(2, '0')}
                </div>
             )}
          </div>

          {/* Animated Wave Background Simulation */}
          {surfPhase === 'surfing' && (
             <div className="absolute inset-x-0 bottom-0 top-1/3 overflow-hidden opacity-30 flex flex-col justify-end">
                <div className="w-full h-full animate-wave bg-gradient-to-t from-brand-light to-transparent flex-1" style={{ animationDuration: '4s', animationIterationCount: 'infinite', animationDirection: 'alternate' }}></div>
             </div>
          )}

          <div className="p-4 relative z-10 mb-8 max-w-sm mx-auto w-full">
            {surfPhase === 'intro' && (
               <div className="space-y-4">
                  <p className="text-white/80 text-center font-medium mb-8 text-sm">Notice the physical sensations of your craving. Where is it in your body? Imagine it as an ocean wave. It will peak, and it will break.</p>
                  <button onClick={startSurfing} className="btn-primary w-full bg-white text-brand-dark hover:bg-white/90 shadow-[0_4px_0_#94a3b8] border-2 border-transparent">I'm ready</button>
                  <button onClick={() => setShowUrgeSurf(false)} className="w-full text-white/70 font-bold text-sm py-3 hover:text-white transition-colors">Cancel</button>
               </div>
            )}
            {surfPhase === 'surfing' && (
               <div className="space-y-4">
                  <p className="text-white/90 text-center font-medium mb-8 text-sm">Just breathe normally. Don't fight it. The wave is passing through you.</p>
                  <button onClick={endSurfing} className="btn-primary w-full bg-brand-dark border-2 border-brand hover:bg-brand-dark flex items-center justify-center gap-2 shadow-[0_4px_0_var(--color-brand)]">
                     <Square className="w-4 h-4 fill-white" /> Urge passed
                  </button>
               </div>
            )}
            {surfPhase === 'summary' && (
               <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-brand rounded-2xl border-2 border-brand-dark flex items-center justify-center mx-auto mb-2 text-white shadow-[0_4px_0_var(--color-brand-dark)]">
                     <Activity className="w-8 h-8" />
                  </div>
                  <p className="text-white/90 font-medium text-sm">You successfully let the urge pass without acting on it. Every time you do this, the wave gets smaller.</p>
                  {coreValues.length > 0 && (
                     <div className="bg-black/20 border-2 border-white/10 p-4 rounded-2xl">
                        <p className="text-[10px] text-white/60 font-bold mb-1">Aligned with your values</p>
                        <p className="text-white font-bold text-sm">{coreValues[0]} {coreValues.length > 1 ? `& ${coreValues[1]}` : ''}</p>
                     </div>
                  )}
                  <button onClick={() => setShowUrgeSurf(false)} className="btn-primary w-full bg-white text-brand-dark hover:bg-white/90 shadow-[0_4px_0_#94a3b8] border-2 border-transparent">Return to plan</button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Exercise Modal */}
      {activeExercise && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 shadow-2xl overflow-hidden flex flex-col p-4">
             <h2 className="font-bold text-xl text-gray-900 mb-2">{todayExercise.title}</h2>
             <span className="inline-block px-3 py-1 bg-brand/10 border-2 border-brand/20 text-brand-dark rounded-xl text-xs font-bold mb-6 w-fit">{todayExercise.duration}</span>
             <p className="text-gray-600 font-medium mb-8 leading-relaxed text-sm bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
               Close your eyes and imagine a gentle stream with leaves floating on the surface. Every time a thought or craving pops into your head, place it on a leaf and watch it float away.
               <br/><br/>
               If your mind goes blank, watch the stream. If you get stuck on a thought, gently place it back on a leaf.
             </p>
             <button onClick={() => completeExercise(todayExercise.id)} className="btn-primary w-full shadow-[0_4px_0_var(--color-brand-dark)] border-2 border-brand-dark">
               Mark as complete
             </button>
             <button onClick={() => setActiveExercise(null)} className="mt-4 text-gray-500 font-bold text-sm w-full py-2 hover:text-gray-800 transition-colors">
               Close
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
