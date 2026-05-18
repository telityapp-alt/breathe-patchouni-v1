import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { GoogleGenAI, Type } from '@google/genai';
import { Send, Bot, Loader2, Target, CheckCircle2, ThumbsUp, ThumbsDown, Zap, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';
import { AiConversation, Mission, CoachInsightItem } from '../lib/db';
import ReactMarkdown from 'react-markdown';
import { differenceInDays, subDays } from 'date-fns';

export function ChatPage({ setActiveTab }: { setActiveTab?: (tab: any) => void }) {
  const { state, addChatMessage, updateProfile, addMission, updateMission, markInsightRead } = useAppContext();
  const [activeTab, setLocalActiveTab] = useState<'chat' | 'missions'>('chat');

  return (
    <div className="flex flex-col h-full bg-white relative">
      <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="icon-solid w-10 h-10 shadow-sm relative">
            <Bot className="w-5 h-5 text-white" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-brand rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight">Coach</h1>
            <p className="text-xs text-brand font-bold">Online</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-full">
           <button 
              onClick={() => setLocalActiveTab('chat')}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-all", activeTab === 'chat' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
           >Chat</button>
           <button 
              onClick={() => setLocalActiveTab('missions')}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-all", activeTab === 'missions' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
           >Tracker</button>
        </div>
      </header>

      {activeTab === 'chat' ? <ChatInterface setActiveTab={setActiveTab} /> : <TrackerInterface />}
    </div>
  );
}

function ChatInterface({ setActiveTab }: { setActiveTab?: (tab: any) => void }) {
   const { state, addChatMessage, addCraving, addInhalerLog, addMission } = useAppContext();
   const [input, setInput] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

   useEffect(() => {
      scrollToBottom();
   }, [state.messages, isTyping]);

   const lastCraving = state.cravings[0];
   const lastCravingMins = lastCraving ? (new Date().getTime() - new Date(lastCraving.timestamp).getTime()) / 60000 : Infinity;
   const streakStartDate = state.profile?.lastSmoked ? new Date(state.profile.lastSmoked) : (state.profile?.quitDate ? new Date(state.profile.quitDate) : new Date());
   const currentDay = differenceInDays(new Date(), streakStartDate);

   // Dynamic Quick Actions
   const quickActions = useMemo(() => {
      let actions = [];
      if (lastCravingMins < 60) {
         if (lastCraving?.outcome === 'smoked') {
            actions = ["It's okay, let's talk", "Help me start over", "Why did this happen?"];
         } else if (lastCraving?.intensity >= 7) {
            actions = ["Help me get through this", "I want to vent", `Show me ${state.profile?.quitMethod || 'relaxation'} techniques`];
         } else {
            actions = ["The craving faded on its own", "Let's talk about the trigger"];
         }
      } else if (currentDay > 0 && currentDay % 7 === 0) {
         actions = ["Celebrate with you", "Set the next goal", "Check what has changed in my body"];
      } else {
         actions = ["Any tips for today?", "I have something on my mind", "Review my progress"];
      }
      return actions;
   }, [lastCravingMins, lastCraving, currentDay, state.profile]);

   const emotionRegex = {
      distressed: /(can't|give up|tired|dizzy|stressed|heavy|impossible)/i,
      ambivalent: /(hesitant|unsure|maybe|guess|confused)/i,
      motivated: /(excited|can do this|ready|want to try|keep going|sure)/i
   };

   const detectEmotion = (text: string) => {
      if (emotionRegex.distressed.test(text)) return 'distressed';
      if (emotionRegex.motivated.test(text)) return 'motivated';
      if (emotionRegex.ambivalent.test(text)) return 'ambivalent';
      return 'neutral';
   };

   const handleSend = async (messageText: string = input) => {
      if (!messageText.trim()) return;
  
      const userMessage: Omit<AiConversation, 'id'> = {
        role: 'user',
        content: messageText,
        sessionId: 'default_session',
        timestamp: new Date().toISOString()
      };
  
      try {
         await addChatMessage(userMessage);
      } catch (e) {
         console.error(e);
      }
      
      setInput('');
      setIsTyping(true);
  
      try {        
        const now = new Date();
        const weekAgo = subDays(now, 7);
        const last7cravings = state.cravings.filter(c => new Date(c.timestamp) >= weekAgo);
        const resistedLast7 = last7cravings.filter(c => c.outcome === 'resisted').length;
        const resistanceRate = last7cravings.length ? Math.round((resistedLast7 / last7cravings.length) * 100) : 0;
        
        let methodEngagements = 0;
        if (state.profile?.quitMethod === 'cbt') methodEngagements = state.cbtJournals?.length || 0;
        if (state.profile?.quitMethod === 'act') methodEngagements = state.actUrges?.length || 0;
        if (state.profile?.quitMethod === 'mindfulness') methodEngagements = state.mindfulnessLogs?.length || 0;

        const emotion = detectEmotion(messageText);

        // Calculate top mood
        const moodCount: Record<string, number> = {};
        last7cravings.forEach(c => {
           if (c.mood) {
              moodCount[c.mood] = (moodCount[c.mood] || 0) + 1;
           }
        });
        const topMood = Object.keys(moodCount).sort((a,b) => moodCount[b] - moodCount[a])[0] || 'Unknown';

        // BHI proxy
        let bhiProxy = 'Moderate';
        if (resistanceRate > 70 && methodEngagements >= 2) bhiProxy = 'Excellent/Near Freedom';
        else if (resistanceRate < 40) bhiProxy = 'Struggling/Beginner';

        const recentHistory = state.messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n');
        
        const payload = {
           messageText,
           recentHistory,
           methodEngagements,
           currentDay,
           primaryTriggers: state.profile?.primaryTriggers || [],
           resistanceRate,
           last7cravingsCount: last7cravings.length,
           topMood,
           bhiProxy,
           emotion,
           quitMethod: state.profile?.quitMethod || 'None'
        };

        const res = await fetch("/api/chat", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        let finalReply = data.text || '';
        const functionCalls = data.functionCalls || [];

        if (functionCalls.length > 0) {
           const call = functionCalls[0];
           if (call.name === 'navigate_feature' && typeof setActiveTab === 'function') {
              const args = call.args as any;
              setActiveTab(args.tabName);
              finalReply = `Tentu! Aku sudah membuka halaman ${args.tabName} untukmu.`;
           } else if (call.name === 'log_craving_for_user') {
              const args = call.args as any;
              if (addCraving) {
                 await addCraving({
                     timestamp: new Date().toISOString(),
                     intensity: args.intensity,
                     trigger_category: args.trigger_category,
                     outcome: args.outcome,
                     inhaler_used: false,
                     notes: args.notes || 'Logged via AI Coach'
                 });
                 finalReply = `I've logged your craving (Intensity: ${args.intensity}, Trigger: ${args.trigger_category}). Awesome job being honest! Keep it up.`;
              }
           } else if (call.name === 'log_inhaler_for_user') {
              const args = call.args as any;
              if (addInhalerLog) {
                 await addInhalerLog({
                     timestamp: new Date().toISOString(),
                     variantUsed: 'none',
                     context: ['ai_logged'],
                     intensityBefore: args.intensityBefore || 5,
                     intensityAfter: args.intensityAfter || 0,
                     isInhalerAvailable: true,
                     fallbackMethod: null,
                     notes: args.notes || 'Logged via AI Coach'
                 });
                 finalReply = `Got it, I've noted down your inhaler usage. Hope the craving subsides!`;
              }
           } else if (call.name === 'create_personal_mission') {
              const args = call.args as any;
              if (addMission) {
                 await addMission({
                     title: args.title,
                     description: args.description,
                     targetCount: args.targetCount,
                     currentCount: 0,
                     status: 'active',
                     startDate: new Date().toISOString(),
                     endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                     relatedMethod: args.relatedMethod
                 });
                 finalReply = `Sip, misi baru buatmu: "${args.title}" udah aku set. Cek tab Tracker ya!`;
              }
           }
        }

        if (!finalReply) {
             finalReply = 'I am here to support you.';
        }

        const aiMessage: Omit<AiConversation, 'id'> = {
          role: 'ai',
          content: finalReply,
          sessionId: 'default_session',
          timestamp: new Date().toISOString()
        };
  
        await addChatMessage(aiMessage);
      } catch (error) {
        console.error(error);
        try {
          await addChatMessage({
              role: 'ai',
              sessionId: 'default_session',
              content: "Sorry, I am experiencing a slight connection issue right now. Keep breathing slowly, you can easily get through this.",
              timestamp: new Date().toISOString()
          });
        } catch (innerError) {
          console.error("Failed to add connection issue message:", innerError);
        }
      } finally {
        setIsTyping(false);
      }
   };

   return (
      <div className="flex-1 flex flex-col relative">
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 pb-32">
            {state.messages.length === 0 && (
               <div className="text-center text-gray-500 my-8 px-4 text-sm font-medium">
                  Hi! I'm your AI Coach. I'm here 24/7 if you need to talk about a craving, want some motivation, or just need a distraction.
               </div>
            )}
            
            {state.messages.map(msg => (
               <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                     "max-w-[80%] rounded-[1.25rem] px-5 py-3 text-[15px] font-medium shadow-sm border leading-relaxed",
                     msg.role === 'user' ? "bg-gray-900 border-gray-900 text-white rounded-br-sm" : "bg-white border-gray-100 text-gray-800 rounded-bl-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-strong:font-bold"
                  )}>
                     {msg.role === 'user' ? (
                        msg.content
                     ) : (
                        <div className="markdown-body">
                           <ReactMarkdown>{msg.content.replace(/<think>[\s\S]*?<\/think>/g, '')}</ReactMarkdown>
                        </div>
                     )}
                  </div>
               </div>
            ))}
            
            {isTyping && (
               <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-[1.25rem] rounded-bl-sm px-5 py-3">
                     <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
         </div>

         {/* Input Box and Quick Actions stick to bottom */}
         <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10 flex flex-col">
            <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide">
               {quickActions.map((qa, i) => (
                  <button 
                     key={i} 
                     onClick={() => handleSend(qa)}
                     className="shrink-0 bg-brand-50 text-brand-dark px-4 py-2 rounded-full text-xs font-bold border border-brand/20 active:scale-95 transition-transform"
                  >
                     {qa}
                  </button>
               ))}
            </div>
            <div className="p-4 pt-1 flex items-center gap-2">
               <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ceritakan kondisimu..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 transition-colors"
               />
               <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 bg-gray-900 text-white font-bold rounded-2xl active:translate-y-1 flex items-center justify-center disabled:opacity-50 shrink-0 transition-all hover:bg-black shadow-md border-b-2 border-black"
               >
                  <Send className="w-5 h-5 ml-1" />
               </button>
            </div>
         </div>
      </div>
   )
}

function TrackerInterface() {
   const { state, updateMission, markInsightRead } = useAppContext();
   const activeMission = state.missions.find(m => m.status === 'active');
   const completedMissions = state.missions.filter(m => m.status === 'completed');
   
   return (
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-3 space-y-8 pb-32">
         {/* INSIGHT FEED */}
         <section>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-brand"/> Coach Insight Feed</h3>
            <div className="space-y-3">
               {state.coachInsights.length > 0 ? state.coachInsights.map(insight => (
                  <div key={insight.id} className={`card-duo p-3 transition-all ${insight.isRead ? 'opacity-70' : 'border-brand-light'}`}>
                     <p className="text-sm font-medium text-gray-700 leading-relaxed mb-4">{insight.content}</p>
                     <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                        <span className="text-[10px] font-bold text-gray-400">{new Date(insight.timestamp).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                           <button className="p-1.5 rounded-full hover:bg-gray-100"><ThumbsUp className="w-4 h-4 text-gray-400"/></button>
                           <button className="p-1.5 rounded-full hover:bg-gray-100"><ThumbsDown className="w-4 h-4 text-gray-400"/></button>
                        </div>
                     </div>
                  </div>
               )) : (
                  <div className="card-duo bg-brand-surface border-brand/20 p-3 text-center">
                     <p className="text-sm font-medium text-gray-600 leading-relaxed py-4">Belum ada insight. Chat dengan AI Coach secara reguler untuk mendapatkan insight personal!</p>
                  </div>
               )}
            </div>
         </section>

         {/* MISSION BOARD */}
         <section>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-brand"/> Personal Mission</h3>
            {activeMission ? (
               <div className="bg-gray-900 border border-gray-800 text-white rounded-3xl p-4 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-[100px]"></div>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                     <span className="text-[10px] tracking-widest font-bold bg-white/20 px-2 py-1 rounded-sm text-white">Active</span>
                     <span className="text-[10px] font-bold text-gray-400">{activeMission.currentCount} / {activeMission.targetCount} DONE</span>
                  </div>
                  
                  <h4 className="text-xl font-bold leading-tight mb-2 relative z-10">{activeMission.title}</h4>
                  <p className="text-sm font-medium text-gray-300 leading-relaxed mb-6 relative z-10">{activeMission.description}</p>
                  
                  <div className="relative z-10 space-y-2">
                     <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-light transition-all" style={{ width: `${(activeMission.currentCount / activeMission.targetCount) * 100}%`}}></div>
                     </div>
                     <button 
                        onClick={() => updateMission(activeMission.id, { currentCount: activeMission.currentCount + 1 })}
                        className="w-full bg-white text-gray-900 font-bold py-3 mt-4 rounded-xl text-sm hover:bg-gray-100 flex justify-center items-center gap-2"
                     >
                        <CheckCircle2 className="w-4 h-4" /> Log Progress
                     </button>
                  </div>
               </div>
            ) : (
               <div className="bg-gray-100 border border-gray-200 rounded-3xl p-6 text-center shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-2">Tidak ada misi aktif</h4>
                  <p className="text-sm font-medium text-gray-500">
                     Chat with your AI Coach to get personal challenges and missions tailored to your progress.
                  </p>
               </div>
            )}

            {completedMissions.length > 0 && (
               <div className="mt-8">
                  <h4 className="text-xs font-bold text-gray-400 tracking-widest mb-3">Past Missions</h4>
                  <div className="space-y-3">
                     {completedMissions.map((m, i) => (
                        <div key={i} className="card-duo p-4 bg-white border-gray-200">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                                 <Zap className="w-5 h-5 text-brand-dark" />
                              </div>
                              <div>
                                 <h5 className="font-bold text-sm text-gray-800">{m.title}</h5>
                                 <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-0.5">{m.targetCount}/{m.targetCount} Completed</p>
                              </div>
                           </div>
                           {m.reflection && <p className="text-xs text-gray-600 italic font-medium mt-3 bg-gray-50 p-2 rounded-lg">"{m.reflection}"</p>}
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </section>
      </div>
   )
}
