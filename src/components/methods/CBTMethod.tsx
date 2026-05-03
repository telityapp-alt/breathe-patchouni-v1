import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { BrainCircuit, BookOpen, PenTool, HeartPulse, ChevronRight, X, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CBTMethod() {
  const { state, addCbtJournal, updateProfile } = useAppContext();
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [showScience, setShowScience] = useState(false);

  // Journal form state
  const [situationTag, setSituationTag] = useState('');
  const [thought, setThought] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [reframe, setReframe] = useState('');
  const [journalStep, setJournalStep] = useState(1);
  const [isJournalSubmitting, setIsJournalSubmitting] = useState(false);

  // SOS state
  const [sosStep, setSosStep] = useState(1);
  const [sosTimeLeft, setSosTimeLeft] = useState(300); // 5 mins
  const [sosInterval, setSosInterval] = useState<any>(null);

  const tags = ['Stress', 'Social', 'Boredom', 'After Meal', 'Waking Up', 'Drinking Coffee', 'Working'];

  const handleJournalSubmit = async () => {
    setIsJournalSubmitting(true);
    await addCbtJournal({
      timestamp: new Date().toISOString(),
      situation: situationTag,
      situationTag: situationTag,
      thought,
      intensity,
      reframe
    });
    setSituationTag('');
    setThought('');
    setIntensity(5);
    setReframe('');
    setJournalStep(1);
    setShowJournalForm(false);
    setIsJournalSubmitting(false);
  };

  const generateReframeTemplate = () => {
    setReframe(`I don't have to smoke just because I feel ${situationTag || 'this way'}. Instead of smoking to cope with "${thought}", I can take a deep breath and let it pass.`);
    setJournalStep(3);
  };

  const startSos = () => {
    setShowSos(true);
    setSosStep(1);
    setSosTimeLeft(300);
    const int = setInterval(() => {
      setSosTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(int);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setSosInterval(int);
  };

  const endSos = async () => {
    if (sosInterval) clearInterval(sosInterval);
    const uses = (state.profile?.cbtSosUses || 0) + 1;
    await updateProfile({ cbtSosUses: uses });
    setShowSos(false);
  };

  // Compute trigger map data
  const triggerCounts = state.cbtJournals.reduce((acc, journal) => {
    acc[journal.situationTag] = (acc[journal.situationTag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
  const maxTrigger = sortedTriggers.length > 0 ? sortedTriggers[0][1] : 1;
  const topTriggerCat = sortedTriggers.length > 0 ? sortedTriggers[0][0] : 'None yet';

  return (
    <div className="p-4 pt-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand font-bold text-xs rounded-lg border-2 border-brand/20">
            <BrainCircuit className="w-3.5 h-3.5" /> Core Focus
          </div>
          {(state.profile?.cbtSosUses || 0) > 0 && (
             <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-brand" /> SOS used {state.profile?.cbtSosUses}x
             </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Cognitive Behavioral</h1>
        <p className="text-sm font-medium text-gray-500 leading-relaxed">Rewire the thought patterns that trigger cravings.</p>
      </header>

      <section className="space-y-4 mb-8">
        <div className="card-duo">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Thought Journal</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Log thoughts before a craving</p>
            </div>
            <div className="w-10 h-10 bg-brand rounded-xl border-2 border-brand-dark flex items-center justify-center shadow-[0_2px_0_var(--color-brand-dark)]">
              <PenTool className="w-4 h-4 text-white" />
            </div>
          </div>
          <button onClick={() => setShowJournalForm(true)} className="btn-primary w-full text-sm">Write an entry</button>
          
          {/* History Snippet */}
          {state.cbtJournals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-gray-500">Recent entries</h4>
              {state.cbtJournals.slice(0, 3).map((j, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-1.5">
                     <span className="text-xs font-bold text-brand">{j.situationTag}</span>
                     <span className="text-[10px] font-bold text-gray-400">{new Date(j.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">"{j.thought}"</p>
                  <div className="mt-2 text-xs text-brand-dark bg-brand/5 p-2 rounded-lg border-2 border-brand/10 font-medium">
                    <span className="font-bold">Reframe:</span> {j.reframe}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-duo">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">SOS Exercise</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">3-minute cognitive reset</p>
            </div>
            <div className="w-10 h-10 bg-red-500 rounded-xl border-2 border-red-700 flex items-center justify-center shadow-[0_2px_0_#991b1b]">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
          </div>
          <button onClick={startSos} className="w-full btn-outline text-gray-700 text-sm">Start protocol</button>
        </div>

        <div className="card-duo">
          <h3 className="font-bold text-gray-900 text-base mb-4">Trigger Map</h3>
          {sortedTriggers.length === 0 ? (
            <div className="bg-gray-50 rounded-xl h-24 flex items-center justify-center border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium text-sm">Not enough data to map triggers yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTriggers.map(([tag, count]) => (
                <div key={tag}>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-gray-700">{tag}</span>
                    <span className="text-gray-500">{String(count)} logs</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 border-2 border-gray-100">
                    <div className="bg-brand h-full rounded-full transition-all" style={{width: `${(Number(count) / Number(maxTrigger)) * 100}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                CBT is the most researched therapy for cessation. It works by changing automatic thought patterns that link situations to smoking urges.
              </p>
            </div>
            
            <div className="flex gap-2">
               <div className="flex-1 bg-white p-3 rounded-xl border-2 border-blue-100">
                  <p className="text-[10px] text-gray-500 font-bold mb-0.5">Total logs</p>
                  <p className="text-lg font-bold text-gray-900">{state.cbtJournals.length}</p>
               </div>
               <div className="flex-1 bg-white p-3 rounded-xl border-2 border-blue-100 text-right">
                  <p className="text-[10px] text-gray-500 font-bold mb-0.5">Top trigger</p>
                  <p className="text-sm font-bold text-blue-600 truncate">{topTriggerCat}</p>
               </div>
            </div>
          </div>
        )}
      </section>

      {/* Journal Modal  */}
      {showJournalForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">Thought Journal</h2>
              <button onClick={() => setShowJournalForm(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {journalStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">What's the situation triggering you?</label>
                    <div className="flex flex-wrap gap-2">
                       {tags.map(t => (
                         <button 
                           key={t}
                           onClick={() => setSituationTag(t)}
                           className={cn("px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors", situationTag === t ? "bg-brand text-white border-brand-dark shadow-[0_2px_0_var(--color-brand-dark)]" : "bg-white text-gray-600 border-gray-200 shadow-[0_2px_0_#E5E7EB] hover:border-gray-300")}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">How intense is the craving?</label>
                    <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                       <span className="text-xs font-bold text-gray-500">Low</span>
                       <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="flex-1 accent-brand h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                       <span className="text-xs font-bold text-gray-500">High</span>
                    </div>
                  </div>
                  <button onClick={() => setJournalStep(2)} disabled={!situationTag} className="btn-primary w-full disabled:opacity-50 text-sm py-3.5">Next</button>
                </div>
              )}

              {journalStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">What is your automatic thought?</label>
                    <p className="text-xs text-gray-500 mb-3 font-medium">e.g. "I can't handle this stress without smoking"</p>
                    <textarea 
                      value={thought}
                      onChange={(e) => setThought(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-gray-900 focus:outline-none focus:border-brand font-medium text-sm min-h-[120px]"
                      placeholder="Write your thought here..."
                    />
                  </div>
                  <button onClick={generateReframeTemplate} disabled={!thought} className="btn-primary w-full disabled:opacity-50 text-sm py-3.5">Challenge thought</button>
                </div>
              )}

              {journalStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Reframe the thought</label>
                    <p className="text-xs text-gray-500 mb-3 font-medium">We've generated a healthier alternative. Edit it if you like.</p>
                    <textarea 
                      value={reframe}
                      onChange={(e) => setReframe(e.target.value)}
                      className="w-full bg-brand/5 border-2 border-brand/20 rounded-2xl p-4 text-brand-dark font-medium focus:outline-none focus:border-brand text-sm min-h-[120px]"
                    />
                  </div>
                  <button onClick={handleJournalSubmit} disabled={isJournalSubmitting} className="btn-primary w-full disabled:opacity-50 text-sm py-3.5">
                    {isJournalSubmitting ? 'Saving...' : 'Save entry'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SOS Protocol  */}
      {showSos && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in">
          <div className="p-4 flex justify-between items-center border-b-2 border-gray-100">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-200 flex justify-center items-center">
                   <HeartPulse className="w-4 h-4 text-red-500 animate-pulse" />
                </div>
                <h2 className="font-bold text-gray-900 text-sm">SOS Exercise</h2>
             </div>
             <div className="font-bold text-lg text-gray-900 tabular-nums bg-gray-100 px-3 py-1 rounded-lg border-2 border-gray-200">
                {Math.floor(sosTimeLeft / 60)}:{(sosTimeLeft % 60).toString().padStart(2, '0')}
             </div>
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-8 max-w-md mx-auto w-full">
             {sosStep === 1 && (
               <div className="animate-in slide-in-from-bottom-8 w-full space-y-6">
                 <h3 className="text-2xl font-bold text-gray-900 leading-tight">Breathe. You have time.</h3>
                 <p className="text-gray-500 font-medium text-sm">Craving peaks pass within 3-5 minutes. What is the one thought making you want to smoke right now?</p>
                 <input type="text" className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-gray-900 focus:border-brand transition-colors outline-none font-medium text-sm" placeholder="I feel overwhelmed..." />
                 <button onClick={() => setSosStep(2)} className="btn-primary w-full py-4 text-base">Continue</button>
               </div>
             )}

             {sosStep === 2 && (
               <div className="animate-in slide-in-from-right-8 w-full space-y-6">
                 <h3 className="text-2xl font-bold text-gray-900 leading-tight">Fact or assumption?</h3>
                 <p className="text-gray-500 font-medium text-sm">Thoughts are not facts. Is smoking the truly ONLY way to solve this, or just the habitual one?</p>
                 <button onClick={() => setSosStep(3)} className="btn-outline w-full py-4 text-sm font-bold bg-white text-gray-700 mb-3">It's just a habit</button>
                 <button onClick={() => setSosStep(3)} className="btn-outline w-full py-4 text-sm font-bold bg-white text-gray-700">I'm assuming it will help</button>
               </div>
             )}

             {sosStep === 3 && (
               <div className="animate-in slide-in-from-right-8 w-full space-y-6">
                 <div className="w-16 h-16 bg-brand/10 border-2 border-brand/20 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-brand" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 leading-tight">You've got this.</h3>
                 <p className="text-gray-500 font-medium text-sm">The intensity is already dropping. Drink a glass of water, or take 5 deep breaths.</p>
                 <button onClick={endSos} className="btn-primary w-full py-4 text-base">Finish exercise</button>
               </div>
             )}
          </div>
          <button onClick={endSos} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs font-bold hover:text-gray-600 active:scale-95 transition-all">Cancel Exercise</button>
        </div>
      )}
    </div>
  );
}

