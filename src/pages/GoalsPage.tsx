import { useAppContext } from '../store/AppContext';
import { Target, Trophy, Award, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { differenceInDays, differenceInWeeks } from 'date-fns';

const HEALTH_TIMELINE = [
  { hours: 0.33, title: 'Heart rate drops' },
  { hours: 12, title: 'Carbon monoxide drops to normal' },
  { hours: 24, title: 'Heart attack risk begins to drop' },
  { hours: 72, title: 'Nicotine clears your body entirely' },
  { hours: 336, title: 'Lung function improves' }, // 2 weeks
  { hours: 8760, title: 'Heart attack risk halves' }, // 1 year
];

const MILESTONES_CONFIG = [
  { key: '5_resisted', threshold: 5, type: 'action' },
  { key: '10_resisted', threshold: 10, type: 'action' },
  { key: '25_resisted', threshold: 25, type: 'action' },
  { key: '50_resisted', threshold: 50, type: 'action' },
];

export function GoalsPage() {
  const { state } = useAppContext();
  const profile = state.profile;
  if (!profile) return null;

  const now = new Date();
  const quitDate = new Date(profile.quitDate);
  const streakStartDate = profile.lastSmoked ? new Date(profile.lastSmoked) : quitDate;
  
  const streakHours = Math.max(0, (now.getTime() - streakStartDate.getTime()) / 3600000);
  const streakDays = Math.floor(streakHours / 24);
  
  const savedCigarettes = Math.floor(streakDays * profile.cigarettesPerDay);

  const resistedCount = state.cravings.filter(c => c.outcome === 'resisted').length;

  return (
    <div className="p-3 space-y-6 pt-12 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Goals & Milestones</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Your timeline to health.</p>
      </header>

      {/* Health Timeline */}
      <section className="card-duo overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="icon-solid w-8 h-8">
             <TrendingDown className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-gray-800">Health Recovery</h3>
        </div>
        <div className="p-3 space-y-6">
          {HEALTH_TIMELINE.map(item => {
             const isComplete = streakHours >= item.hours;
             return (
              <div key={item.title} className="relative pl-6 border-l-2 border-brand-surface pb-2 ml-[18px]">
                <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-0 border-[3px] border-white shadow-sm base-transition ${isComplete ? 'bg-brand' : 'bg-gray-200'}`}></div>
                <h4 className={`font-bold text-sm ${isComplete ? 'text-gray-800' : 'text-gray-500'}`}>{item.title}</h4>
                <p className={`text-xs mt-1 font-bold ${isComplete ? 'text-brand' : 'text-gray-400'}`}>
                   {isComplete ? "Complete!" : `Requires ${item.hours >= 24 ? Math.round(item.hours/24) + ' days' : item.hours + ' hours'}`}
                </p>
              </div>
             )
          })}
        </div>
      </section>

      {/* Badges / Milestones */}
      <section>
        <h3 className="font-bold text-gray-800 mb-4 ml-1">Your Milestones</h3>
        
        {/* Unlocked */}
        <h4 className="text-[10px] font-bold text-gray-400 tracking-widest mb-3 ml-1">Unlocked</h4>
        <div className="grid grid-cols-2 gap-4 mb-8">
           {state.milestones.length > 0 ? state.milestones.map(m => (
              <div key={m.id} className="card-duo text-center flex flex-col items-center p-4 bg-brand-surface border border-brand/20 shadow-sm">
                 <div className="icon-solid w-12 h-12 mb-3 shadow-sm">
                   <Trophy className="w-6 h-6 text-brand" />
                 </div>
                 <h4 className="font-bold text-sm text-brand-dark">{m.title}</h4>
                 <p className="text-[10px] text-brand font-bold mt-1.5 flex items-center gap-1 justify-center"><CheckCircle className="w-3 h-3"/> Achieved</p>
               </div>
           )) : (
             <div className="col-span-2 text-center text-sm font-bold text-gray-400 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                No milestones yet, keep going!
             </div>
           )}
        </div>

        {/* Upcoming Action Milestones */}
        <h4 className="text-[10px] font-bold text-gray-400 tracking-widest mb-3 ml-1">Upcoming Goals</h4>
        <div className="space-y-4">
           {MILESTONES_CONFIG.filter(config => resistedCount < config.threshold).map(config => {
              const progressPct = Math.min((resistedCount / config.threshold) * 100, 100);
              return (
                 <div key={config.key} className="card-duo p-4">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-800 text-sm">Resist {config.threshold} Cravings</h4>
                        <span className="text-xs font-bold text-gray-500">{resistedCount} / {config.threshold}</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                         <div className="bg-brand-3d h-2.5 rounded-full transition-all duration-500" style={{width: `${progressPct}%`}}></div>
                     </div>
                 </div>
              );
           })}
        </div>
      </section>

      {/* Avoided Cigarettes */}
      <section className="card-duo bg-gray-900 text-white text-center py-8 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <p className="text-gray-400 font-bold text-xs tracking-wider mb-2">Cigarettes Avoided</p>
        <div className="text-6xl font-bold tracking-tight">{Math.max(savedCigarettes, 0)}</div>
      </section>
    </div>
  );
}
