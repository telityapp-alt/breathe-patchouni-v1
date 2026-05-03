import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { RefreshCw, Map as MapIcon, ChevronRight, BookOpen, ChevronDown, ChevronUp, Plus, X, Hand, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { differenceInDays, isSameDay } from 'date-fns';

export default function HabitMethod() {
  const { state, saveHabitLoop, addHabitLog } = useAppContext();
  const [showScience, setShowScience] = useState(false);
  const [showMapper, setShowMapper] = useState(false);

  // Derive active loop from state or provide defaults
  const activeLoop = state.habitLoops[0] || { id: '', cue: 'Coffee/Morning', routine: 'Smoke', reward: 'Wakefulness', replacement: 'Drink Water' };
  
  const [cue, setCue] = useState(activeLoop.cue);
  const [routine, setRoutine] = useState(activeLoop.routine); // the old negative routine
  const [reward, setReward] = useState(activeLoop.reward);
  const [replacement, setReplacement] = useState(activeLoop.replacement);

  // Sync state when activeLoop changes (e.g. initial load)
  useEffect(() => {
     setCue(activeLoop.cue);
     setRoutine(activeLoop.routine);
     setReward(activeLoop.reward);
     setReplacement(activeLoop.replacement);
  }, [activeLoop.cue, activeLoop.routine, activeLoop.reward, activeLoop.replacement]);

  const replacements = [
     { text: "Chew a piece of strong gum", isRecommended: false },
     { text: "Use your smart inhaler", isRecommended: true },
     { text: "Box breathing for 2 mins", isRecommended: false },
     { text: "Play a quick mobile game", isRecommended: false },
     { text: "Drink a glass of cold water", isRecommended: true },
     { text: "Take a 5 minute walk", isRecommended: true },
  ];

  const handleSaveLoop = async () => {
     await saveHabitLoop({
        id: activeLoop.id || undefined,
        timestamp: new Date().toISOString(),
        cue,
        routine,
        reward,
        replacement
     });
     setShowMapper(false);
  };

  const handleLogSuccess = async (behaviorStr: string) => {
     await addHabitLog({ timestamp: new Date().toISOString(), behavior: behaviorStr });
     alert("Great job completing your replacement habit! Streak updated.");
  };

  // Loop Streak Calculation
  const logs = state.habitLogs;
  let loopStreak = 0;
  let currentDate = new Date();
  const uniqueDates = [...new Set<string>(logs.map(l => new Date(String((l as any).timestamp)).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (uniqueDates.length > 0) {
     const latestDay = new Date(String(uniqueDates[0]));
     if (isSameDay(currentDate, latestDay) || differenceInDays(currentDate, latestDay) === 1) {
        let checkDate = latestDay;
        for (let i = 0; i < uniqueDates.length; i++) {
           const logDate = new Date(String(uniqueDates[i]));
           if (isSameDay(checkDate, logDate)) {
              loopStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
           } else {
              break;
           }
        }
     }
  }

  // Calculate this week's progress for a chart
  const weekStats = [0,0,0,0,0,0,0]; // Last 7 days counts
  for(let i=0; i<7; i++) {
     const d = new Date();
     d.setDate(d.getDate() - (6-i));
     weekStats[i] = logs.filter(l => isSameDay(new Date((l as any).timestamp), d)).length;
  }
  const maxInWeek = Math.max(...weekStats, 1);

  return (
    <div className="p-4 pt-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand font-bold text-xs rounded-lg border-2 border-brand/20">
            <RefreshCw className="w-3.5 h-3.5" /> Core Focus
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Habit Replacement</h1>
        <p className="text-sm font-medium text-gray-500 leading-relaxed">Keep the cue. Keep the reward. Change the routine.</p>
      </header>

      <section className="space-y-4 mb-8">
        <div className="card-duo">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Habit Loop Mapper</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Identify your triggers</p>
            </div>
            <div className="w-10 h-10 bg-brand rounded-xl border-2 border-brand-dark flex items-center justify-center shadow-[0_2px_0_var(--color-brand-dark)]">
              <MapIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div onClick={() => setShowMapper(true)} className="flex items-center justify-between mt-4 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="bg-gray-50 p-2 rounded-xl border-2 border-gray-100 text-[10px] font-bold text-gray-400 text-center flex-1">Cue<br/><span className="text-gray-900 text-sm truncate block w-full mt-0.5">{cue}</span></div>
            <ChevronRight className="w-4 h-4 text-gray-300 mx-1 shrink-0" />
            <div className="bg-brand/10 p-2 border-2 border-brand/20 rounded-xl text-[10px] font-bold text-brand text-center flex-1">Replacing Routine<br/><span className="text-brand-dark text-sm truncate block w-full mt-0.5">{replacement}</span></div>
            <ChevronRight className="w-4 h-4 text-gray-300 mx-1 shrink-0" />
            <div className="bg-gray-50 p-2 rounded-xl border-2 border-gray-100 text-[10px] font-bold text-gray-400 text-center flex-1">Reward<br/><span className="text-gray-900 text-sm truncate block w-full mt-0.5">{reward}</span></div>
          </div>
        </div>

        <div className="card-duo">
          <h3 className="font-bold text-gray-900 text-base mb-1">Replacement Library</h3>
          <p className="text-xs text-gray-500 font-medium mb-4">Tap to log a successful replacement.</p>
          <div className="space-y-2">
             {activeLoop.replacement && (
                 <div onClick={() => handleLogSuccess(activeLoop.replacement)} className="p-3 border-2 border-brand/30 bg-brand/5 rounded-2xl flex items-center justify-between hover:bg-brand/10 cursor-pointer transition-colors shadow-sm active:scale-95">
                   <div className="flex items-center gap-3 text-brand-dark">
                     <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center">
                       <CheckCircle2 className="w-4 h-4 text-brand" />
                     </div>
                     <span className="text-sm font-bold">{activeLoop.replacement} (Current)</span>
                   </div>
                   <div className="bg-brand text-white rounded-lg px-2.5 py-1 text-xs font-bold shadow-[0_2px_0_var(--color-brand-dark)]">LOG</div>
                 </div>
             )}
             {replacements.filter(r => r.text !== activeLoop.replacement).map((r, i) => (
                <div key={i} onClick={() => handleLogSuccess(r.text)} className="p-3 border-2 border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50 cursor-pointer active:scale-95 transition-transform bg-white shadow-sm">
                  <span className="text-sm font-medium text-gray-700">{r.text}</span>
                  {r.isRecommended ? (
                     <div className="bg-blue-100 px-2 py-1 rounded-lg flex items-center justify-center text-[10px] font-bold text-blue-700 border-2 border-blue-200">
                       RECOMMENDED
                     </div>
                  ) : (
                     <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center border-2 border-gray-100">
                       <Plus className="w-3 h-3 text-gray-400" />
                     </div>
                  )}
                </div>
             ))}
          </div>
        </div>

        <div className="card-duo">
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="font-bold text-gray-900 text-sm">Loop Streak</h3>
               <p className="text-xs text-gray-500 font-medium">Days active</p>
             </div>
             <div className="text-2xl font-bold text-brand flex items-baseline gap-1">
                {loopStreak} <span className="text-sm font-medium text-gray-400">days</span>
             </div>
           </div>
           
           {/* Weekly Chart */}
           <div className="flex justify-between items-end h-16 border-t-2 border-gray-100 pt-4">
             {weekStats.map((val, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                   <div className={cn("w-3 rounded-full transition-all", val > 0 ? "bg-brand" : "bg-gray-100")} style={{height: `${Math.max(10, (val/maxInWeek)*100)}%`}}></div>
                </div>
             ))}
           </div>
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
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 space-y-3">
            <div className="bg-white p-3 rounded-xl border-2 border-blue-100">
              <h4 className="text-xs font-bold text-blue-600 mb-1">Scientific Mechanism</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Addiction is often a behavioral loop programmed in the basal ganglia. Habit replacement works by maintaining the cue and reward, but substituting the harmful routine.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border-2 border-blue-100">
              <h4 className="text-xs font-bold text-blue-600 mb-1">The Golden Rule</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                You cannot extinguish a bad habit; you can only overwrite it. Defining what you will do *instead* preempts the automatic sequence.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Editor Modal */}
      {showMapper && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col p-4 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-gray-900">Edit Habit Loop</h2>
                <button onClick={() => setShowMapper(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-4 h-4"/></button>
             </div>
             <div className="space-y-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                   <label className="block text-sm font-bold text-gray-900 mb-1">1. The Cue</label>
                   <p className="text-xs text-gray-500 mb-2 font-medium">What triggers the craving?</p>
                   <input type="text" value={cue} onChange={e => setCue(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-brand transition-colors outline-none" />
                </div>
                <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                   <label className="block text-sm font-bold text-gray-900 mb-1">2. Old Routine</label>
                   <p className="text-xs text-gray-500 mb-2 font-medium">The behavior you want to replace.</p>
                   <input type="text" value={routine} onChange={e => setRoutine(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-brand transition-colors outline-none" />
                </div>
                <div className="bg-brand/5 p-4 rounded-2xl border-2 border-brand/20 shadow-[0_4px_0_var(--color-brand-light)]">
                   <label className="block text-sm font-bold text-brand-dark mb-1">3. New Routine</label>
                   <p className="text-xs text-brand mb-2 font-bold">What you will do instead.</p>
                   <input type="text" value={replacement} onChange={e => setReplacement(e.target.value)} className="w-full bg-white border-2 border-brand/30 rounded-xl p-3 text-sm font-medium focus:border-brand transition-colors outline-none" />
                </div>
                <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                   <label className="block text-sm font-bold text-gray-900 mb-1">4. The Reward</label>
                   <p className="text-xs text-gray-500 mb-2 font-medium">The feeling you get.</p>
                   <input type="text" value={reward} onChange={e => setReward(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-brand transition-colors outline-none" />
                </div>
             </div>
             <button onClick={handleSaveLoop} className="btn-primary w-full text-sm py-3.5">Save changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
