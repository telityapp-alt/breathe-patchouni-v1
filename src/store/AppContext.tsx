import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, UserTable, CravingEvent, JournalEntry, Milestone, AiConversation, CachedInsight, AnalyticsCache, CbtThoughtJournal, ActUrgeSurf, MindfulnessLog, MiReductionLog, HabitLoop, HabitLog, InhalerLog, Mission, CoachInsightItem } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { isSameDay, differenceInDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { pushToSupabase, pullFromSupabase, processSyncQueue, deleteFromSupabase } from '../lib/sync';

export interface AppState {
  profile: UserTable | null;
  cravings: CravingEvent[];
  messages: AiConversation[];
  lastInsight: CachedInsight | null;
  analyticsCache: AnalyticsCache | null;
  milestones: Milestone[];
  cbtJournals: CbtThoughtJournal[];
  actUrges: ActUrgeSurf[];
  mindfulnessLogs: MindfulnessLog[];
  miReductionLogs: MiReductionLog[];
  habitLoops: HabitLoop[];
  habitLogs: HabitLog[];
  inhalerLogs: InhalerLog[];
  missions: Mission[];
  coachInsights: CoachInsightItem[];
}

interface AppContextType {
  state: AppState;
  updateProfile: (profile: Partial<UserTable>) => Promise<void>;
  addCraving: (log: Omit<CravingEvent, 'id'>) => Promise<Milestone | null>;
  addChatMessage: (msg: Omit<AiConversation, 'id'>) => Promise<void>;
  setDailyInsight: (insight: string, type?: 'daily_dashboard' | 'analytics_trigger') => Promise<void>;
  markArticleRead: (articleId: string) => Promise<void>;
  addMission: (mission: Omit<Mission, 'id'>) => Promise<void>;
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>;
  addCoachInsight: (insight: Omit<CoachInsightItem, 'id'>) => Promise<void>;
  markInsightRead: (id: string) => Promise<void>;
  addCbtJournal: (entry: Omit<CbtThoughtJournal, 'id'>) => Promise<void>;
  addActUrgeSurf: (entry: Omit<ActUrgeSurf, 'id'>) => Promise<void>;
  addMindfulnessLog: (entry: Omit<MindfulnessLog, 'id'>) => Promise<void>;
  addMiReductionLog: (entry: Omit<MiReductionLog, 'id'>) => Promise<void>;
  saveHabitLoop: (entry: Partial<HabitLoop>) => Promise<void>;
  addHabitLog: (entry: Omit<HabitLog, 'id'>) => Promise<void>;
  addInhalerLog: (entry: Omit<InhalerLog, 'id'>) => Promise<void>;
  updateInhalerLog: (id: string, updates: Partial<InhalerLog>) => Promise<void>;
  deleteInhalerLog: (id: string) => Promise<void>;
  clearData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { session, user } = useAuth();
  const initRef = useRef(false);

  useEffect(() => {
    if (user?.id && !initRef.current) {
      initRef.current = true;
      pullFromSupabase(user.id);
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online. Processing sync queue...');
      processSyncQueue().then(() => {
        if (user?.id) {
          // Re-pull to fetch any changes made on other devices
          pullFromSupabase(user.id);
        }
      });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user?.id]);

  const profile = useLiveQuery(() => db.users.toCollection().last()) || null;
  const cravings = useLiveQuery(() => db.craving_events.orderBy('timestamp').reverse().toArray()) || [];
  const messages = useLiveQuery(() => db.ai_conversations.orderBy('timestamp').toArray()) || [];
  
  const cbtJournals = useLiveQuery(() => db.cbt_thought_journals.orderBy('timestamp').reverse().toArray()) || [];
  const actUrges = useLiveQuery(() => db.act_urge_surfs.orderBy('timestamp').reverse().toArray()) || [];
  const mindfulnessLogs = useLiveQuery(() => db.mindfulness_logs.orderBy('timestamp').reverse().toArray()) || [];
  const miReductionLogs = useLiveQuery(() => db.mi_reduction_logs.orderBy('date').reverse().toArray()) || [];
  const habitLoops = useLiveQuery(() => db.habit_loops.orderBy('timestamp').reverse().toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habit_logs.orderBy('timestamp').reverse().toArray()) || [];
  const inhalerLogs = useLiveQuery(() => db.inhaler_logs.orderBy('timestamp').reverse().toArray()) || [];
  const missions = useLiveQuery(() => db.missions.toArray()) || [];
  const coachInsights = useLiveQuery(() => db.coach_insights.orderBy('timestamp').reverse().toArray()) || [];

  const todayDate = new Date().toISOString().split('T')[0];
  const lastInsight = useLiveQuery(() => db.cached_insights.get([todayDate, 'daily_dashboard'])) || null;
  
  const analyticsCache = useLiveQuery(() => db.analytics_cache.get('global')) || null;
  const milestones = useLiveQuery(() => db.milestones.orderBy('timestamp').reverse().toArray()) || [];

  const state: AppState = {
    profile: profile as UserTable | null,
    cravings,
    messages,
    lastInsight: lastInsight as CachedInsight | null,
    analyticsCache: analyticsCache as AnalyticsCache | null,
    milestones,
    cbtJournals,
    actUrges,
    mindfulnessLogs,
    miReductionLogs,
    habitLoops,
    habitLogs,
    inhalerLogs,
    missions,
    coachInsights
  };

  const updateProfile = async (updates: Partial<UserTable>) => {
    if (state.profile?.id) {
      await db.users.update(state.profile.id, updates);
    } else {
      await db.users.add({ ...updates, id: uuidv4() } as UserTable);
    }
    if (user?.id) {
       await pushToSupabase('profiles', { id: state.profile?.id || user.id, ...updates }, user.id);
    }
  };

  const recomputeAnalyticsCache = async (newEvent: Omit<CravingEvent, 'id'>) => {
    let cache = await db.analytics_cache.get('global');
    if (!cache) {
      cache = {
        id: 'global',
        triggerDistribution: {},
        moodDistribution: {},
        peakHours: {},
        totalResisted: 0,
        totalSmoked: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Update trigger
    cache.triggerDistribution[newEvent.trigger_category] = (cache.triggerDistribution[newEvent.trigger_category] || 0) + 1;
    
    // Update outcome
    if (newEvent.outcome === 'resisted') cache.totalResisted++;
    else cache.totalSmoked++;

    // Update hour mapping
    const hr = new Date(newEvent.timestamp).getHours();
    cache.peakHours[hr] = (cache.peakHours[hr] || 0) + 1;

    // Update mood if exists
    if (newEvent.mood) {
       const m = cache.moodDistribution[newEvent.mood] || { count: 0, sumIntensity: 0 };
       cache.moodDistribution[newEvent.mood] = {
           count: m.count + 1,
           sumIntensity: m.sumIntensity + newEvent.intensity
       };
    }

    cache.lastUpdated = new Date().toISOString();
    await db.analytics_cache.put(cache);
  }

  const checkMilestones = async (): Promise<Milestone | null> => {
    if (!state.profile) return null;
    
    // Action based
    const countResisted = await db.craving_events.where('outcome').equals('resisted').count();
    const actionThresholds = [
      { key: '5_resisted', threshold: 5, title: 'Good Start', description: 'Resisted 5 cravings.' },
      { key: '10_resisted', threshold: 10, title: 'Iron Will', description: 'Resisted 10 cravings successfully!' },
      { key: '25_resisted', threshold: 25, title: 'Mind over Matter', description: 'Resisted 25 cravings.' },
      { key: '50_resisted', threshold: 50, title: 'Craving Master', description: 'Resisted 50 cravings.' }
    ];

    let unlocked: Milestone | null = null;
    
    for (const action of actionThresholds) {
       if (countResisted >= action.threshold) {
           const exists = await db.milestones.where('key').equals(action.key).count();
           if (!exists) {
               unlocked = { id: uuidv4(), key: action.key, title: action.title, description: action.description, timestamp: new Date().toISOString() };
               await db.milestones.add(unlocked);
               if (user?.id) await pushToSupabase('milestones', unlocked, user.id);
           }
       }
    }

    // Time based
    const streakStartDate = state.profile.lastSmoked ? new Date(state.profile.lastSmoked) : new Date(state.profile.quitDate);
    const streakHours = differenceInDays(new Date(), streakStartDate) * 24 + differenceInDays(new Date(), streakStartDate); // simplified
    // Fix logic below directly using hrs
    const diffHrs = (new Date().getTime() - streakStartDate.getTime()) / 3600000;
    
    const timeThresholds = [
      { key: '24_hours', hrs: 24, title: '24 Hours Clear', description: 'A full day without smoking!' },
      { key: '72_hours', hrs: 72, title: '3 Days Clear', description: 'Nicotine is leaving your system.' },
      { key: '1_week', hrs: 168, title: '1 Week Streak', description: 'Physical withdrawal is peaking and dropping.' },
      { key: '2_weeks', hrs: 336, title: '2 Weeks Strong', description: 'Circulation is starting to improve.' }
    ];

    for (const time of timeThresholds) {
        if (diffHrs >= time.hrs) {
           const exists = await db.milestones.where('key').equals(time.key).count();
           if (!exists) {
               unlocked = { id: uuidv4(), key: time.key, title: time.title, description: time.description, timestamp: new Date().toISOString() };
               await db.milestones.add(unlocked);
               if (user?.id) await pushToSupabase('milestones', unlocked, user.id);
           }
        }
    }

    return unlocked;
  }

  const addCraving = async (log: Omit<CravingEvent, 'id'>): Promise<Milestone | null> => {
    const logWithId: CravingEvent = { ...log, id: uuidv4() };
    await db.craving_events.add(logWithId);
    await recomputeAnalyticsCache(logWithId);

    if (user?.id) {
       await pushToSupabase('craving_events', logWithId, user.id);
    }

    if (logWithId.outcome === 'smoked' && state.profile) {
      await db.users.update(state.profile.id, { lastSmoked: logWithId.timestamp });
      if (user?.id) {
         await pushToSupabase('profiles', { id: state.profile.id || user.id, lastSmoked: logWithId.timestamp }, user.id);
      }
      return null;
    } else {
      return await checkMilestones();
    }
  };

  const addChatMessage = async (msg: Omit<AiConversation, 'id'>) => {
    const msgWithId: AiConversation = { ...msg, id: uuidv4() };
    await db.ai_conversations.add(msgWithId);
    if (user?.id) await pushToSupabase('ai_conversations', msgWithId, user.id);
  };

  const setDailyInsight = async (insight: string, type: 'daily_dashboard' | 'analytics_trigger' = 'daily_dashboard') => {
    const today = new Date().toISOString().split('T')[0];
    await db.cached_insights.put({ date: today, insight, type });
  };

  const markArticleRead = async (articleId: string) => {
    if (!state.profile?.id) return;
    const currentRead = state.profile.readArticles || [];
    if (!currentRead.includes(articleId)) {
        const newRead = [...currentRead, articleId];
        await db.users.update(state.profile.id, {
            readArticles: newRead
        });
        if (user?.id) await pushToSupabase('profiles', { id: state.profile.id, readArticles: newRead }, user.id);
    }
  };

  const addCbtJournal = async (entry: Omit<CbtThoughtJournal, 'id'>) => {
    const entryWithId: CbtThoughtJournal = { ...entry, id: uuidv4() };
    await db.cbt_thought_journals.add(entryWithId);
    if (user?.id) await pushToSupabase('cbt_thought_journals', entryWithId, user.id);
  };

  const addActUrgeSurf = async (entry: Omit<ActUrgeSurf, 'id'>) => {
    const entryWithId: ActUrgeSurf = { ...entry, id: uuidv4() };
    await db.act_urge_surfs.add(entryWithId);
    if (user?.id) await pushToSupabase('act_urge_surfs', entryWithId, user.id);
  };

  const addMindfulnessLog = async (entry: Omit<MindfulnessLog, 'id'>) => {
    const entryWithId: MindfulnessLog = { ...entry, id: uuidv4() };
    await db.mindfulness_logs.add(entryWithId);
    if (user?.id) await pushToSupabase('mindfulness_logs', entryWithId, user.id);
  };

  const addMiReductionLog = async (entry: Omit<MiReductionLog, 'id'>) => {
    const entryWithId: MiReductionLog = { ...entry, id: uuidv4() };
    await db.mi_reduction_logs.add(entryWithId);
    if (user?.id) await pushToSupabase('mi_reduction_logs', entryWithId, user.id);
  };

  const saveHabitLoop = async (entry: Partial<HabitLoop>) => {
    let entryWithId = entry;
    if (entry.id) {
       await db.habit_loops.update(entry.id, entry);
    } else {
       entryWithId = { ...entry, id: uuidv4() };
       await db.habit_loops.add(entryWithId as HabitLoop);
    }
    if (user?.id) await pushToSupabase('habit_loops', entryWithId, user.id);
  };

  const addHabitLog = async (entry: Omit<HabitLog, 'id'>) => {
    const entryWithId: HabitLog = { ...entry, id: uuidv4() };
    await db.habit_logs.add(entryWithId);
    if (user?.id) await pushToSupabase('habit_logs', entryWithId, user.id);
  };

  const addInhalerLog = async (entry: Omit<InhalerLog, 'id'>) => {
    const entryWithId: InhalerLog = { ...entry, id: uuidv4() };
    await db.inhaler_logs.add(entryWithId);
    if (user?.id) await pushToSupabase('inhaler_logs', entryWithId, user.id);
  };

  const updateInhalerLog = async (id: string, updates: Partial<InhalerLog>) => {
    await db.inhaler_logs.update(id, updates);
    if (user?.id) await pushToSupabase('inhaler_logs', { id, ...updates }, user.id);
  };

  const deleteInhalerLog = async (id: string) => {
    await db.inhaler_logs.delete(id);
    if (user?.id) await deleteFromSupabase('inhaler_logs', id, user.id);
  };

  const addMission = async (mission: Omit<Mission, 'id'>) => {
    const missionWithId: Mission = { ...mission, id: uuidv4() };
    await db.missions.add(missionWithId);
    if (user?.id) await pushToSupabase('missions', missionWithId, user.id);
  };

  const updateMission = async (id: string, updates: Partial<Mission>) => {
    await db.missions.update(id, updates);
    if (user?.id) await pushToSupabase('missions', { id, ...updates }, user.id);
  };

  const addCoachInsight = async (insight: Omit<CoachInsightItem, 'id'>) => {
    const insightWithId: CoachInsightItem = { ...insight, id: uuidv4() };
    await db.coach_insights.add(insightWithId);
    if (user?.id) await pushToSupabase('coach_insights', insightWithId, user.id);
  };

  const markInsightRead = async (id: string) => {
    await db.coach_insights.update(id, { isRead: true });
    if (user?.id) await pushToSupabase('coach_insights', { id, isRead: true }, user.id);
  };

  const clearData = async () => {
    await Promise.all([
      db.users.clear(),
      db.craving_events.clear(),
      db.journal_entries.clear(),
      db.milestones.clear(),
      db.ai_conversations.clear(),
      db.cached_insights.clear(),
      db.analytics_cache.clear(),
      db.cbt_thought_journals.clear(),
      db.act_urge_surfs.clear(),
      db.mindfulness_logs.clear(),
      db.mi_reduction_logs.clear(),
      db.habit_loops.clear(),
      db.habit_logs.clear(),
      db.inhaler_logs.clear()
    ]);
  };

  // Prevent harsh flashes while Dexie loads by returning a basic loading or rendering with empty states fast
  return (
    <AppContext.Provider value={{ state, updateProfile, addCraving, addChatMessage, setDailyInsight, markArticleRead, addCbtJournal, addActUrgeSurf, addMindfulnessLog, addMiReductionLog, saveHabitLoop, addHabitLog, addInhalerLog, updateInhalerLog, deleteInhalerLog, addMission, updateMission, addCoachInsight, markInsightRead, clearData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
