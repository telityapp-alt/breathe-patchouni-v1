import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { CravingContext, Mood } from '../types';
import { CheckCircle2, Wind, Search, Trophy, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';
import { Milestone } from '../lib/db';

export function LogPage({ setActiveTab }: { setActiveTab: (t: any) => void }) {
  const { addCraving } = useAppContext();
  
  const [intensity, setIntensity] = useState(5);
  const [context, setContext] = useState<CravingContext | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [resisted, setResisted] = useState(true);
  const [inhalerUsed, setInhalerUsed] = useState(true);
  const [showMilestone, setShowMilestone] = useState<Milestone | null>(null);

  const contexts: {id: CravingContext, label: string}[] = [
    {id: 'waking_up', label: 'Waking Up'},
    {id: 'after_meal', label: 'After Meal'},
    {id: 'stressed', label: 'Stressed'},
    {id: 'bored', label: 'Bored'},
    {id: 'social', label: 'Socializing'},
    {id: 'working', label: 'Working'},
    {id: 'drinking_coffee', label: 'Drinking Coffee'},
    {id: 'other', label: 'Other'},
  ];

  const moods: {id: Mood, label: string, emoji: string}[] = [
    {id: 'happy', label: 'Happy', emoji: '😊'},
    {id: 'stressed', label: 'Stressed', emoji: '😫'},
    {id: 'anxious', label: 'Anxious', emoji: '😰'},
    {id: 'bored', label: 'Bored', emoji: '😐'},
    {id: 'sad', label: 'Sad', emoji: '😔'},
  ];

  const handleSave = async () => {
    if (!context || !mood) return;

    const timestamp = new Date().toISOString();

    try {
      const milestone = await addCraving({
        timestamp,
        intensity,
        trigger_category: context,
        mood,
        outcome: resisted ? 'resisted' : 'smoked',
        inhaler_used: inhalerUsed,
      });

      if (milestone) {
        setShowMilestone(milestone);
        setTimeout(() => {
          setShowMilestone(null);
          setActiveTab('home');
        }, 4000); // 4 seconds animation delay
      } else {
        setActiveTab('home');
      }
    } catch (err: any) {
      console.error("Failed to add craving:", err);
      // Fallback
      setActiveTab('home');
    }
  };

  if (showMilestone) {
     return (
       <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-green-50 animate-in zoom-in spin-in-12">
          <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white">
             <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Milestone Unlocked!</h2>
          <h3 className="text-xl font-bold text-brand mb-4">{showMilestone.title}</h3>
          <p className="text-gray-600 font-medium">{showMilestone.description}</p>
       </div>
     );
  }

  return (
    <div className="p-3 space-y-6 pt-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">Log a Craving</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">Understanding your patterns helps the AI coach you better.</p>
      </header>

      {/* Intensity */}
      <section className="card-duo p-3">
        <label className="block text-sm font-bold text-gray-800 mb-4">Craving Intensity</label>
        <div className="flex items-center gap-4">
          <input 
            type="range" min="1" max="10" 
            value={intensity} 
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <div className={cn(
             "w-12 h-12 flex items-center justify-center rounded-[1rem] font-bold text-xl text-white shadow-sm border-b-[3px]",
             intensity < 4 ? "bg-brand border-brand-dark" : intensity < 8 ? "bg-brand border-brand-dark" : "bg-red-500 border-red-600"
          )}>
            {intensity}
          </div>
        </div>
      </section>

      {/* Context / Trigger */}
      <section>
        <label className="block text-sm font-bold text-gray-800 mb-3 ml-1">What triggered this?</label>
        <div className="flex flex-wrap gap-2">
          {contexts.map(c => (
            <button
              key={c.id}
              onClick={() => setContext(c.id)}
              className={context === c.id ? "btn-outline btn-outline-active py-2 px-4 h-auto" : "btn-outline py-2 px-4 h-auto"}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Mood */}
      <section>
        <label className="block text-sm font-bold text-gray-800 mb-3 ml-1">How are you feeling?</label>
        <div className="grid grid-cols-5 gap-2">
          {moods.map(m => (
            <button
               key={m.id}
               onClick={() => setMood(m.id)}
               className={m.id === mood ? "btn-outline btn-outline-active flex-col py-3 px-1 h-auto gap-0" : "btn-outline flex-col py-3 px-1 h-auto gap-0"}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-[10px] font-bold">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="card-duo py-3 px-4 divide-y divide-gray-100 mb-2">
        <label className="flex items-center justify-between py-3 cursor-pointer">
           <div>
             <span className="block font-bold text-gray-800 text-sm">Did you resist?</span>
             <span className="text-xs text-gray-500 font-medium">I did not smoke a cigarette</span>
           </div>
           <input 
             type="checkbox" 
             checked={resisted} 
             onChange={(e) => setResisted(e.target.checked)}
             className="w-6 h-6 accent-brand rounded cursor-pointer"
           />
        </label>
        <label className="flex items-center justify-between py-3 cursor-pointer">
           <div>
             <span className="block font-bold text-gray-800 text-sm">Used Breathe AI Inhaler by Patchouni?</span>
             <span className="text-xs text-gray-500 font-medium">Auto-recorded if connected</span>
           </div>
           <input 
             type="checkbox" 
             checked={inhalerUsed} 
             onChange={(e) => setInhalerUsed(e.target.checked)}
             className="w-6 h-6 accent-brand rounded cursor-pointer"
           />
        </label>
      </section>

      {!inhalerUsed && (
         <button onClick={() => setActiveTab('shop')} className="w-full bg-gradient-to-r from-brand to-brand-light text-white p-3 rounded-xl flex items-center justify-between shadow-[0_4px_0_var(--color-brand-dark)] active:translate-y-1 active:shadow-none transition-all">
            <div className="text-left">
              <p className="text-xs font-bold tracking-wider text-white/80">Need physical relief?</p>
              <p className="text-sm font-bold">Get a Breathe AI Smart Inhaler by Patchouni</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
               <ShoppingCart className="w-4 h-4 text-white" />
            </div>
         </button>
      )}

      <div className="pt-4 pb-8">
        <button 
          disabled={!context || !mood}
          onClick={handleSave}
          className={cn("w-full btn-primary !h-auto !py-4", (!context || !mood) && "opacity-50 grayscale cursor-not-allowed")}
        >
          <div className="icon-solid w-6 h-6 mr-1 shadow-none">
             <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          Save Log
        </button>
      </div>
    </div>
  );
}
