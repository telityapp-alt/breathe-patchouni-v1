import { useEffect, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Flame, Wind, Activity, BrainCircuit, Heart, FileText, ChevronRight, Zap } from 'lucide-react';
import { differenceInDays, differenceInHours, isToday, subDays } from 'date-fns';
import { GoogleGenAI } from '@google/genai';

export function HomePage({ setActiveTab }: { setActiveTab: (t: any) => void }) {
  const { state, addCoachInsight } = useAppContext();
  const profile = state.profile;
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);
  
  useEffect(() => {
    async function generateDailyInsight() {
      if (!profile) return;
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const hasInsightToday = state.coachInsights.some(c => c.type === 'daily_dashboard' && new Date(c.timestamp) >= todayStart);
      
      // Don't generate if we already have one for today
      if (hasInsightToday) return;
      
      setInsightLoading(true);
      setInsightError(false);
      try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const recentCravings = state.cravings.filter(c => new Date(c.timestamp) >= last7Days);
        
        // Calculate Peak Hour
        const hourCounts = recentCravings.reduce((acc, curr) => {
           const hr = new Date(curr.timestamp).getHours();
           acc[hr] = (acc[hr] || 0) + 1;
           return acc;
        }, {} as Record<string, number>);
        
        let peakHourStr = "N/A";
        if (Object.keys(hourCounts).length > 0) {
           const peakHr = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
           peakHourStr = `${peakHr}:00`;
        }

        // Calculate Dominant Trigger
        const triggerCounts = recentCravings.reduce((acc, curr) => {
           acc[curr.trigger_category] = (acc[curr.trigger_category] || 0) + 1;
           return acc;
        }, {} as Record<string, number>);
        
        let dominantTriggerStr = "N/A";
        if (Object.keys(triggerCounts).length > 0) {
           dominantTriggerStr = Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b);
        }

        const statsContext = `Peak Craving Hour: ${peakHourStr}. Dominant Trigger: ${dominantTriggerStr}. Total past 7 days: ${recentCravings.length} cravings.`;
        
        const res = await fetch("/api/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statsContext })
        });
        const data = await res.json();

        if (data.content) {
          await addCoachInsight({
             content: data.content,
             timestamp: new Date().toISOString(),
             isRead: false,
             type: 'daily_dashboard'
          });
        } else {
          setInsightError(true);
        }
      } catch (err) {
        console.error("Failed to generate insight:", err);
        setInsightError(true);
      } finally {
        setInsightLoading(false);
      }
    }
    
    // Slight delay so we don't block render with heavy data process
    const to = setTimeout(generateDailyInsight, 2000);
    return () => clearTimeout(to);
  }, [profile, state.cravings, state.coachInsights, addCoachInsight, process.env.GEMINI_API_KEY]);

  if (!profile) return null;

  const now = new Date();
  
  // Calculate streak based on lastSmoked or quitDate
  const streakStartDate = profile.lastSmoked ? new Date(profile.lastSmoked) : new Date(profile.quitDate);
  const streakDays = differenceInDays(now, streakStartDate);
  const streakHours = differenceInHours(now, streakStartDate) % 24;

  const cravingsToday = state.cravings.filter(c => isToday(new Date(c.timestamp)));
  
  // Inhaler Stats
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const inhalerUsesThisWeek = (state.inhalerLogs || []).filter(l => new Date(l.timestamp) >= last7Days && l.isInhalerAvailable).length;

  // Inhaler Recommendation Logic
  let recommendedVariant = null;
  const logs = state.inhalerLogs || [];
  if (logs.length >= 5) {
     // Find top context
     const ctxCount: Record<string, number> = {};
     logs.forEach(l => {
        l.context.forEach(c => ctxCount[c] = (ctxCount[c] || 0) + 1);
     });
     const sortedCtx = Object.entries(ctxCount).sort((a, b) => b[1] - a[1]);
     const topContext = sortedCtx.length > 0 ? sortedCtx[0][0] : null;

     if (topContext) {
        // Find best variant for this context
        let best = null;
        let maxRed = 0;
        const variants = [
          { id: 'warm-bitter', name: 'Warm-Bitter' },
          { id: 'cool-mint', name: 'Cool-Mint' },
          { id: 'spicy-herbal', name: 'Spicy-Herbal' }
        ];
        variants.forEach(v => {
           const vLogs = logs.filter(l => l.variantUsed === v.id && l.context.includes(topContext) && l.intensityAfter !== null && l.intensityBefore > l.intensityAfter);
           if (vLogs.length > 0) {
              const avg = vLogs.reduce((acc, l) => acc + (l.intensityBefore - (l.intensityAfter!)), 0) / vLogs.length;
              if (avg > maxRed) { maxRed = avg; best = v; }
           }
        });
        if (best) recommendedVariant = { variant: best.name, context: topContext };
     }
  }

  // Calculate dynamic XP
  let methodEngagements = 0;
  if (profile.quitMethod === 'cbt') methodEngagements = state.cbtJournals?.length || 0;
  if (profile.quitMethod === 'act') methodEngagements = state.actUrges?.length || 0;
  if (profile.quitMethod === 'mindfulness') methodEngagements = state.mindfulnessLogs?.length || 0;
  if (profile.quitMethod === 'mi') methodEngagements = state.miReductionLogs?.length || 0;
  if (profile.quitMethod === 'habit') methodEngagements = state.habitLogs?.length || 0;

  const totalResisted = state.cravings.filter(c => c.outcome === 'resisted').length;
  
  const totalXP = (streakDays * 50) + (totalResisted * 20) + (methodEngagements * 15);
  const currentLevel = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  
  const xpIntoLevel = totalXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgressPct = Math.max(0, Math.min(100, (xpIntoLevel / xpNeededForLevel) * 100));
  
  const titleMap: Record<number, string> = {
     1: 'Novice Quitter',
     2: 'Apprentice',
     3: 'Defender',
     4: 'Warrior',
     5: 'Champion',
     6: 'Master Quitter',
     7: 'Grandmaster'
  };
  const userTitle = titleMap[currentLevel] || `Level ${currentLevel} Guardian`;

  // Find latest dashboard insight
  const latestInsight = [...state.coachInsights]
     .filter(c => c.type === 'daily_dashboard')
     .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return (
    <div className="p-3 space-y-6 pt-12 pb-24">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                 Your Journey
              </h1>
           </div>
           <div className="bg-brand-surface border-2 border-brand text-brand font-bold px-3 py-1 rounded-xl shadow-[0_4px_0_var(--color-brand-dark)] flex items-center gap-1 capitalize">
              {profile.dependancyLevel}
           </div>
        </div>
        <div className="card-duo bg-white relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                       <Heart className="w-8 h-8 text-brand" fill="currentColor" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs w-6 h-6 rounded-full border-2 border-yellow-600 flex items-center justify-center font-bold shadow-sm">
                       {currentLevel}
                    </div>
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-bold text-gray-700">{userTitle}</span>
                      <span className="text-xs font-bold text-gray-500">{totalXP} / {xpForNextLevel} XP</span>
                   </div>
                   <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300 relative shadow-inner">
                      <div className="h-full bg-brand border-r-2 border-brand-dark relative" style={{ width: `${xpProgressPct}%` }}>
                         <div className="absolute top-1 left-2 right-2 h-1.5 bg-white/30 rounded-full" />
                      </div>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-400 border-2 border-yellow-600 shadow-[0_4px_0_#ca8a04] flex items-center justify-center text-yellow-900 shrink-0">
                   <Zap className="w-6 h-6" fill="currentColor" />
                </div>
            </div>
            {/* Soft background decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand/10 rounded-full blur-2xl" />
        </div>
      </header>

      {/* Recommended Banner */}
      {recommendedVariant && (
         <section onClick={() => setActiveTab('inhaler')} className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-3 shadow-2xl shadow-gray-900/20 mb-6 cursor-pointer relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-3xl rounded-full group-hover:bg-brand/30 transition-colors"></div>
            <div className="flex items-center gap-2 text-brand-300 font-bold text-[10px] tracking-widest mb-2">
               <BrainCircuit className="w-3 h-3" /> Today's Recommendation
            </div>
            <p className="text-white font-bold text-sm leading-snug">
               For <span className="text-brand-400">"{recommendedVariant.context}"</span> cravings, is your <span className="text-brand-400">{recommendedVariant.variant}</span> ready?
            </p>
         </section>
      )}

      {/* Personalized Method Highlight */}
      <section 
         onClick={() => setActiveTab('method')}
         className="card-duo relative overflow-hidden bg-white border border-gray-100 cursor-pointer hover:border-brand-light transition-all p-3 group"
      >
        <div className="flex items-center gap-4 mb-2">
           <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
             <BrainCircuit className="w-6 h-6 text-brand" />
           </div>
           <div>
             <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 bg-gray-100 mb-1">
               Your Method
             </div>
             <h3 className="font-extrabold text-gray-900 text-lg leading-tight">
               {profile.quitMethod === 'cbt' ? 'Cognitive Behavioral' : 
                profile.quitMethod === 'act' ? 'Acceptance & Commitment' : 
                profile.quitMethod === 'mindfulness' ? 'Mindfulness' : 
                profile.quitMethod === 'mi' ? 'Motivational Interviewing' : 
                profile.quitMethod === 'habit' ? 'Habit Replacement' : 'Cognitive Behavioral'}
             </h3>
           </div>
           <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-brand transition-colors" />
        </div>
        <p className="text-sm font-medium text-gray-500 mt-2">
           Tap to view your personalized dashboard and daily plan.
        </p>
      </section>

      {/* Streak Card */}
      <section className="card-duo relative overflow-hidden bg-brand-3d text-white p-4">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Flame className="w-32 h-32" />
        </div>
        <h3 className="text-white/80 text-sm font-bold tracking-wider mb-3">Smoke-Free Streak</h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl font-bold">{streakDays}</span>
          <span className="text-white/80 font-bold">days</span>
          <span className="text-5xl font-bold ml-2">{streakHours}</span>
          <span className="text-white/80 font-bold">hrs</span>
        </div>
        <p className="text-white/80 text-sm font-bold mt-4">Uang Terselamatkan: <span className="text-white">Rp {(streakDays * profile.cigarettesPerDay * 2500).toLocaleString('id-ID')}</span></p>
      </section>

      {/* Today's Stats */}
      <section className="grid grid-cols-2 gap-4">
        <div className="card-duo p-3">
          <div className="icon-solid w-10 h-10 mb-3">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-gray-500 text-sm font-bold mb-1">Cravings Today</h4>
          <span className="text-3xl font-bold text-gray-800 tracking-tight">{cravingsToday.length}</span>
        </div>
        
        <div className="card-duo p-3">
          <div className="icon-solid w-10 h-10 mb-3">
             <Wind className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-gray-500 text-xs font-bold mb-1 tracking-tight">Inhaler Dipakai</h4>
          <span className="text-3xl font-bold text-gray-800 tracking-tight">{inhalerUsesThisWeek} <span className="text-sm font-medium text-gray-500 lowercase">times this week</span></span>
        </div>
      </section>

      {/* AI Insight */}
      <section className="card-duo relative p-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-solid w-10 h-10">
             <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-gray-800">Daily AI Insight</h3>
        </div>
        
        {insightLoading ? (
            <div className="animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
            </div>
        ) : insightError ? (
            <div className="text-gray-600 text-sm leading-relaxed font-medium">
              <p>
                {streakDays > 0 
                  ? `You are on a solid ${streakDays} days streak! Your resistance is building up steadily. Keep your PATCHWORK close just in case.`
                  : "Every small step counts. Log your cravings today so we can identify your strongest triggers and tackle them."}
              </p>
              <span className="block mt-2 text-[10px] text-gray-400 font-bold tracking-widest">
                *(Local daily insight)*
              </span>
            </div>
        ) : (
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              {latestInsight?.content || "You tend to have higher craving levels after waking up. Keep your inhaler close by tomorrow morning."}
            </p>
        )}
      </section>

      {/* Quick Actions */}
      <section className="space-y-4 pb-8">
        <h3 className="font-bold text-gray-800 px-1 mb-2">Quick Actions</h3>
        <button 
          onClick={() => setActiveTab('log')}
          className="w-full btn-outline justify-start py-4 group hover:border-brand-light transition-colors"
        >
          <div className="icon-solid w-11 h-11 mr-3 group-hover:scale-105 transition-transform duration-300">
             <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1 relative z-10">
             <h4 className="font-bold text-gray-800">Log a Craving</h4>
             <p className="text-xs text-gray-500 font-medium mt-0.5">Record intensity and trigger</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
        </button>

        <button 
          onClick={() => setActiveTab('chat')}
          className="w-full btn-outline justify-start py-4 group hover:border-brand-light transition-colors"
        >
          <div className="icon-solid w-11 h-11 mr-3 group-hover:scale-105 transition-transform duration-300">
             <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1 relative z-10">
             <h4 className="font-bold text-gray-800">Talk to AI Coach</h4>
             <p className="text-xs text-gray-500 font-medium mt-0.5">Get real-time support</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
        </button>
      </section>
    </div>
  );
}
