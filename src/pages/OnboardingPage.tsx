import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { DependancyLevel } from '../types';
import { ArrowRight, Activity, Clock, ShieldCheck, HeartPulse } from 'lucide-react';
import { cn } from '../lib/utils';

export function OnboardingPage() {
  const { updateProfile } = useAppContext();
  const [step, setStep] = useState(0);

  // Form State
  const [cigsPerDay, setCigsPerDay] = useState(15);
  const [yearsSmoking, setYearsSmoking] = useState(5);
  const [usualBrand, setUsualBrand] = useState('');
  
  // FTND specfic
  const [timeToFirst, setTimeToFirst] = useState<'<5' | '6-30' | '31-60' | '>60'>('31-60');
  const [difficultForbidden, setDifficultForbidden] = useState<boolean>(false);
  const [hateToGiveUp, setHateToGiveUp] = useState<'first' | 'other'>('first');
  const [moreInMorning, setMoreInMorning] = useState<boolean>(false);
  const [smokeWhenIll, setSmokeWhenIll] = useState<boolean>(false);

  // Qualitative
  const [triggers, setTriggers] = useState<string[]>([]);
  const [quitReason, setQuitReason] = useState<string>('');

  const triggerOptions = ['Stressed', 'After Meal', 'Waking Up', 'Socializing', 'Drinking Coffee', 'Boredom', 'Working'];
  const reasonOptions = ['Health & Fitness', 'Family & Loved Ones', 'Financial Savings', 'Appearance', 'Taking Control'];

  // Method Matching
  const [methodReason, setMethodReason] = useState<string>('');
  const [methodApproach, setMethodApproach] = useState<string>('');
  const [methodAnxiety, setMethodAnxiety] = useState<string>('');

  const handleComplete = () => {
    // Calculate FTND Score
    let score = 0;
    
    // Time to first
    if (timeToFirst === '<5') score += 3;
    else if (timeToFirst === '6-30') score += 2;
    else if (timeToFirst === '31-60') score += 1;
    
    // Difficult forbidden
    if (difficultForbidden) score += 1;
    
    // Hate to give up
    if (hateToGiveUp === 'first') score += 1;
    
    // Cigs per day
    if (cigsPerDay >= 31) score += 3;
    else if (cigsPerDay >= 21) score += 2;
    else if (cigsPerDay >= 11) score += 1;
    
    // Morning smoke
    if (moreInMorning) score += 1;
    
    // Smoke when ill
    if (smokeWhenIll) score += 1;

    let dependancyLevel: DependancyLevel = 'low';
    let programWeeks = 2;
    let quitPlanMode: 'gradual' | 'cold-turkey' = 'cold-turkey';

    if (score >= 7) {
      dependancyLevel = 'high';
      programWeeks = 8;
      quitPlanMode = 'gradual';
    } else if (score >= 4) {
      dependancyLevel = 'medium';
      programWeeks = 4;
      quitPlanMode = 'gradual';
    }

    // Method Matching Logic
    let scores = { cbt: 0, act: 0, mindfulness: 0, mi: 0, habit: 0 };
    if (methodReason === 'stress') { scores.cbt += 2; scores.act += 1; }
    if (methodReason === 'boredom') { scores.habit += 2; }
    if (methodReason === 'unconscious') { scores.mindfulness += 2; scores.habit += 1; }

    if (methodApproach === 'gradual') { scores.mi += 3; scores.habit += 1; }
    if (methodApproach === 'cold') { scores.cbt += 1; scores.act += 1; }

    if (methodAnxiety === 'overthink') { scores.act += 3; scores.cbt += 1; }
    if (methodAnxiety === 'action') { scores.habit += 2; scores.mindfulness += 1; }
    if (methodAnxiety === 'logical') { scores.cbt += 2; scores.mi += 1; }

    const orderedMethods = Object.keys(scores).sort((a, b) => scores[b as keyof typeof scores] - scores[a as keyof typeof scores]);
    const matchedMethod = (orderedMethods[0] || 'cbt') as any;

    updateProfile({
      cigarettesPerDay: cigsPerDay,
      yearsSmoking,
      brandStrength: usualBrand as any,
      difficultForbidden,
      timeToFirstSmoke: timeToFirst as any,
      primaryTriggers: triggers,
      mainQuitReason: [quitReason],
      ftndScore: score,
      dependancyLevel,
      programWeeks,
      quitPlanMode,
      quitMethod: matchedMethod,
      quitDate: new Date().toISOString(),
      isOnboarded: true
    }).catch(err => console.error("Update profile failed:", err));
  };

  const toggleTrigger = (t: string) => {
    if (triggers.includes(t)) {
      setTriggers(triggers.filter(x => x !== t));
    } else {
      setTriggers([...triggers, t]);
    }
  };

  return (
    <div className="w-full h-[100dvh] max-w-md mx-auto bg-white flex flex-col relative sm:border-x border-gray-200">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5 pt-16">
        {step === 0 && (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
            <div className="icon-solid w-24 h-24 mb-4">
              <HeartPulse className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Breathe AI <span className="text-sm font-normal text-gray-500">by Patchouni</span></h1>
            <p className="text-gray-500 font-medium px-4">Your personalized AI companion to help you quit smoking for good.</p>
            <div className="pt-8 w-full mt-auto mb-8">
              <button 
                onClick={() => setStep(1)}
                className="w-full btn-primary"
              >
                Start Assessment
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">First, tell us about your habits.</h2>
            
            <div className="space-y-6 flex-1">
              <div className="card-duo space-y-3">
                <label className="block text-base font-bold text-gray-700">How many cigarettes do you smoke per day?</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="1" max="60" value={cigsPerDay} 
                    onChange={e => setCigsPerDay(Number(e.target.value))}
                    className="flex-1 accent-brand"
                  />
                  <span className="w-12 text-center font-bold text-xl text-brand">{cigsPerDay}</span>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block text-base font-bold text-gray-700">How many years have you been smoking?</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="1" max="50" value={yearsSmoking} 
                    onChange={e => setYearsSmoking(Number(e.target.value))}
                    className="flex-1 accent-brand"
                  />
                  <span className="w-12 text-center font-bold text-xl text-brand">{yearsSmoking}</span>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block text-base font-bold text-gray-700">After waking up, when do you smoke?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{l: 'Within 5 min', v: '<5'}, {l: '6 - 30 min', v: '6-30'}, {l: '31 - 60 min', v: '31-60'}, {l: 'After 60 min', v: '>60'}].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setTimeToFirst(opt.v as any)}
                      className={timeToFirst === opt.v ? "btn-outline btn-outline-active" : "btn-outline"}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
                onClick={() => setStep(2)}
                className="w-full btn-primary"
              >
                Next <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">Understanding your dependence.</h2>
            
            <div className="space-y-4 flex-1">
              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">Difficult to refrain where forbidden?</label>
                <div className="flex gap-2">
                  <button onClick={() => setDifficultForbidden(true)} className={difficultForbidden ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>Yes</button>
                  <button onClick={() => setDifficultForbidden(false)} className={!difficultForbidden ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>No</button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">Which is hardest to give up?</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setHateToGiveUp('first')} className={hateToGiveUp === 'first' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>The first one in morning</button>
                  <button onClick={() => setHateToGiveUp('other')} className={hateToGiveUp === 'other' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>Any other</button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">Smoke more in the morning?</label>
                <div className="flex gap-2">
                  <button onClick={() => setMoreInMorning(true)} className={moreInMorning ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>Yes</button>
                  <button onClick={() => setMoreInMorning(false)} className={!moreInMorning ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>No</button>
                </div>
              </div>
              
              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">Smoke even when ill in bed?</label>
                <div className="flex gap-2">
                  <button onClick={() => setSmokeWhenIll(true)} className={smokeWhenIll ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>Yes</button>
                  <button onClick={() => setSmokeWhenIll(false)} className={!smokeWhenIll ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>No</button>
                </div>
              </div>
            </div>

            <button 
                onClick={() => setStep(3)}
                className="w-full btn-primary"
              >
                Next <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">Finding your quit method.</h2>
            
            <div className="space-y-4 flex-1">
              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">When do you usually smoke?</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setMethodReason('stress')} className={methodReason === 'stress' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>To manage stress or emotions</button>
                  <button onClick={() => setMethodReason('boredom')} className={methodReason === 'boredom' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>Out of boredom or habit</button>
                  <button onClick={() => setMethodReason('unconscious')} className={methodReason === 'unconscious' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>Automatically, without thinking</button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">How do you prefer to tackle big goals?</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setMethodApproach('gradual')} className={methodApproach === 'gradual' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>Gradually, step-by-step</button>
                  <button onClick={() => setMethodApproach('cold')} className={methodApproach === 'cold' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>All at once (cold turkey)</button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">When you're anxious, what happens?</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setMethodAnxiety('overthink')} className={methodAnxiety === 'overthink' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>I overthink and get stuck in my head</button>
                  <button onClick={() => setMethodAnxiety('action')} className={methodAnxiety === 'action' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>I need to do something physical</button>
                  <button onClick={() => setMethodAnxiety('logical')} className={methodAnxiety === 'logical' ? "btn-outline justify-start btn-outline-active" : "btn-outline justify-start"}>I try to rationalize it</button>
                </div>
              </div>
            </div>

            <button 
                disabled={!methodReason || !methodApproach || !methodAnxiety}
                onClick={() => setStep(4)}
                className={cn("w-full btn-primary", (!methodReason || !methodApproach || !methodAnxiety) ? "opacity-50" : "")}
              >
                Next <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">Finalizing your journey.</h2>
            
            <div className="space-y-6 flex-1">
              <div className="card-duo">
                <label className="block font-bold text-gray-700 mb-3">Primary triggers (select all)</label>
                <div className="flex flex-wrap gap-2">
                  {triggerOptions.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleTrigger(t)}
                      className={triggers.includes(t) ? "btn-outline btn-outline-active py-2 px-3 text-sm h-auto" : "btn-outline py-2 px-3 text-sm h-auto"}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-duo">
                <label className="block font-bold text-gray-700 mb-3">Main reason to quit</label>
                <div className="flex flex-col gap-2">
                  {reasonOptions.map(r => (
                    <button
                      key={r}
                      onClick={() => setQuitReason(r)}
                      className={quitReason === r ? "btn-outline justify-start btn-outline-active h-auto py-3" : "btn-outline justify-start h-auto py-3"}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
                disabled={!quitReason || triggers.length === 0}
                onClick={handleComplete}
                className={cn("w-full btn-primary", (!quitReason || triggers.length === 0) ? "opacity-50" : "")}
              >
                Complete Setup <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {step > 0 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center py-2 px-4 shadow-sm z-10 bg-white/80 backdrop-blur-sm">
           <div className="w-full flex gap-2 h-2.5 rounded-full">
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300 w-full")}></div>
             </div>
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300", step >= 2 ? "w-full" : "w-0")}></div>
             </div>
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300", step >= 3 ? "w-full" : "w-0")}></div>
             </div>
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300", step >= 4 ? "w-full" : "w-0")}></div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
