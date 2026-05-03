import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import CBTMethod from '../components/methods/CBTMethod';
import ACTMethod from '../components/methods/ACTMethod';
import MindfulnessMethod from '../components/methods/MindfulnessMethod';
import MIMethod from '../components/methods/MIMethod';
import HabitMethod from '../components/methods/HabitMethod';
import { 
  CheckCircle2, RefreshCcw, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { QuitMethod } from '../types';

export default function MethodPage() {
  const { state, updateProfile } = useAppContext();
  const method = state.profile?.quitMethod || 'cbt';
  const [showChangeMethod, setShowChangeMethod] = useState(false);

  const retakeAssessment = async () => {
    if (confirm("Are you sure you want to retake the discovery assessment?")) {
      await updateProfile({ isOnboarded: false });
      window.location.reload();
    }
  };

  const manualChangeMethod = async (newMethod: QuitMethod) => {
    await updateProfile({ quitMethod: newMethod });
    setShowChangeMethod(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-24 relative">
      <div className="absolute top-4 right-4 z-10">
         <button onClick={() => setShowChangeMethod(true)} className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 border-2 border-gray-200 flex items-center gap-1.5 hover:border-gray-300 transition-colors shadow-sm" style={{boxShadow: '0 2px 0 #E5E7EB'}}>
            <RefreshCcw className="w-3 h-3" /> Change Method
         </button>
      </div>

      {method === 'cbt' && <CBTMethod />}
      {method === 'act' && <ACTMethod />}
      {method === 'mindfulness' && <MindfulnessMethod />}
      {method === 'mi' && <MIMethod />}
      {method === 'habit' && <HabitMethod />}

      {showChangeMethod && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col p-4 max-h-[90vh] overflow-y-auto" style={{boxShadow: '0 -4px 0 #E5E7EB'}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-gray-900">Change Method</h2>
              <button onClick={() => setShowChangeMethod(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
               <p className="text-sm text-gray-500 font-medium mb-2">Choose a different path, or retake the assessment to let us guide you.</p>
               
               <button onClick={() => manualChangeMethod('cbt')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors", method === 'cbt' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'cbt' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Cognitive Behavioral (CBT)</h4><p className="text-xs text-gray-500 font-medium">Rewire thought patterns</p></div>
                  {method === 'cbt' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>
               
               <button onClick={() => manualChangeMethod('act')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors", method === 'act' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'act' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Acceptance & Commitment (ACT)</h4><p className="text-xs text-gray-500 font-medium">Surf urges and focus on values</p></div>
                  {method === 'act' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>

               <button onClick={() => manualChangeMethod('mindfulness')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors", method === 'mindfulness' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'mindfulness' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Mindfulness-Based</h4><p className="text-xs text-gray-500 font-medium">Break the autopilot cycle</p></div>
                  {method === 'mindfulness' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>

               <button onClick={() => manualChangeMethod('mi')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors", method === 'mi' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'mi' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Gradual Quitter (MI)</h4><p className="text-xs text-gray-500 font-medium">Step-down reduction & motivation</p></div>
                  {method === 'mi' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>

               <button onClick={() => manualChangeMethod('habit')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors", method === 'habit' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'habit' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Habit Replacement</h4><p className="text-xs text-gray-500 font-medium">Swap the routine, keep the reward</p></div>
                  {method === 'habit' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>
            </div>

            <div className="pt-2">
               <button onClick={retakeAssessment} className="w-full bg-white text-gray-600 border-2 border-gray-200 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all" style={{boxShadow: '0 4px 0 #E5E7EB'}}>
                 <RefreshCcw className="w-4 h-4" /> Retake Discovery Assessment
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

