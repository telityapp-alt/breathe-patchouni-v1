import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine } from 'recharts';
import { format, subDays, differenceInDays } from 'date-fns';
import { BrainCircuit, Activity, Printer, ChevronDown, CheckCircle2, FileText, HeartPulse, Stethoscope, Droplets, Wind, Focus } from 'lucide-react';

export function AnalyticsPage() {
  const { state } = useAppContext();
  const [activeSection, setActiveSection] = useState<'bhi' | 'cravings' | 'inhaler' | 'method' | 'psych' | 'timeline'>('bhi');

  const now = new Date();
  
  // ================= DATA PREPARATION =================

  // 1. CRAVINGS PIPELINE
  const cravings = state.cravings || [];
  const last30Days = Array.from({length: 30}).map((_, i) => subDays(now, 29 - i));
  
  // 30-day Craving Trajectory (Freq & Int)
  const trajectoryData = useMemo(() => {
    return last30Days.map(d => {
      const dayCravings = cravings.filter(c => new Date(c.timestamp).toDateString() === d.toDateString());
      const avgInt = dayCravings.length > 0 ? dayCravings.reduce((acc, c) => acc + c.intensity, 0) / dayCravings.length : 0;
      return {
        date: format(d, 'MMM dd'),
        frequency: dayCravings.length,
        avgIntensity: parseFloat(avgInt.toFixed(1))
      };
    });
  }, [cravings]);

  const withdrawalWarning = useMemo(() => {
    // Check if freq is down but intensity is up in last 7 days vs previous 7 days
    const last7 = trajectoryData.slice(-7);
    const prev7 = trajectoryData.slice(-14, -7);
    const last7Freq = last7.reduce((a, b) => a + b.frequency, 0) / 7;
    const prev7Freq = prev7.reduce((a, b) => a + b.frequency, 0) / 7;
    const last7Int = last7.reduce((a, b) => a + b.avgIntensity, 0) / 7;
    const prev7Int = prev7.reduce((a, b) => a + b.avgIntensity, 0) / 7;
    
    if (last7Freq < prev7Freq && last7Int > prev7Int * 1.1) {
      return true;
    }
    return false;
  }, [trajectoryData]);

  // Resistance Rate 4-Week Trend
  const resistanceWeekData = useMemo(() => {
    return Array.from({length: 4}).map((_, i) => {
      const weekStart = subDays(now, (3 - i) * 7 + 7);
      const weekEnd = subDays(now, (3 - i) * 7);
      const weekCravings = cravings.filter(c => {
         const d = new Date(c.timestamp);
         return d >= weekStart && d < weekEnd;
      });
      const resisted = weekCravings.filter(c => c.outcome === 'resisted').length;
      return {
        week: `W${4 - i}`,
        rate: weekCravings.length > 0 ? Math.round((resisted / weekCravings.length) * 100) : 100 // 100% if no cravings = success
      };
    });
  }, [cravings]);

  // Heatmap Data (28 Days)
  const heatmapData = useMemo(() => {
     const hours = Array.from({length: 24}).map((_, i) => i);
     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
     const last4Weeks = subDays(now, 28);
     
     return days.map((day, dIdx) => {
        return hours.map(hr => {
           const matchingCravings = cravings.filter(c => {
              const d = new Date(c.timestamp);
              return d.getDay() === dIdx && d.getHours() === hr && d >= last4Weeks;
           });
           
           const avgInt = matchingCravings.length > 0 
              ? matchingCravings.reduce((acc, c) => acc + c.intensity, 0) / matchingCravings.length 
              : 0;
           
           const hasFailed = matchingCravings.some(c => c.outcome === 'smoked');
           
           return {
              count: matchingCravings.length,
              avgInt,
              hasFailed
           };
        });
     });
  }, [cravings]);

  // Context Breakdown
  const contextBreakdown = useMemo(() => {
     const ctxCount: Record<string, { total: number, resisted: number }> = {};
     cravings.forEach(c => {
        if (!c.trigger_category) return;
        const ctxList = Array.isArray(c.trigger_category) ? c.trigger_category : [c.trigger_category];
        ctxList.forEach(ctx => {
           if (!ctxCount[ctx]) ctxCount[ctx] = { total: 0, resisted: 0 };
           ctxCount[ctx].total++;
           if (c.outcome === 'resisted') ctxCount[ctx].resisted++;
        });
     });
     return Object.entries(ctxCount).map(([ctx, data]) => ({
        context: ctx,
        rate: Math.round((data.resisted / data.total) * 100),
        total: data.total
     })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [cravings]);

  // Nicotine Dependence Index (NDI)
  const ndiScore = useMemo(() => {
     let score = 0;
     const cigsPerDay = state.miReductionLogs && state.miReductionLogs.length > 0 
        ? state.miReductionLogs[0].cigarettesSmoked 
        : (state.profile?.cigarettesPerDay || 10);
     
     if (cigsPerDay > 20) score += 3;
     else if (cigsPerDay > 10) score += 2;
     else score += 1;

     // Morning intensity vs rest
     const morningCravings = cravings.filter(c => {
        const d = new Date(c.timestamp);
        return d.getHours() >= 5 && d.getHours() <= 9;
     });
     const otherCravings = cravings.filter(c => {
        const d = new Date(c.timestamp);
        return d.getHours() > 9 || d.getHours() < 5;
     });
     
     const mInt = morningCravings.reduce((acc, c) => acc + c.intensity, 0) / (morningCravings.length || 1);
     const oInt = otherCravings.reduce((acc, c) => acc + c.intensity, 0) / (otherCravings.length || 1);
     
     if (mInt > oInt + 1.5) score += 2;
     else if (mInt > oInt) score += 1;

     if (score <= 2) return { level: 'Rendah', score, actionable: 'Dependensi fisikmu rendah. Fokus pada pemicu sosial dan kebiasaan.' };
     if (score <= 4) return { level: 'Sedang', score, actionable: 'Dependensi moderat. Gunakan inhaler selalu di pagi hari.' };
     return { level: 'Tinggi', score, actionable: 'Dependensi fisik kuat terdeteksi. Pertimbangkan NRT dari dokter jika metode behavioral tidak cukup.' };
  }, [cravings, state.miReductionLogs, state.profile]);


  // 2. INHALER PIPELINE
  const inhalerLogs = state.inhalerLogs || [];
  
  const inhalerEffectivenessTrend = useMemo(() => {
    return last30Days.map(d => {
      const logs = inhalerLogs.filter(l => new Date(l.timestamp).toDateString() === d.toDateString() && l.intensityAfter !== null && l.intensityAfter < l.intensityBefore);
      const avg = logs.length > 0 ? logs.reduce((acc, l) => acc + (l.intensityBefore - l.intensityAfter!), 0) / logs.length : 0;
      return {
        date: format(d, 'MMM dd'),
        reduction: parseFloat(avg.toFixed(1))
      };
    });
  }, [inhalerLogs]);

  const inhalerVsNoInhaler = useMemo(() => {
     let withInhaler = 0, withResisted = 0;
     let noInhaler = 0, noResisted = 0;
     // Correlate craving events that happened close to inhaler logs (e.g. same day)
     // Or we can just use inhalerLogs for with/no fallback. Let's use Inhaler logs as proxy for moments of craving
     inhalerLogs.forEach(l => {
        if (l.isInhalerAvailable) {
           withInhaler++;
           if (l.intensityAfter !== null && l.intensityAfter <= 5) withResisted++; 
        } else {
           noInhaler++;
           if (l.intensityAfter !== null && l.intensityAfter <= 5) noResisted++;
        }
     });
     return [
        { name: 'Patchwork Inhaler', rate: withInhaler > 0 ? Math.round((withResisted/withInhaler)*100) : 0 },
        { name: 'Sensory Fallback', rate: noInhaler > 0 ? Math.round((noResisted/noInhaler)*100) : 0 }
     ];
  }, [inhalerLogs]);


  // 3. METHOD PIPELINE
  const currentMethod = state.profile?.quitMethod || 'cbt';
  const methodEngagementScore = useMemo(() => {
    // Count activities in last 7 days
    const weekAgo = subDays(now, 7);
    let count = 0;
    if (currentMethod === 'cbt') count = state.cbtJournals?.filter(x => new Date(x.timestamp) >= weekAgo).length || 0;
    if (currentMethod === 'act') count = state.actUrges?.filter(x => new Date(x.timestamp) >= weekAgo).length || 0;
    if (currentMethod === 'mindfulness') count = state.mindfulnessLogs?.filter(x => new Date(x.timestamp) >= weekAgo).length || 0;
    if (currentMethod === 'mi') count = state.miReductionLogs?.filter(x => new Date(x.date) >= weekAgo).length || 0;
    if (currentMethod === 'habit') count = state.habitLogs?.filter(x => new Date(x.timestamp) >= weekAgo).length || 0;
    return count;
  }, [state, currentMethod]);

  const methodFit = methodEngagementScore >= 3 ? 'Excellent Fit' : (methodEngagementScore >= 1 ? 'Moderate Fit' : 'Poor Fit');

  // 4. BHI (Behavioral Health Index)
  const bhiData = useMemo(() => {
     // Resistance (25%)
     const currentResRate = resistanceWeekData[3].rate;
     const resScore = (currentResRate / 100) * 25;

     const last7Freq = trajectoryData.slice(-7).reduce((a, b) => a + b.frequency, 0);
     const prev7Freq = trajectoryData.slice(-14, -7).reduce((a, b) => a + b.frequency, 0);
     const freqDec = last7Freq <= prev7Freq ? 20 : 0;

     // Engagement (20%)
     const engScore = Math.min((methodEngagementScore / 5) * 20, 20);

     // Inhaler (15%)
     const avgRed = inhalerEffectivenessTrend.reduce((a, b) => a + b.reduction, 0) / (inhalerEffectivenessTrend.filter(x => x.reduction > 0).length || 1);
     const inhScore = Math.min((avgRed / 4) * 15, 15);

     // NDI Improvement (20%)
     const ndiPoints = ndiScore.score <= 2 ? 20 : (ndiScore.score <= 4 ? 10 : 0);

     const total = Math.round(resScore + freqDec + engScore + inhScore + ndiPoints);

     return {
        total,
        category: total >= 76 ? 'Near Freedom' : (total >= 56 ? 'Progres Nyata' : (total >= 31 ? 'Berkembang' : 'Pemula')),
        radar: [
           { subject: 'Resistance', A: Math.round((currentResRate/100)*100), fullMark: 100 },
           { subject: 'Trend', A: freqDec === 20 ? 100 : 50, fullMark: 100 },
           { subject: 'Engagement', A: Math.round((engScore/20)*100), fullMark: 100 },
           { subject: 'Inhaler', A: Math.round((inhScore/15)*100), fullMark: 100 },
           { subject: 'Dependence', A: Math.round((ndiPoints/20)*100), fullMark: 100 },
        ]
     };
  }, [resistanceWeekData, trajectoryData, methodEngagementScore, inhalerEffectivenessTrend, ndiScore]);

  // 5. Psychological Correlates
  const moodCorrelation = useMemo(() => {
     const moodCount: Record<string, { totalInt: number, count: number }> = {};
     cravings.forEach(c => {
        if (!c.mood) return;
        if (!moodCount[c.mood]) moodCount[c.mood] = { totalInt: 0, count: 0 };
        moodCount[c.mood].totalInt += c.intensity;
        moodCount[c.mood].count++;
     });
     return Object.entries(moodCount).map(([mood, d]) => ({
        mood,
        avg: parseFloat((d.totalInt / d.count).toFixed(1))
     })).sort((a,b) => b.avg - a.avg);
  }, [cravings]);

  // 6. Clinical Milestones
  const milestones = [
    { label: 'Blood pressure & pulse return to normal', minutes: 20 },
    { label: 'CO level in blood drops to normal', minutes: 8 * 60 },
    { label: 'Heart attack risk begins to drop', minutes: 24 * 60 },
    { label: 'Nerve endings start to recover', minutes: 48 * 60 },
    { label: 'Circulation & lung function improve', minutes: 14 * 24 * 60 }, // 2 weeks
    { label: 'Coughing & shortness of breath decrease', minutes: 30 * 24 * 60 } // 1 month
  ];

  const timeSinceQuit = state.profile?.quitDate 
     ? differenceInDays(now, new Date(state.profile.quitDate)) * 24 * 60
     : differenceInDays(now, new Date(cravings[0]?.timestamp || now)) * 24 * 60; // fallback


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 pb-24 overflow-y-auto w-full relative">
      <header className="p-3 pt-8 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 print-hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Clinical Analytics <Stethoscope className="w-5 h-5 text-brand" />
          </h1>
          <p className="text-gray-500 font-medium text-sm">Medical-grade behavioral insights.</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200">
           <Printer className="w-4 h-4" /> Print
        </button>
      </header>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto p-4 scrollbar-hide shrink-0 print-hidden">
         {['bhi', 'cravings', 'inhaler', 'method', 'psych', 'timeline'].map(sec => (
            <button 
               key={sec} 
               onClick={() => setActiveSection(sec as any)}
               className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeSection === sec ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
               {sec.toUpperCase()}
            </button>
         ))}
      </div>

      <div className="p-3 space-y-6 print-hidden">
         {/* SECTION: INTEGRATED BHI */}
         {(activeSection === 'bhi' || true) && (
            <section className={`card-duo p-4 bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-700 shadow-xl print-only-block ${activeSection !== 'bhi' ? 'hidden print:block' : ''}`}>
               <div className="text-center mb-6">
                  <h3 className="text-indigo-200 font-bold text-xs tracking-widest mb-1">Behavioral Health Index (BHI)</h3>
                  <div className="text-6xl font-bold text-white">{bhiData.total}</div>
                  <div className="inline-block mt-2 bg-indigo-500/30 px-3 py-1 rounded-full text-indigo-100 font-bold text-sm border border-indigo-400/50">
                     Status: {bhiData.category}
                  </div>
               </div>

               <div className="h-64 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={bhiData.radar}>
                     <PolarGrid stroke="#6366f1" />
                     <PolarAngleAxis dataKey="subject" tick={{fill: '#e0e7ff', fontSize: 10, fontWeight: 'bold'}} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="User" dataKey="A" stroke="#22c55e" strokeWidth={3} fill="#22c55e" fillOpacity={0.4} />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
               
               <p className="text-sm font-medium text-indigo-200 text-center mt-4">
                  BHI is a clinical composite that measures the effectiveness of your interventions across 5 pillars of behavioral rehabilitation.
               </p>
            </section>
         )}

         {/* SECTION: CRAVINGS ANALYTICS */}
         {(activeSection === 'cravings' || true) && (
            <div className={`space-y-6 print-only-block ${activeSection !== 'cravings' ? 'hidden print:block' : ''}`}>
               <div className="card-duo">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                     Craving Trajectory (30D)
                     <Activity className="w-5 h-5 text-gray-400" />
                  </h3>
                  {withdrawalWarning && (
                     <div className="mb-4 bg-brand-surface border border-brand/30 p-3 rounded-xl">
                        <h4 className="text-brand-dark font-bold text-xs mb-1">Clinical Warning: Withdrawal Intensification</h4>
                        <p className="text-brand-dark text-sm font-medium">Your craving frequency is decreasing, but the average intensity is rising. This is a normal biological response at this phase. Ensure PATCHWORK is always ready.</p>
                     </div>
                  )}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trajectoryData}>
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{borderRadius: '12px', fontSize: '12px'}} />
                        <Line yAxisId="left" type="monotone" dataKey="frequency" stroke="#3b82f6" strokeWidth={3} dot={false} name="Frequency" />
                        <Line yAxisId="right" type="monotone" dataKey="avgIntensity" stroke="#f43f5e" strokeWidth={3} dot={false} name="Avg Intensity" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="card-duo">
                     <h3 className="font-bold text-gray-800 text-sm mb-3">Resistance Trend</h3>
                     <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={resistanceWeekData}>
                              <XAxis dataKey="week" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{borderRadius: '8px', fontSize: '10px'}} />
                              <Bar dataKey="rate" fill="#10b981" radius={[4,4,0,0]} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  
                  <div className="card-duo">
                     <h3 className="font-bold text-gray-800 text-sm mb-2">NDI Estimation</h3>
                     <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-bold text-brand">{ndiScore.score}</span>
                        <span className="text-sm font-bold text-gray-500 mb-1">/ 6 pts</span>
                     </div>
                     <span className="inline-block mt-1 bg-brand-surface text-brand-dark font-bold text-[10px] px-2 py-0.5 rounded-sm border border-brand/20">
                        Level: {ndiScore.level}
                     </span>
                     <p className="text-[10px] font-medium text-gray-500 mt-2 leading-tight">{ndiScore.actionable}</p>
                  </div>
               </div>

               <div className="card-duo">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">Resistance Rate By Context</h3>
                  <div className="space-y-4">
                     {contextBreakdown.map(ctx => (
                        <div key={ctx.context}>
                           <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-gray-700">{ctx.context} ({ctx.total}x)</span>
                              <span className={ctx.rate >= 50 ? 'text-brand' : 'text-brand'}>{ctx.rate}% Resist</span>
                           </div>
                           <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={ctx.rate >= 50 ? 'bg-brand-light' : 'bg-brand-light'} style={{height: '100%', width: `${ctx.rate}%`}}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="card-duo">
                  <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center justify-between">
                     Intensity & Outcome Heatmap
                     <div className="flex gap-2">
                         <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-brand bg-white shadow-sm"></div> Slip-up</span>
                     </div>
                  </h3>
                  <div className="flex">
                     <div className="flex flex-col gap-[2px] pr-2 justify-between py-1 text-[9px] font-bold text-gray-400">
                        {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
                     </div>
                     <div className="flex-1 flex flex-col gap-[2px]">
                        {heatmapData.map((dayData, i) => (
                           <div key={i} className="flex gap-[2px]">
                              {dayData.map((data, j) => (
                                 <div key={j} className={`h-5 flex-1 rounded-sm border relative ${data.count === 0 ? 'bg-gray-50 border-transparent' : data.avgInt > 7 ? 'bg-brand border-brand-dark' : data.avgInt > 4 ? 'bg-brand-light border-brand' : 'bg-brand border-brand-dark'}`}>
                                     {data.hasFailed && <div className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full ring-1 ring-black/20"></div>}
                                 </div>
                              ))}
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 px-4">
                     <span>12AM</span>
                     <span>12PM</span>
                     <span>11PM</span>
                  </div>
               </div>
            </div>
         )}

         {/* SECTION: INHALER ANALYTICS */}
         {(activeSection === 'inhaler' || true) && (
            <div className={`space-y-6 print-only-block ${activeSection !== 'inhaler' ? 'hidden print:block' : ''}`}>
               <div className="card-duo">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                     Patchwork Effectiveness <Wind className="w-5 h-5 text-gray-400" />
                  </h3>
                  <p className="text-xs font-medium text-gray-500 mb-4">Average point reduction after using inhaler over 30 days.</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={inhalerEffectivenessTrend}>
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{borderRadius: '12px', fontSize: '12px'}} />
                        <Line type="monotone" dataKey="reduction" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               
               <div className="card-duo bg-sky-50 border-sky-100">
                  <h3 className="font-bold text-sky-900 mb-4 text-sm">Quasi-Experimental Impact</h3>
                  <p className="text-xs font-medium text-sky-700 mb-4">Perbandingan rasio sukses menahan craving dengan vs tanpa inhaler.</p>
                  <div className="h-32 mb-2">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inhalerVsNoInhaler} layout="vertical">
                           <XAxis type="number" domain={[0, 100]} hide />
                           <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#0c4a6e', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                           <Tooltip contentStyle={{borderRadius: '8px', fontSize: '10px'}} formatter={(value) => `${value}% Success`} />
                           <Bar dataKey="rate" fill="#0ea5e9" radius={[0,4,4,0]} barSize={24} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="card-duo border-gray-200 bg-white">
                  <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center justify-between">
                     Keampuhan Inhaler Rata-rata
                  </h3>
                  <p className="text-xs font-medium text-gray-500 mb-3">Penurunan intensitas rata-rata setelah menggunakan PATCHWORK.</p>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <span className="text-4xl font-bold text-brand tracking-tighter">
                        {inhalerLogs.filter(l => l.intensityAfter !== null && l.intensityAfter < l.intensityBefore).length > 0 
                           ? (inhalerLogs.filter(l => l.intensityAfter !== null && l.intensityAfter < l.intensityBefore).reduce((acc, l) => acc + (l.intensityBefore - l.intensityAfter!), 0) / inhalerLogs.filter(l => l.intensityAfter !== null && l.intensityAfter < l.intensityBefore).length).toFixed(1)
                           : "0"}
                     </span>
                     <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">Poin Penurunan</span>
                        <span className="text-[10px] font-bold tracking-widest text-gray-400">Rata-rata intensitas craving drop</span>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* SECTION: METHOD ANALYTICS */}
         {(activeSection === 'method' || true) && (
            <div className={`space-y-6 print-only-block ${activeSection !== 'method' ? 'hidden print:block' : ''}`}>
               <div className="card-duo flex items-center justify-between">
                  <div>
                     <h3 className="text-xs font-bold text-gray-400 tracking-wider">Method Fit Score</h3>
                     <h4 className="text-lg font-bold text-gray-800 mt-1 capitalize">{currentMethod} Method</h4>
                  </div>
                  <div className="text-right">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${methodEngagementScore >= 3 ? 'bg-brand/10 text-brand-dark' : 'bg-gray-100 text-gray-600'}`}>
                        {methodFit}
                     </span>
                  </div>
               </div>
               
               <div className="card-duo">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Engagement Correlation</h3>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed mb-4">
                     In the week you actively performed method activities (engagement score: {methodEngagementScore}), your resistance rate was recorded at <strong>{resistanceWeekData[3].rate}%</strong>. Behavioral memory consolidation appears to be taking place.
                  </p>
                  {methodEngagementScore < 3 && (
                     <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs font-medium text-gray-600 italic">
                        Try experimenting with other methods (like Habit Replacement or ACT) if you feel the current method isn't reducing cravings.
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* SECTION: PSYCH */}
         {(activeSection === 'psych' || true) && (
            <div className={`space-y-6 print-only-block ${activeSection !== 'psych' ? 'hidden print:block' : ''}`}>
               <div className="card-duo">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                     Mood-Craving Regression <BrainCircuit className="w-5 h-5 text-gray-400" />
                  </h3>
                  {moodCorrelation.length >= 2 && (
                     <div className="mb-4 bg-brand-50 text-brand-800 p-3 rounded-xl text-sm font-medium italic">
                        "Your cravings are on average {(moodCorrelation[0].avg - moodCorrelation[moodCorrelation.length-1].avg).toFixed(1)} points higher when you feel '{moodCorrelation[0].mood}' compared to when you feel '{moodCorrelation[moodCorrelation.length-1].mood}'."
                     </div>
                  )}
                  <div className="space-y-3">
                     {moodCorrelation.map(({mood, avg}) => (
                        <div key={mood} className="flex justify-between items-center text-sm font-bold">
                           <span className="text-gray-700 capitalize">{mood}</span>
                           <span className={`px-2 py-0.5 rounded-md ${avg >= 7 ? 'bg-brand/10 text-brand-dark' : avg >= 5 ? 'bg-brand/10 text-brand-dark' : 'bg-green-100 text-green-700'}`}>{avg} Avg. Intensity</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="card-duo">
                  <h3 className="font-bold text-gray-800 mb-2 text-sm">Psychological Resilience Tracker</h3>
                  <p className="text-xs font-medium text-gray-500 mb-4">How often you faced very high-intensity cravings (score &gt; 7) and successfully resisted smoking.</p>
                  
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center">
                        <span className="text-xl font-bold text-indigo-600">{cravings.filter(c => c.intensity > 7 && c.outcome === 'resisted').length}</span>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800 leading-tight">High-Stress Resisted Events</h4>
                        <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-0.5">Sepanjang Waktu</p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* SECTION: TIMELINE */}
         {(activeSection === 'timeline' || true) && (
            <div className={`space-y-6 print-only-block ${activeSection !== 'timeline' ? 'hidden print:block' : ''}`}>
               <div className="card-duo">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                     Clinical Milestones <HeartPulse className="w-5 h-5 text-brand" />
                  </h3>
                  <div className="relative pl-6 border-l-2 border-gray-100 space-y-6 my-2">
                     {milestones.map((ms, i) => {
                        const isCompleted = timeSinceQuit >= ms.minutes;
                        return (
                           <div key={i} className="relative">
                              <div className={`absolute -left-[31px] w-5 h-5 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'bg-brand border-brand text-white' : 'bg-white border-gray-300'}`}>
                                 {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <h4 className={`text-sm font-bold ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>{ms.label}</h4>
                              <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-0.5">
                                 {ms.minutes >= 24 * 60 ? `${(ms.minutes / (24*60)).toFixed(0)} Days` : `${ms.minutes / 60} Hours`}
                              </p>
                           </div>
                        )
                     })}
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* FOOTER DOCTOR REPORT DISCLAIMER (ONLY VISIBLE IN PRINT) */}
      <div className="hidden print:block p-8 bg-white text-black font-sans w-full max-w-4xl mx-auto">
         <div className="border-b-2 border-black pb-4 mb-6">
            <h1 className="text-3xl font-bold tracking-wider">BEHAVIORAL HEALTH REPORT</h1>
            <p className="text-sm mt-1">Generated by Breathe AI by Patchouni x PATCHWORK system - Patient Copy</p>
         </div>

         <div className="mb-6">
            <h2 className="text-xl font-bold border-b border-gray-300 mb-2 pb-1">Patient Status & Indices</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
               <div><strong>Monitoring Date:</strong> {new Date().toLocaleDateString()}</div>
               <div><strong>Days Since Quit:</strong> {timeSinceQuit > 0 ? (timeSinceQuit / (24*60)).toFixed(0) : 0} days</div>
               <div><strong>BHI Score (0-100):</strong> {bhiData.total} - {bhiData.category}</div>
               <div><strong>NDI Score (0-6):</strong> {ndiScore.score} - {ndiScore.level}</div>
            </div>
         </div>

         <div className="mb-6">
            <h2 className="text-xl font-bold border-b border-gray-300 mb-2 pb-1">Craving Analytics (Last 30 Days)</h2>
            <div className="text-sm space-y-2">
               <p><strong>Total Craving Events:</strong> {trajectoryData.reduce((a, b) => a + b.frequency, 0)}</p>
               <p><strong>Average Intensity:</strong> {(trajectoryData.reduce((a, b) => a + b.avgIntensity, 0) / trajectoryData.length).toFixed(1)} / 10</p>
               <p><strong>Overall Resistance Rate (Week 4):</strong> {resistanceWeekData[3].rate}%</p>
               <p><strong>High-Stress Resisted Events (&gt;7 intensity):</strong> {cravings.filter(c => c.intensity > 7 && c.outcome === 'resisted').length}</p>
            </div>
         </div>

         <div className="mb-6">
            <h2 className="text-xl font-bold border-b border-gray-300 mb-2 pb-1">Primary Triggers Identified</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
               {contextBreakdown.map(ctx => (
                  <li key={ctx.context}>
                     <strong>{ctx.context}</strong> ({ctx.total} events) - Resistance Rate: {ctx.rate}%
                  </li>
               ))}
            </ul>
         </div>

         <div className="mb-6">
            <h2 className="text-xl font-bold border-b border-gray-300 mb-2 pb-1">Intervention Effectiveness</h2>
            <div className="text-sm space-y-2 mt-2">
               <p><strong>Primary Method:</strong> {currentMethod.toUpperCase()}</p>
               <p><strong>Method Engagement Level:</strong> {methodFit}</p>
               <p><strong>Sensory Intervention:</strong> PATCHWORK Inhaler</p>
               <p><strong>Impact vs Fallback:</strong> {inhalerVsNoInhaler[0].rate}% (With Inhaler) vs {inhalerVsNoInhaler[1].rate}% (Without)</p>
               <p><strong>Psychological Correlation:</strong> Craving average varies by mood, with highest at '{moodCorrelation[0]?.mood || 'N/A'}'.</p>
            </div>
         </div>

         <div className="mt-12 pt-4 border-t border-gray-200">
            <p className="text-[10px] text-gray-500 leading-relaxed text-justify">
               Disclaimer: This data is self-reported behavioral data collected longitudinally via the digital intervention of Breathe AI by Patchouni and the PATCHWORK Inhaler. The BHI (Behavioral Health Index) and NDI scores are calculated based on adapted metrics from clinical instruments, but this is not a formal medical diagnosis. This report is intended to be used as discussion material between the patient and a healthcare professional (Doctor/Counselor).
            </p>
         </div>
      </div>

    </div>
  );
}
