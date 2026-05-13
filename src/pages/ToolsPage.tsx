import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calculator, Waves, Wind, Play, HelpCircle, Activity, ChevronRight, Pause, Heart, ThumbsUp } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';
import { differenceInDays, differenceInYears } from 'date-fns';

type SubPage = 'list' | 'calculator' | 'surfer' | 'lung_age';

export function ToolsPage({ setActiveTab }: { setActiveTab: (tab: any) => void }) {
  const [activeSubPage, setActiveSubPage] = useState<SubPage>('list');

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {activeSubPage === 'list' && <ToolsList setPage={setActiveSubPage} />}
      {activeSubPage === 'calculator' && <RokokCalculator setPage={setActiveSubPage} setActiveTab={setActiveTab} />}
      {activeSubPage === 'surfer' && <CravingSurfer setPage={setActiveSubPage} />}
      {activeSubPage === 'lung_age' && <LungAgeTest setPage={setActiveSubPage} setActiveTab={setActiveTab} />}
    </div>
  );
}

function ToolsList({ setPage }: { setPage: (page: SubPage) => void }) {
  const tools = [
    {
      id: 'calculator',
      title: 'Rokok Calculator',
      description: 'What Did You Burn Today? Calculate the real cost of your cigarettes.',
      icon: Calculator,
      color: 'bg-brand-surface text-brand-dark border-brand/30'
    },
    {
      id: 'surfer',
      title: 'Craving Surfer',
      description: 'Hold For 3 Minutes, Win A Round. Craving distraction game.',
      icon: Waves,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200'
    },
    {
      id: 'lung_age',
      title: 'Lung Age Test',
      description: 'Paru-Parumu Setua Apa? Cek estimasi usia biologis paru-parumu.',
      icon: Wind,
      color: 'bg-brand-surface text-brand-dark border-brand/30'
    }
  ];

  return (
    <div className="p-4 pt-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Tools & Games</h1>
      <p className="text-gray-500 font-medium mb-8">Choose an interactive test to help you stay on track.</p>
      
      <div className="flex flex-col gap-4">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setPage(tool.id as SubPage)}
            className="bg-white rounded-3xl p-3 hover:shadow-md flex items-center gap-4 text-left transition-all group"
          >
            <div className="icon-solid w-14 h-14">
              <tool.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-gray-900 text-lg mb-1">{tool.title}</h3>
              <p className="text-sm text-gray-500 font-medium leading-snug">{tool.description}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-brand transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 1. Rokok Calculator
// ==========================================
function RokokCalculator({ setPage, setActiveTab }: { setPage: (p: SubPage) => void, setActiveTab: (t: any) => void }) {
  const { state } = useAppContext();
  const baseCigarettes = state.profile?.cigarettesPerDay || 10;
  const baseYears = state.profile?.yearsSmoking || 5;
  
  const [cigsPerDay, setCigsPerDay] = useState(baseCigarettes);
  const [dreamItemPrice, setDreamItemPrice] = useState(3000000); // 3jt default
  const pricePerCig = 2500; // Rupiah per batang

  const dailyCost = cigsPerDay * pricePerCig;
  const yearlyCost = dailyCost * 365;
  
  const daysToDream = Math.ceil(dreamItemPrice / dailyCost);
  const lostLifeMinutes = cigsPerDay * 11; // 11 mins per cig
  const totalLostLifeHours = Math.floor((cigsPerDay * 365 * baseYears * 11) / 60);

  const relatableMeal = Math.floor(yearlyCost / 40000); // Nasi padang ~ 40k
  const relatableGas = Math.floor(yearlyCost / 10000); // Bensin ~ 10k
  const relatableNetflix = Math.floor(yearlyCost / 153000); // Netflix Premium ~ 153k

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white px-4 py-4 flex items-center border-b-2 border-gray-100 sticky top-0 z-10">
        <button onClick={() => setPage('list')} className="p-2 -ml-2 rounded-xl text-gray-400 hover:bg-gray-50">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-gray-900 ml-2">What Did You Burn Today?</span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-8 pb-32">
        {/* ZONA INPUT */}
        <div className="bg-white rounded-3xl p-3 space-y-6">
          <div>
             <label className="block font-extrabold text-gray-900 mb-2">Cigarettes per day</label>
             <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" max="100" 
                  value={cigsPerDay} 
                  onChange={e => setCigsPerDay(Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-2 bg-gray-200 rounded-full appearance-none"
                />
                <span className="font-bold text-xl text-brand-dark min-w-[3CH] text-right">{cigsPerDay}</span>
             </div>
          </div>
          <div>
             <label className="block font-extrabold text-gray-900 mb-2">Harga Dream Item-mu (Rp)</label>
             <input 
                type="number"
                value={dreamItemPrice}
                onChange={e => setDreamItemPrice(Number(e.target.value))}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-900 text-lg focus:border-brand outline-none"
             />
             <p className="text-xs font-medium text-gray-400 mt-2">Cth: Gadget baru, liburan, investasi.</p>
          </div>
        </div>

        {/* ZONA REALITY CHECK */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-3xl p-3 text-center border-2 border-red-100 flex flex-col justify-center">
              <span className="text-xs font-bold text-red-500 tracking-wider mb-2">Daily Cost</span>
              <span className="font-bold text-2xl text-red-600">Rp {(dailyCost/1000).toFixed(0)}k</span>
            </div>
            <div className="bg-red-50 rounded-3xl p-3 text-center border-2 border-red-100 flex flex-col justify-center">
              <span className="text-xs font-bold text-red-500 tracking-wider mb-2">Weekly Cost</span>
              <span className="font-bold text-2xl text-red-600">Rp {(dailyCost * 7 / 1000).toFixed(0)}k</span>
            </div>
            <div className="bg-red-50 rounded-3xl p-3 text-center border-2 border-red-100 flex flex-col justify-center">
              <span className="text-xs font-bold text-red-500 tracking-wider mb-2">Monthly Cost</span>
              <span className="font-bold text-2xl text-red-600">Rp {(dailyCost * 30 / 1000000).toFixed(2)}Jt</span>
            </div>
            <div className="bg-red-50 rounded-3xl p-3 text-center border-2 border-red-100 flex flex-col justify-center">
              <span className="text-xs font-bold text-red-500 tracking-wider mb-2">Yearly Cost</span>
              <span className="font-bold text-2xl text-red-600">Rp {(yearlyCost/1000000).toFixed(1)}Jt</span>
            </div>
          </div>

          <div className="bg-brand-surface rounded-3xl p-3 border-2 border-brand/20">
             <div className="flex gap-4">
               <div className="bg-brand/10 p-3 rounded-2xl flex-shrink-0 h-min">
                 <Target className="w-6 h-6 text-brand-dark" />
               </div>
               <div>
                 <h4 className="font-extrabold text-gray-900 mb-1">Countdown ke Mimpimu</h4>
                 <p className="text-brand-dark text-sm font-medium leading-relaxed">
                   If you stop today, in <strong className="font-bold text-lg bg-white px-2 py-0.5 rounded-lg mx-1 shadow-sm border border-brand/30">{daysToDream} days</strong> you can buy that Dream Item with your saved money.
                 </p>
               </div>
             </div>
          </div>

          <div className="bg-gray-900 rounded-3xl p-3 border-2 border-gray-800 text-white">
             <div className="flex gap-4">
               <div className="bg-gray-800 p-3 rounded-2xl flex-shrink-0 h-min">
                 <Activity className="w-6 h-6 text-red-400" />
               </div>
               <div>
                 <h4 className="font-extrabold text-white mb-1">Waktu Hidup Terbakar</h4>
                 <p className="text-gray-300 text-sm font-medium leading-relaxed">
                   Today you burned <strong className="text-red-400">{lostLifeMinutes} minutes</strong> of your life. 
                   Since you started smoking ({baseYears} years ago), a total of <strong className="text-red-400">{totalLostLifeHours} hours</strong> have been lost.
                 </p>
               </div>
             </div>
          </div>

          <div className="bg-green-50 rounded-3xl p-3 border-2 border-green-100">
             <div className="flex gap-4">
               <div className="bg-green-100 p-3 rounded-2xl flex-shrink-0 h-min">
                 <Heart className="w-6 h-6 text-green-600" />
               </div>
               <div>
                 <h4 className="font-extrabold text-gray-900 mb-1">Konversi Relatable</h4>
                 <p className="text-green-800 text-sm font-medium leading-relaxed">
                   Your yearly cigarette cost = <strong>{relatableMeal} Good Meals</strong>, <strong>{relatableGas} Liters of Gas</strong>, or <strong>{relatableNetflix} Months of Netflix Premium</strong>.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 max-w-md mx-auto bg-gradient-to-t from-gray-50 via-gray-50 pointer-events-none">
        <button 
          onClick={() => setActiveTab('settings')} // Can point to onboarding re-run or goals
          className="w-full pointer-events-auto bg-gray-900 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg border-b-4 border-black active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
        >
          Mulai Hitung Dari Nol <ArrowRight className="w-5 h-5"/>
        </button>
      </div>
    </div>
  )
}

function ArrowRight(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
}

function Target(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}

// ==========================================
// 2. Craving Surfer
// ==========================================
function CravingSurfer({ setPage }: { setPage: (p: SubPage) => void }) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180s
  const [isDone, setIsDone] = useState(false);
  const [variant, setVariant] = useState<number>(0);
  const { addCraving } = useAppContext();

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setIsDone(true);
    }
  }, [isActive, timeLeft]);

  const startSurfing = () => {
    setIsActive(true);
    setVariant(Math.floor(Math.random() * 3)); // 0, 1, 2
  };

  const handleFinish = async (stillCraving: boolean) => {
    // Log craving automatically
    await addCraving({
      timestamp: new Date().toISOString(),
      intensity: stillCraving ? 5 : 2,
      trigger_category: 'Surfer',
      outcome: 'resisted',
      inhaler_used: false,
      notes: 'Urge surfed for 3 minutes'
    }).catch(e => console.error(e));

    if (stillCraving) {
      setTimeLeft(180);
      setIsDone(false);
      startSurfing();
    } else {
      setPage('list');
    }
  };

  if (!isActive && !isDone) {
    return (
      <div className="flex flex-col h-full bg-cyan-900 justify-center items-center p-4 text-center animate-in fade-in relative">
        <button onClick={() => setPage('list')} className="absolute top-6 left-6 p-2 rounded-xl text-cyan-200 hover:bg-cyan-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Waves className="w-20 h-20 text-cyan-400 mb-6" strokeWidth={1.5} />
        <h2 className="text-3xl font-extrabold text-white mb-4">Craving Surfer</h2>
        <p className="text-cyan-100 font-medium text-lg leading-relaxed mb-12">
          Cravings are like waves. They rise to a peak, then subside on their own within 3 minutes.
        </p>
        <button 
          onClick={startSurfing}
          className="w-full bg-cyan-400 text-cyan-950 font-bold text-xl py-5 rounded-3xl shadow-lg border-b-[6px] border-cyan-600 active:translate-y-1 active:border-b-2 transition-all"
        >
          Aku Lagi Craving Sekarang
        </button>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col h-full bg-gray-50 justify-center items-center p-4 text-center animate-in fade-in">
        <div className="bg-green-100 p-4 rounded-full mb-6">
          <ThumbsUp className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Ombaknya Lewat.</h2>
        <p className="text-gray-500 font-medium text-lg mb-12">You made it past 3 minutes. How do you feel now?</p>
        
        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => handleFinish(false)}
            className="w-full bg-gray-900 text-white font-extrabold text-lg py-4 rounded-2xl shadow-sm border-b-[4px] border-black active:translate-y-1 active:border-b-0 transition-all"
          >
            Craving Hilang, Aku Aman
          </button>
          <button 
            onClick={() => handleFinish(true)}
            className="w-full bg-white text-gray-900 font-extrabold text-lg py-4 rounded-2xl active:translate-y-1 active:border-b-2 transition-all"
          >
            Masih Kepikiran (Surf 1 Ronde Lagi)
          </button>
        </div>
      </div>
    )
  }

  const radius = 120;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / 180) * circumference;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden relative">
       {/* Ring Timer */}
       <div className="flex-none pt-20 pb-8 flex flex-col items-center relative z-10 transition-all">
          <div className="relative flex justify-center items-center" style={{ width: radius * 2, height: radius * 2 }}>
            <svg
              height={radius * 2}
              width={radius * 2}
              className="absolute -rotate-90 transform"
            >
              <circle
                stroke="rgba(255,255,255,0.1)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#22d3ee" // cyan-400
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="text-center">
              <span className="text-4xl font-bold font-mono tracking-wider tabular-nums">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
       </div>

       {/* Mini Game Area */}
       <div className="flex-1 flex flex-col relative z-10 px-4 pb-12">
          {variant === 0 && <BreathingGame />}
          {variant === 1 && <TapGame />}
          {variant === 2 && <FocusDotGame />}
       </div>

       <button onClick={() => setPage('list')} className="absolute top-6 left-6 p-2 rounded-xl text-white/50 hover:bg-white/10 z-50">
          <ArrowLeft className="w-6 h-6" />
       </button>
    </div>
  );
}

// 2A. Breathing Pacer
function BreathingGame() {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    let timeout: any;
    const cycle = () => {
      setPhase('Inhale');
      timeout = setTimeout(() => {
        setPhase('Hold');
        timeout = setTimeout(() => {
          setPhase('Exhale');
          timeout = setTimeout(cycle, 8000); // Exhale 8s
        }, 7000); // Hold 7s
      }, 4000); // Inhale 4s
    };
    cycle();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-12">
      <div className="relative flex justify-center items-center w-48 h-48">
        <div className={cn(
          "absolute bg-cyan-400/30 rounded-full transition-all duration-[4000ms] ease-in-out",
          phase === 'Inhale' ? "w-48 h-48" : phase === 'Hold' ? "w-48 h-48 opacity-50" : "w-16 h-16 duration-[8000ms]"
        )}></div>
        <div className={cn(
          "absolute bg-cyan-400/50 rounded-full transition-all duration-[4000ms] ease-in-out",
          phase === 'Inhale' ? "w-40 h-40" : phase === 'Hold' ? "w-40 h-40 opacity-50" : "w-12 h-12 duration-[8000ms]"
        )}></div>
        <div className={cn(
          "bg-cyan-400 rounded-full z-10 transition-all duration-[4000ms] ease-in-out shadow-[0_0_40px_rgba(34,211,238,0.5)]",
          phase === 'Inhale' ? "w-32 h-32" : phase === 'Hold' ? "w-32 h-32 scale-105 animate-pulse" : "w-8 h-8 duration-[8000ms]"
        )}></div>
      </div>
      <div className="text-center">
        <h3 className="text-3xl font-extrabold tracking-widest text-cyan-200 mb-2">{phase.toUpperCase()}</h3>
        <p className="text-gray-400 font-medium">Ikuti ritme lingkaran. Fokus ke napasmu.</p>
      </div>
    </div>
  );
}

// 2B. Tap Sequence
function TapGame() {
  const [activeDots, setActiveDots] = useState<number[]>([1]);

  const tap = (idx: number) => {
    setActiveDots(prev => {
      const next = [];
      for(let i=0; i<3; i++) {
        if (Math.random() > 0.5) next.push(Math.floor(Math.random() * 9));
      }
      if (next.length === 0) next.push(Math.floor(Math.random() * 9));
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Tap Polanya</h3>
        <p className="text-gray-400 text-sm">Sibukkan prefrontal cortex-mu.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800 rounded-3xl w-full max-w-[280px]">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
           <button 
             key={idx}
             onPointerDown={() => tap(idx)}
             className={cn(
               "aspect-square rounded-full transition-all duration-100",
               activeDots.includes(idx) ? "bg-cyan-400 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.5)]" : "bg-gray-700"
             )}
           />
        ))}
      </div>
    </div>
  );
}

// 2C. Focus Dot
function FocusDotGame() {
  const [pos, setPos] = useState({ x: 50, y: 50});
  
  useEffect(() => {
    const i = setInterval(() => {
      setPos({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      })
    }, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Ikuti Titiknya</h3>
        <p className="text-gray-400 text-sm">Tahan jarimu di titik yang bergerak.</p>
      </div>
      <div className="flex-1 w-full bg-gray-800 rounded-3xl relative overflow-hidden ring-4 ring-gray-800 touch-none">
         <div 
           className="absolute w-16 h-16 bg-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-[2000ms] ease-in-out cursor-pointer hover:bg-cyan-300 hover:scale-110"
           style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
         ></div>
      </div>
    </div>
  )
}

// ==========================================
// 3. Lung Age Test
// ==========================================
function LungAgeTest({ setPage, setActiveTab }: { setPage: (p: SubPage) => void, setActiveTab: (t: any) => void }) {
  const [step, setStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [answers, setAnswers] = useState({
    age: 30,
    yearsSmoking: 5,
    cigsPerDay: 10,
    morningCough: false,
    shortBreath: 2,
    respHistory: false
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(s => s + 1);
    } else {
      setIsCalculating(true);
      setTimeout(() => {
        setIsCalculating(false);
        setStep(6); // result
      }, 2500);
    }
  }

  const calcLungAge = () => {
    // Formula base: (pack years) estimate + symptom modifiers
    const packYears = (answers.cigsPerDay / 20) * answers.yearsSmoking;
    let computedAge = answers.age + (packYears * 1.5);
    if (answers.morningCough) computedAge += 4;
    if (answers.shortBreath > 2) computedAge += (answers.shortBreath - 2) * 2;
    if (answers.respHistory) computedAge += 5;
    return Math.max(answers.age, Math.round(computedAge));
  }

  if (isCalculating) {
    return (
      <div className="flex flex-col h-full bg-white justify-center items-center text-center p-4">
         <Wind className="w-16 h-16 text-brand-light mb-6 animate-pulse" />
         <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-pulse">Menghitung Lung Age...</h2>
         <p className="text-gray-500 font-medium">Analyzing your lung profile based on clinical criteria.</p>
      </div>
    )
  }

  if (step === 6) {
    const lungAge = calcLungAge();
    const diff = lungAge - answers.age;
    const isBad = diff > 5;

    return (
      <div className="flex flex-col h-full bg-gray-50 overflow-y-auto no-scrollbar">
        <div className="p-4 pb-32">
           <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8 mt-4">Hasil Analisa</h2>
           
           <div className="flex gap-4 items-center justify-center mb-10">
              <div className="text-center">
                 <span className="block text-xs font-bold text-gray-400 tracking-wider mb-2">Usia Asli</span>
                 <div className="bg-white rounded-3xl p-4">
                    <span className="text-5xl font-bold text-gray-900 tabular-nums">{answers.age}</span>
                 </div>
              </div>
              <div className="text-gray-300 font-bold text-3xl">VS</div>
              <div className="text-center animate-in slide-in-from-right fade-in duration-500">
                 <span className="block text-xs font-bold text-brand tracking-wider mb-2">Lung Age</span>
                 <div className={cn(
                   "rounded-3xl p-4 border-b-[6px] shadow-sm transform transition-transform hover:scale-105",
                   isBad ? "bg-red-50 border-red-200 border-b-red-300 text-red-600" : "bg-brand-surface border-brand/30 border-b-orange-300 text-brand-dark"
                 )}>
                    <span className="text-5xl font-bold tabular-nums">{lungAge}</span>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
             <div className="bg-white rounded-3xl p-3 text-center">
               <p className="text-gray-600 font-medium leading-relaxed">
                 This is not a verdict, it's a starting point. Your estimated lung age is <strong>{diff} years older</strong> than your actual age due to your daily smoking burden and symptoms.
               </p>
             </div>

             <div className="bg-brand-surface rounded-3xl p-3 border-2 border-brand/20 flex items-start gap-4">
               <div className="bg-brand/10 p-2 rounded-xl text-brand-dark"><Target className="w-5 h-5"/></div>
               <div>
                  <h4 className="font-extrabold text-brand-dark mb-1">Kabar Baiknya</h4>
                  <p className="text-brand-dark text-sm font-medium leading-snug">If you stop today, your Lung Age could improve to an estimated <strong>{Math.round(answers.age + (diff*0.4))} years</strong> within a year! Lungs can clean themselves.</p>
               </div>
             </div>

             <div className="bg-white rounded-3xl p-3">
                <h4 className="font-extrabold text-gray-900 mb-4">Timeline Pemulihan Paru</h4>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                   <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                     <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 md:group-odd:mr-4 md:group-even:ml-4">
                       <span className="font-bold text-gray-900 text-sm">72 Jam</span>
                       <p className="text-xs text-gray-500 font-medium">Saluran nafas relax, kapasitas meningkat.</p>
                     </div>
                   </div>
                   <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-brand-light text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                     <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 md:group-odd:mr-4 md:group-even:ml-4">
                       <span className="font-bold text-gray-900 text-sm">2 Minggu</span>
                       <p className="text-xs text-gray-500 font-medium">Fungsi paru membaik secara drastis.</p>
                     </div>
                   </div>
                   <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-indigo-400 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                     <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 md:group-odd:mr-4 md:group-even:ml-4">
                       <span className="font-bold text-gray-900 text-sm">1 Tahun</span>
                       <p className="text-xs text-gray-500 font-medium">Bulu silia sehat, bebas batuk membandel.</p>
                     </div>
                   </div>
                </div>
             </div>
           </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 p-4 max-w-md mx-auto bg-gradient-to-t from-gray-50 via-gray-50 pointer-events-none">
          <button 
            onClick={() => setActiveTab('settings')} 
            className="w-full pointer-events-auto bg-brand text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg border-b-4 border-brand-dark active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
          >
            Track Your Recovery <ArrowRight className="w-5 h-5"/>
          </button>
        </div>
      </div>
    )
  }

  const questions = [
    {
      title: "Current age?",
      desc: "Your actual biological age.",
      render: () => (
        <div className="text-center">
          <span className="text-6xl font-bold text-brand tabular-nums">{answers.age}</span>
          <input type="range" min="15" max="80" value={answers.age} onChange={e => setAnswers({...answers, age: Number(e.target.value)})} className="w-full mt-8 accent-orange-500 h-2 bg-gray-200 rounded-full appearance-none"/>
        </div>
      )
    },
    {
      title: "How many years smoking?",
      desc: "Count from when you started daily.",
      render: () => (
        <div className="text-center">
          <span className="text-6xl font-bold text-brand tabular-nums">{answers.yearsSmoking}</span>
          <input type="range" min="1" max="50" value={answers.yearsSmoking} onChange={e => setAnswers({...answers, yearsSmoking: Number(e.target.value)})} className="w-full mt-8 accent-orange-500 h-2 bg-gray-200 rounded-full appearance-none"/>
        </div>
      )
    },
    {
      title: "Average cigarettes per day?",
      desc: "Be honest with yourself.",
      render: () => (
        <div className="text-center">
          <span className="text-6xl font-bold text-brand tabular-nums">{answers.cigsPerDay}</span>
          <input type="range" min="1" max="100" value={answers.cigsPerDay} onChange={e => setAnswers({...answers, cigsPerDay: Number(e.target.value)})} className="w-full mt-8 accent-orange-500 h-2 bg-gray-200 rounded-full appearance-none"/>
        </div>
      )
    },
    {
      title: "Often cough in the morning?",
      desc: "Coughing that appears right after waking up.",
      render: () => (
        <div className="flex flex-col gap-4">
          <button onClick={() => { setAnswers({...answers, morningCough: true}); handleNext(); }} className={cn("py-4 rounded-2xl font-bold text-lg border-2", answers.morningCough ? "bg-brand-surface border-brand text-brand-dark" : "bg-white border-gray-200 text-gray-700")}>Yes, Often</button>
          <button onClick={() => { setAnswers({...answers, morningCough: false}); handleNext(); }} className={cn("py-4 rounded-2xl font-bold text-lg border-2", !answers.morningCough ? "bg-brand-surface border-brand text-brand-dark" : "bg-white border-gray-200 text-gray-700")}>No</button>
        </div>
      )
    },
    {
      title: "Get out of breath easily?",
      desc: "Compared to people your age when climbing stairs or exercising.",
      render: () => (
        <div className="text-center">
          <span className="text-6xl font-bold text-brand tabular-nums">{answers.shortBreath}</span>
          <p className="text-gray-400 mt-2">{answers.shortBreath === 1 ? 'Very Fit' : answers.shortBreath === 5 ? 'Very Quickly Out of Breath' : 'Standard'}</p>
          <input type="range" min="1" max="5" value={answers.shortBreath} onChange={e => setAnswers({...answers, shortBreath: Number(e.target.value)})} className="w-full mt-8 accent-orange-500 h-2 bg-gray-200 rounded-full appearance-none"/>
        </div>
      )
    },
    {
      title: "Any previous respiratory diagnosis?",
      desc: "Such as asthma, mild bronchitis, etc.",
      render: () => (
        <div className="flex flex-col gap-4">
          <button onClick={() => { setAnswers({...answers, respHistory: true}); handleNext(); }} className={cn("py-4 rounded-2xl font-bold text-lg border-2", answers.respHistory ? "bg-brand-surface border-brand text-brand-dark" : "bg-white border-gray-200 text-gray-700")}>Yes</button>
          <button onClick={() => { setAnswers({...answers, respHistory: false}); handleNext(); }} className={cn("py-4 rounded-2xl font-bold text-lg border-2", !answers.respHistory ? "bg-brand-surface border-brand text-brand-dark" : "bg-white border-gray-200 text-gray-700")}>Never</button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-4 flex items-center justify-between border-b-2 border-gray-100">
        <button onClick={() => setPage('list')} className="p-2 -ml-2 rounded-xl text-gray-400 hover:bg-gray-50">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-gray-900">Question {step + 1}/6</span>
        <div className="w-10"></div>
      </div>
      
      {/* Progress Bar */}
      <div className="px-4 pt-4">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
           <div className="h-full bg-brand transition-all duration-300" style={{ width: `${(step/6) * 100}%` }}></div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center pb-24">
        <div className="mb-10 text-center animate-in slide-in-from-right fade-in duration-300" key={step}>
           <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{questions[step].title}</h2>
           <p className="text-gray-500 font-medium">{questions[step].desc}</p>
        </div>

        <div className="animate-in slide-in-from-bottom fade-in duration-300 fill-mode-both delay-100" key={`answer-${step}`}>
           {questions[step].render()}
        </div>
      </div>

      {step !== 3 && step !== 5 && (
        <div className="p-4">
          <button 
            onClick={handleNext}
            className="w-full bg-gray-900 text-white font-extrabold text-lg py-5 rounded-2xl shadow-sm border-b-[4px] border-black active:translate-y-1 active:border-b-0 transition-all flex justify-center items-center gap-2"
          >
            Lanjut <ArrowRight className="w-5 h-5"/>
          </button>
        </div>
      )}
    </div>
  )
}
