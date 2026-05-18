import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { Target, MessageSquare, CheckCircle2, BookOpen, ChevronDown, ChevronUp, Edit3, X, History, PlusCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { isSameDay, subDays } from 'date-fns';

export default function MIMethod() {
  const { state, updateProfile, addMiReductionLog } = useAppContext();
  const [showScience, setShowScience] = useState(false);
  const [showWhyBuilder, setShowWhyBuilder] = useState(false);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);

  // Reduction Tracker Logic
  const baseLine = state.profile?.cigarettesPerDay || 15;
  const currentTarget = state.profile?.miCigarettesTarget || Math.max(0, baseLine > 10 ? baseLine - 5 : baseLine - 2);
  const todaySmoked = state.profile?.miCigarettesSmokedToday || 0;
  
  const progressPct = baseLine === 0 ? 100 : Math.min(100, Math.max(5, ((baseLine - currentTarget) / baseLine) * 100));

  const [logSmokeAmount, setLogSmokeAmount] = useState<number | ''>('');
  
  const submitDailyLog = async () => {
    if (typeof logSmokeAmount === 'number' && logSmokeAmount >= 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      await addMiReductionLog({
         date: todayStr,
         cigarettesSmoked: logSmokeAmount,
         targetCigarettes: currentTarget
      });
      await updateProfile({
         miCigarettesSmokedToday: logSmokeAmount,
         miLastLogDate: todayStr
      });

      if (logSmokeAmount <= currentTarget && currentTarget > 0) {
         // Auto adjust target
         const newTarget = Math.max(0, currentTarget - (currentTarget > 5 ? 2 : 1));
         await updateProfile({ miCigarettesTarget: newTarget });
         alert(`Amazing work! You met your target. Your new target for tomorrow is ${newTarget} cigarettes.`);
      } else if (logSmokeAmount > currentTarget) {
         alert("That's okay. Reduction isn't a straight line. Let's discuss this with the AI Coach whenever you're ready.");
      }
      setLogSmokeAmount('');
    }
  };

  // Why I quit builder
  const [personalReasons, setPersonalReasons] = useState<string[]>(state.profile?.mainQuitReason || []);
  const [newReason, setNewReason] = useState('');

  const addReason = async () => {
    if (newReason.trim()) {
      const updated = [...personalReasons, newReason.trim()];
      setPersonalReasons(updated);
      await updateProfile({ mainQuitReason: updated });
      setNewReason('');
    }
  };
  
  // Ambivalence Sheet
  const [pros, setPros] = useState<string[]>(state.profile?.miPros || ['It helps me relax', 'Takes away the craving']);
  const [cons, setCons] = useState<string[]>(state.profile?.miCons || ['Costs too much', 'Makes me cough']);
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  const handleAddPro = async () => {
     if(newPro.trim()) {
        const p = [...pros, newPro.trim()];
        setPros(p);
        setNewPro('');
        await updateProfile({ miPros: p });
     }
  };

  const handleAddCon = async () => {
     if(newCon.trim()) {
        const c = [...cons, newCon.trim()];
        setCons(c);
        setNewCon('');
        await updateProfile({ miCons: c });
     }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const hasLoggedToday = state.profile?.miLastLogDate === todayStr;

  return (
    <div className="p-4 pt-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand font-bold text-xs rounded-lg border-2 border-brand/20">
            <Target className="w-3.5 h-3.5" /> Core Focus
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">The Gradual Quitter</h1>
        <p className="text-sm font-medium text-gray-500 leading-relaxed">Motivational Interviewing: Build intrinsic motivation at your own pace.</p>
      </header>

      {personalReasons.length > 0 && (
         <div className="bg-brand/5 border-2 border-brand/20 p-4 rounded-2xl shadow-[0_4px_0_var(--color-brand-light)] mb-8 relative overflow-hidden text-center max-w-sm mx-auto">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/10 rounded-full opacity-50 blur-xl"></div>
            <h3 className="text-brand font-bold text-xs mb-1.5 isolate">My Why</h3>
            <p className="text-gray-900 font-medium text-sm isolate">"{personalReasons[0]}"</p>
         </div>
      )}

      <section className="space-y-4 mb-8">
        <div className="card-duo border-2 border-brand/20 relative overflow-hidden shadow-[0_4px_0_var(--color-brand-light)]">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-900 text-base">Reduction Tracker</h3>
             <span className="text-xs font-bold text-brand-dark px-2.5 py-1 bg-brand/10 rounded-lg border-2 border-brand/20">Target: {currentTarget}/day</span>
           </div>
           
           <div className="w-full bg-gray-100 rounded-full h-3.5 border-2 border-gray-100 overflow-hidden mb-4">
               <div className="bg-brand h-full rounded-full transition-all relative" style={{width: `${progressPct}%`}}>
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 skew-x-12"></div>
               </div>
           </div>

           {!hasLoggedToday ? (
             <div className="mt-4 pt-4 border-t-2 border-gray-100 flex gap-2">
                <input 
                  type="number" 
                  value={logSmokeAmount} 
                  onChange={e => setLogSmokeAmount(parseInt(e.target.value))} 
                  placeholder="# smoked today" 
                  className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-brand outline-none font-medium" 
                />
                <button onClick={submitDailyLog} className="btn-primary !py-2 !bg-brand-dark text-sm whitespace-nowrap shadow-[0_2px_0_#1e1b4b]">Log daily</button>
             </div>
           ) : (
             <div className="mt-4 pt-4 border-t-2 border-gray-100 text-center">
                <p className="text-sm font-bold text-brand-dark flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> Logged {todaySmoked} for today</p>
                {todaySmoked > currentTarget && (
                   <p className="text-xs font-medium text-gray-500 mt-1">Exceeded target by {todaySmoked - currentTarget}. Be kind to yourself.</p>
                )}
             </div>
           )}

           {state.miReductionLogs.length > 0 && (
             <div className="mt-4 flex gap-1 h-12 items-end justify-between border-t-2 border-gray-100 pt-4">
               {state.miReductionLogs.slice(0, 7).reverse().map(log => {
                  const h = Math.max(10, Math.min(100, (log.cigarettesSmoked / baseLine) * 100));
                  const isOver = log.cigarettesSmoked > log.targetCigarettes;
                  return (
                     <div key={log.id} className="relative flex-1 group">
                        <div className={cn("w-full rounded-t-sm transition-all", isOver ? "bg-red-400" : "bg-brand")} style={{height: `${h}%`}}></div>
                     </div>
                  )
               })}
             </div>
           )}
        </div>

        <div className="card-duo">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">AI Motivation Coach</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Explore ambivalence safely</p>
            </div>
            <div className="w-10 h-10 bg-brand rounded-xl border-2 border-brand-dark flex items-center justify-center shadow-[0_2px_0_var(--color-brand-dark)]">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          </div>
          <button onClick={() => window.location.hash = "chat"} className="w-full btn-outline text-brand-dark text-sm border-brand/30 hover:bg-brand-surface shadow-none">Chat with coach</button>
          
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar mask-fade-right hidden sm:flex">
             <button onClick={() => { window.location.hash = "chat"; }} className="text-xs font-medium bg-gray-50 border-2 border-gray-200 px-3 py-1.5 rounded-xl whitespace-nowrap text-gray-700 hover:bg-gray-100 active:scale-95 transition-transform shadow-[0_2px_0_#E5E7EB]">"I almost gave up today"</button>
             <button onClick={() => { window.location.hash = "chat"; }} className="text-xs font-medium bg-gray-50 border-2 border-gray-200 px-3 py-1.5 rounded-xl whitespace-nowrap text-gray-700 hover:bg-gray-100 active:scale-95 transition-transform shadow-[0_2px_0_#E5E7EB]">"Help me set a new target"</button>
          </div>
        </div>

        <div className="flex gap-4">
           <div onClick={() => setShowWhyBuilder(!showWhyBuilder)} className="flex-1 card-duo p-4 cursor-pointer hover:border-brand/40 active:scale-95 transition-transform">
              <BookOpen className="w-6 h-6 text-brand mb-2" />
              <h4 className="font-bold text-sm text-gray-900">Why I Quit</h4>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">Living Document</p>
           </div>
           <div onClick={() => setShowBalanceSheet(true)} className="flex-1 card-duo p-4 cursor-pointer hover:border-brand/40 active:scale-95 transition-transform">
              <Target className="w-6 h-6 text-brand mb-2" />
              <h4 className="font-bold text-sm text-gray-900">Balance Sheet</h4>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">Weighing Options</p>
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
                Motivational Interviewing (MI) is highly effective for smokers who are ambivalent. Instead of forcing immediate abstinence, MI resolves the conflict between wanting to quit and fearing change.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border-2 border-blue-100">
              <h4 className="text-xs font-bold text-blue-600 mb-1">The Brain on MI</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                MI reduces reactivity in the amygdala and activates the prefrontal cortex as you articulate your own reasons for change. It leverages cognitive dissonance safely.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Why Builder Modal */}
      {showWhyBuilder && (
         <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">Why I Quit Builder</h2>
              <button onClick={() => setShowWhyBuilder(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
               <div className="space-y-3 mb-6">
                 {personalReasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-800 bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                      {r}
                    </div>
                 ))}
               </div>
               <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Add a Reason</label>
                  <textarea 
                     value={newReason} onChange={e => setNewReason(e.target.value)}
                     placeholder="e.g. I want to live long enough to see my grandkids grow up." 
                     className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-brand focus:outline-none min-h-[80px] mb-3 transition-colors"
                  />
                  <button onClick={addReason} disabled={!newReason} className="btn-primary !py-3 w-full disabled:opacity-50 text-sm">Save to anchors</button>
               </div>
            </div>
          </div>
         </div>
      )}

      {/* Ambivalence Balance Sheet Modal */}
      {showBalanceSheet && (
         <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col h-[90vh]">
            <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
              <div>
                 <h2 className="font-bold text-lg text-gray-900">Balance Sheet</h2>
                 <p className="text-xs font-medium text-gray-500">Weighing your ambivalence</p>
              </div>
              <button onClick={() => setShowBalanceSheet(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 bg-gray-50">
               
               <div className="flex-1 bg-brand/5 border-2 border-brand/20 rounded-2xl p-4 shadow-[0_4px_0_var(--color-brand-light)]">
                  <h3 className="font-bold text-brand-dark mb-3 border-b-2 border-brand/10 pb-2 text-sm">Reasons I Smoke (Pros)</h3>
                  <ul className="space-y-2 mb-4">
                     {pros.map((p, i) => <li key={i} className="text-sm font-medium text-brand-dark bg-white p-3 rounded-xl border-2 border-brand/10 shadow-sm">• {p}</li>)}
                  </ul>
                  <div className="flex gap-2">
                     <input type="text" value={newPro} onChange={e => setNewPro(e.target.value)} placeholder="Add reason..." className="flex-1 text-sm font-medium p-3 rounded-xl border-2 border-brand/20 outline-none focus:border-brand focus:bg-white bg-white/50 transition-colors" />
                     <button onClick={handleAddPro} className="bg-brand text-white w-12 flex justify-center items-center rounded-xl shadow-[0_2px_0_var(--color-brand-dark)] active:scale-95 transition-transform"><PlusCircle className="w-5 h-5"/></button>
                  </div>
               </div>

               <div className="flex items-center justify-center -my-2 z-10 relative">
                  <div className="bg-white border-2 text-xs font-bold text-gray-400 border-gray-200 px-3 py-1.5 rounded-full shadow-sm">VS</div>
               </div>

               <div className="flex-1 bg-white border-2 border-gray-200 rounded-2xl p-4 mb-4 shadow-[0_4px_0_#E5E7EB]">
                  <h3 className="font-bold text-gray-900 mb-3 border-b-2 border-gray-100 pb-2 text-sm">Reasons I Want to Quit</h3>
                  <ul className="space-y-2 mb-4">
                     {cons.map((c, i) => <li key={i} className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-xl border-2 border-gray-100 shadow-sm">• {c}</li>)}
                  </ul>
                  <div className="flex gap-2">
                     <input type="text" value={newCon} onChange={e => setNewCon(e.target.value)} placeholder="Add reason..." className="flex-1 text-sm font-medium p-3 rounded-xl border-2 border-gray-200 outline-none focus:border-brand bg-gray-50 focus:bg-white transition-colors" />
                     <button onClick={handleAddCon} className="bg-gray-800 text-white w-12 flex justify-center items-center rounded-xl shadow-[0_2px_0_#1f2937] active:scale-95 transition-transform"><PlusCircle className="w-5 h-5"/></button>
                  </div>
               </div>
               
               {pros.length > 2 && (
                  <div className="bg-brand/10 p-4 rounded-2xl border-2 border-brand/20 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
                     <p className="text-sm text-brand-dark font-medium leading-relaxed">"Notice how many of your 'pros' (like relaxation) are actually just relieving the withdrawal symptoms caused by the previous cigarette. You are taking medicine to cure a disease caused by the medicine itself."</p>
                  </div>
               )}

            </div>
          </div>
         </div>
      )}

    </div>
  );
}
