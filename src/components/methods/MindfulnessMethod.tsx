import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../store/AppContext';
import { Brain, Hand, Bell, Clock, BookOpen, Play, CheckCircle2, ChevronRight, X, ChevronDown, ChevronUp, Pause } from 'lucide-react';
import { differenceInDays, isSameDay } from 'date-fns';
import { cn } from '../../lib/utils';
import { MindfulnessLog } from '../../lib/db';

const SESSIONS = [
  { id: '1', title: 'Breathing Anchor', duration: 5, steps: ['Settle into a comfortable posture.', 'Bring your attention to your breathing.', 'Notice where you feel the breath most distinctly.', 'When your mind wanders, gently bring it back.', 'Rest in this simple awareness.'] },
  { id: '2', title: 'Body Scan', duration: 10, steps: ['Lie down or sit comfortably.', 'Bring awareness to your toes.', 'Slowly move up through your legs.', 'Notice any tension in your back or shoulders.', 'Breathe into those areas and release.', 'Sweep your attention to the top of your head.'] },
  { id: '3', title: 'Craving Observation', duration: 5, steps: ['Notice the urge rising in your body.', 'Where do you feel it? Is it tight or hot?', 'Don\'t fight it, just observe it.', 'It is just a sensation, not a command.', 'Watch it peak and begin to pass.'] },
  { id: '4', title: 'Loving-Kindness', duration: 7, steps: ['Think of someone you care about deeply.', 'Silently wish them well.', 'Now direct that same kindness to yourself.', 'May I be at ease. May I be free from suffering.', 'Acknowledge how hard quitting is, and be gentle with yourself.'] },
  { id: '5', title: 'RAIN Technique', duration: 8, steps: ['Recognize what is happening inside you.', 'Allow the feeling to be there without judgment.', 'Investigate with gentle curiosity—what does your body need?', 'Nurture yourself with self-compassion.'] },
  { id: '6', title: 'Urge Surfing', duration: 5, steps: ['Picture your urge as an ocean wave.', 'Watch it build and crest.', 'Ride the wave without getting pulled under.', 'The wave is passing.', 'Notice the calm as the water recedes.'] },
  { id: '7', title: 'Morning Intention', duration: 5, steps: ['Take three deep breaths to start the day.', 'What is your intention for today?', 'You are committed to your health and freedom.', 'Visualize moving through the day successfully.', 'Open your eyes and begin.'] }
];

export default function MindfulnessMethod() {
  const { state, updateProfile, addMindfulnessLog } = useAppContext();
  
  const [showLog, setShowLog] = useState(false);
  const [showSessionList, setShowSessionList] = useState(false);
  const [activeSession, setActiveSession] = useState<typeof SESSIONS[0] | null>(null);
  const [showScience, setShowScience] = useState(false);
  
  // Session Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Awareness Log
  const [logMoodBefore, setLogMoodBefore] = useState('');
  const [logMoodAfter, setLogMoodAfter] = useState('');
  const [logPhysical, setLogPhysical] = useState('');
  const [logSatisfaction, setLogSatisfaction] = useState(5);

  // Bell Settings
  const [showBellSettings, setShowBellSettings] = useState(false);
  const bellIntervals = [1, 2, 4, 8];
  const bellIntervalHr = state.profile?.mindfulnessBellInterval || 0;

  // Clarity Streak Calculation
  const logs = state.mindfulnessLogs;
  let clarityStreak = 0;
  let currentDate = new Date();
  
  // Calculate consecutive days backwards from today or yesterday
  const uniqueDates = [...new Set<string>(logs.map(l => new Date(String((l as any).timestamp)).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (uniqueDates.length > 0) {
     const latestDay = new Date(String(uniqueDates[0]));
     if (isSameDay(currentDate, latestDay) || differenceInDays(currentDate, latestDay) === 1) {
        let checkDate = latestDay;
        let count = 0;
        for (let i = 0; i < uniqueDates.length; i++) {
           const logDate = new Date(String(uniqueDates[i]));
           if (isSameDay(checkDate, logDate)) {
              count++;
              checkDate.setDate(checkDate.getDate() - 1);
           } else {
              break;
           }
        }
        clarityStreak = count;
     }
  }

  // Session timer hook
  useEffect(() => {
    let int: any;
    if (isPlaying && timeRemaining > 0 && activeSession) {
      int = setInterval(() => {
        setTimeRemaining(prev => {
           if (prev <= 1) {
              completeSession();
              return 0;
           }
           // Auto advance step based on proportion of time
           const elapsed = (activeSession.duration * 60) - (prev - 1);
           const timePerStep = (activeSession.duration * 60) / activeSession.steps.length;
           const newStep = Math.min(activeSession.steps.length - 1, Math.floor(elapsed / timePerStep));
           if (newStep !== currentStepIndex) setCurrentStepIndex(newStep);
           return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(int);
  }, [isPlaying, timeRemaining, activeSession, currentStepIndex]);

  const startSession = (session: typeof SESSIONS[0]) => {
     setActiveSession(session);
     setTimeRemaining(session.duration * 60);
     setCurrentStepIndex(0);
     setIsPlaying(true);
     setShowSessionList(false);
  };

  const completeSession = async () => {
     setIsPlaying(false);
     await addMindfulnessLog({ timestamp: new Date().toISOString(), type: 'session', durationMinutes: activeSession?.duration });
     setActiveSession(null);
  };

  const submitAwarenessLog = async () => {
     await addMindfulnessLog({
       timestamp: new Date().toISOString(),
       type: 'rain',
       satisfactionRating: logSatisfaction,
       rainRecognize: `Before: ${logMoodBefore}, After: ${logMoodAfter}`,
       rainInvestigate: logPhysical
     });
     setShowLog(false);
     setLogMoodBefore('');
     setLogMoodAfter('');
     setLogPhysical('');
     setLogSatisfaction(5);
  };

  const interactWithBell = async () => {
     await addMindfulnessLog({ timestamp: new Date().toISOString(), type: 'bell' });
     alert("You paused and took a deep breath. Good job.");
  };

  const now = new Date();
  const bellMinutesLeft = bellIntervalHr ? Math.round(bellIntervalHr * 60 - ((now.getHours() * 60 + now.getMinutes()) % (bellIntervalHr * 60))) : 0;

  return (
    <div className="p-4 pt-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand font-bold text-xs rounded-lg border-2 border-brand/20">
            <Brain className="w-3.5 h-3.5" /> Core Focus
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Mindfulness</h1>
        <p className="text-sm font-medium text-gray-500 leading-relaxed">Break the autopilot cycle by bringing awareness to the present.</p>
      </header>

      <section className="space-y-4 mb-8">
        <div className="card-duo">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Daily Guided Session</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Text-guided audio alternatives.</p>
            </div>
            <div className="w-10 h-10 bg-brand rounded-xl border-2 border-brand-dark flex items-center justify-center shadow-[0_2px_0_var(--color-brand-dark)]">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <button onClick={() => setShowSessionList(true)} className="w-full btn-outline text-brand-dark border-brand/30 hover:bg-brand-surface flex items-center justify-center gap-2 text-sm shadow-none">
            <Play className="w-4 h-4" /> Pick a session
          </button>
        </div>

        <div className="flex gap-4">
          <div onClick={() => setShowLog(true)} className="flex-1 card-duo p-4 cursor-pointer hover:border-brand/40 active:scale-95 transition-transform">
            <Hand className="w-6 h-6 text-brand mb-2" />
            <h4 className="font-bold text-sm text-gray-900">Awareness Log</h4>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5">Reality Check</p>
          </div>
          <div onClick={() => setShowBellSettings(!showBellSettings)} className="flex-1 card-duo p-4 cursor-pointer hover:border-brand/40 active:scale-95 transition-transform relative">
            <Bell className={cn("w-6 h-6 mb-2", bellIntervalHr > 0 ? "text-brand" : "text-gray-300")} />
            <h4 className="font-bold text-sm text-gray-900">Craving Bell</h4>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5">{bellIntervalHr > 0 ? `Next in ~${bellMinutesLeft}m` : 'Off'}</p>
          </div>
        </div>

        {showBellSettings && (
           <div className="card-duo animate-in slide-in-from-top-2">
              <h4 className="font-bold text-sm mb-2 text-gray-900">Bell Interval</h4>
              <p className="text-xs text-gray-500 mb-4 font-medium">Receive mindful push notifications throughout your day.</p>
              <div className="flex gap-2 mb-4">
                 <button onClick={() => updateProfile({ mindfulnessBellInterval: 0 })} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all shadow-[0_2px_0_#E5E7EB]", bellIntervalHr === 0 ? "bg-brand text-white border-brand-dark shadow-[0_2px_0_var(--color-brand-dark)]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>Off</button>
                 {bellIntervals.map(h => (
                   <button key={h} onClick={() => updateProfile({ mindfulnessBellInterval: h })} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all shadow-[0_2px_0_#E5E7EB]", bellIntervalHr === h ? "bg-brand text-white border-brand-dark shadow-[0_2px_0_var(--color-brand-dark)]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>{h}h</button>
                 ))}
              </div>
              <button onClick={interactWithBell} className="text-xs font-bold text-brand hover:text-brand-dark underline decoration-2 underline-offset-2">Simulate tap</button>
           </div>
        )}

        <div className="card-duo flex items-center justify-between">
           <div>
             <h3 className="font-bold text-gray-900 text-sm">Clarity Streak</h3>
             <p className="text-xs text-gray-500 font-medium">Consecutive days active</p>
           </div>
           <div className="text-2xl font-bold text-brand flex items-baseline gap-1">
              {clarityStreak} <span className="text-sm font-medium text-gray-400">days</span>
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
                Mindfulness increases awareness of urges without automatic reactivity. It trains "decoupling"—breaking the deep-seated neurological link between craving and action.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border-2 border-blue-100">
              <h4 className="text-xs font-bold text-blue-600 mb-1">The Brain on Mindfulness</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                fMRI scans show mindfulness decreases activity in the Default Mode Network and increases prefrontal cortex connectivity, enhancing cognitive brakes.
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border-2 border-blue-100">
              <h4 className="text-xs font-bold text-blue-600 mb-1">Awareness Log Impact</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                Habitual smokers imagine smoking as highly satisfying. Rating it immediately after updates your reward prediction error, destroying the illusion.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* RAIN Awareness Log Overlay */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-gray-900">Awareness Log</h2>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Post-Smoking Reality Check</p>
              </div>
              <button onClick={() => setShowLog(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-gray-50">
               <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Mood Before</label>
                  <input type="text" value={logMoodBefore} onChange={e => setLogMoodBefore(e.target.value)} placeholder="e.g. Stressed, Craving" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-brand outline-none transition-colors" />
               </div>
               <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Mood After</label>
                  <input type="text" value={logMoodAfter} onChange={e => setLogMoodAfter(e.target.value)} placeholder="e.g. Guilty, Lethargic" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-brand outline-none transition-colors" />
               </div>
               <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Physical Sensations</label>
                  <textarea value={logPhysical} onChange={e => setLogPhysical(e.target.value)} placeholder="Does your throat burn? How does it taste?" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-medium focus:border-brand outline-none min-h-[80px] transition-colors" />
               </div>
               <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <label className="block text-sm font-bold text-gray-900 mb-2">Satisfaction Rating</label>
                  <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                     <span className="text-xs font-bold text-gray-400">Low</span>
                     <input type="range" min="1" max="10" value={logSatisfaction} onChange={(e) => setLogSatisfaction(Number(e.target.value))} className="flex-1 accent-brand h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                     <span className="text-xs font-bold text-brand w-4 text-center">{logSatisfaction}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-3 text-center">Did it feel as good as the craving promised?</p>
               </div>
               <button onClick={submitAwarenessLog} disabled={!logMoodBefore || !logMoodAfter} className="btn-primary w-full disabled:opacity-50 text-sm py-3.5">Save log</button>
            </div>
          </div>
        </div>
      )}

      {/* Session Selection */}
      {showSessionList && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">Mindfulness Sessions</h2>
              <button onClick={() => setShowSessionList(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50">
               {SESSIONS.map(s => (
                  <button key={s.id} onClick={() => startSession(s)} className="w-full text-left p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-brand shadow-sm active:scale-95 transition-all flex justify-between items-center group">
                     <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-brand transition-colors">{s.title}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{s.duration} min • Guided Text</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                        <Play className="w-4 h-4 text-brand fill-brand" />
                     </div>
                  </button>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Session Player UI */}
      {activeSession && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 animate-in fade-in text-center p-4">
           <button onClick={() => { setActiveSession(null); setIsPlaying(false); }} className="absolute top-6 right-6 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
              <X className="w-5 h-5" />
           </button>

           <div className={cn("w-32 h-32 bg-brand/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_var(--color-brand)] transition-all duration-1000", isPlaying ? "animate-pulse" : "")}>
              <div className="w-24 h-24 bg-brand/40 rounded-full flex items-center justify-center border-2 border-brand/50">
                 <Brain className="w-10 h-10 text-white/90" />
              </div>
           </div>
           
           <h2 className="text-2xl font-bold text-white mb-2">{activeSession.title}</h2>
           <div className="font-bold text-4xl text-white/90 mb-8 bg-black/20 px-6 py-3 rounded-3xl border-2 border-white/10">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
           </div>

           <div className="h-32 mb-8 w-full max-w-sm px-4 flex items-center justify-center">
              <p className="text-lg text-gray-200 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-2 key={currentStepIndex}">
                 {activeSession.steps[currentStepIndex]}
              </p>
           </div>

           <div className="flex items-center gap-6">
              <button onClick={() => setTimeRemaining(prev => prev + 15)} className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center active:scale-95 transition-transform text-white font-bold text-xs border-2 border-gray-700">
                 +15s
              </button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_8px_0_#94a3b8] active:translate-y-2 active:shadow-none transition-all border-4 border-transparent">
                 {isPlaying ? <Pause className="w-8 h-8 text-brand-dark fill-brand-dark" /> : <Play className="w-8 h-8 text-brand-dark fill-brand-dark ml-1.5" />}
              </button>
              <button onClick={completeSession} className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center active:scale-95 transition-transform text-xs text-white font-bold border-2 border-gray-700">
                 End
              </button>
           </div>
        </div>
      )}

    </div>
  );
}
