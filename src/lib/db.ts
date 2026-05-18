import Dexie, { type Table } from 'dexie';

export interface NotificationSettings {
  peakWarning: boolean;
  streakCheckpoint: boolean;
  journalReminder: boolean;
  journalTime: string;
  aiCheckIn: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface UserTable {
  id: string; // single user profile
  quitDate: string;
  cigarettesPerDay: number;
  yearsSmoking: number;
  brandStrength: 'light' | 'regular' | 'strong';
  timeToFirstSmoke: 'under_5' | '6_30' | '31_60' | 'over_60';
  difficultForbidden: boolean;
  ftndScore: number;
  dependancyLevel: 'low' | 'medium' | 'high';
  primaryTriggers: string[];
  mainQuitReason: string[];
  quitPlanMode: 'gradual' | 'cold-turkey';
  programWeeks: number;
  lastSmoked: string | null;
  isOnboarded: boolean;
  quitMethod?: string;
  readArticles?: string[];
  bookmarkedArticles?: string[];
  notificationSettings?: NotificationSettings;
  cbtSosUses?: number;
  actCoreValues?: string[];
  actExercisesCompleted?: string[];
  mindfulnessBellInterval?: number;
  miCigarettesTarget?: number;
  miCigarettesSmokedToday?: number;
  miLastLogDate?: string;
  miPros?: string[];
  miCons?: string[];
}

export interface CbtThoughtJournal {
  id?: string;
  timestamp: string;
  situation: string;
  situationTag: string;
  thought: string;
  intensity: number;
  reframe: string;
}

export interface ActUrgeSurf {
  id?: string;
  timestamp: string;
  durationMinutes: number;
}

export interface MindfulnessLog {
  id?: string;
  timestamp: string;
  type: 'session' | 'rain' | 'bell';
  durationMinutes?: number;
  rainRecognize?: string;
  rainInvestigate?: string;
  satisfactionRating?: number; // 1-10
}

export interface MiReductionLog {
  id?: string;
  date: string; // YYYY-MM-DD
  cigarettesSmoked: number;
  targetCigarettes: number;
}

export interface HabitLoop {
  id?: string;
  timestamp: string;
  cue: string;
  routine: string;
  reward: string;
  replacement: string;
}

export interface HabitLog {
  id?: string;
  timestamp: string;
  behavior: string;
}

export interface InhalerLog {
  id?: string;
  timestamp: string;
  variantUsed: 'warm-bitter' | 'cool-mint' | 'spicy-herbal' | 'none' | 'automatic-bypass';
  context: string[];
  intensityBefore: number;
  intensityAfter: number | null;
  isInhalerAvailable: boolean;
  fallbackMethod: string | null;
  notes?: string;
}

export interface CravingEvent {
  id?: string;
  timestamp: string;
  intensity: number;
  trigger_category: string;
  mood?: string;
  outcome: 'resisted' | 'smoked';
  inhaler_used: boolean;
  notes?: string;
  location_context?: string;
}

export interface JournalEntry {
  id?: string;
  timestamp: string;
  content: string;
  ai_generated_tag?: string;
}

export interface Milestone {
  id?: string;
  key: string;
  timestamp: string;
  title: string;
  description: string;
}

export interface Mission {
  id?: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  status: 'active' | 'completed' | 'failed';
  startDate: string;
  endDate: string;
  relatedMethod?: string;
  reflection?: string;
}

export interface CoachInsightItem {
  id?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: string;
}

export interface AiConversation {
  id?: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  sessionId: string;
  sessionSummary?: string;
}

export interface CachedInsight {
  date: string;
  insight: string;
  type: 'daily_dashboard' | 'analytics_trigger';
}

export interface AnalyticsCache {
  id: string; // singleton 'global'
  triggerDistribution: Record<string, number>;
  moodDistribution: Record<string, { count: number, sumIntensity: number }>;
  peakHours: Record<number, number>;
  totalResisted: number;
  totalSmoked: number;
  lastUpdated: string;
}

export interface SyncQueueItem {
  id?: string;
  table: string;
  payload: any;
  userId: string;
  operation: 'upsert' | 'delete';
  timestamp: string;
}

export class BreatheDatabase extends Dexie {
  users!: Table<UserTable>;
  craving_events!: Table<CravingEvent>;
  journal_entries!: Table<JournalEntry>;
  milestones!: Table<Milestone>;
  ai_conversations!: Table<AiConversation>;
  cached_insights!: Table<CachedInsight>;
  analytics_cache!: Table<AnalyticsCache>;
  cbt_thought_journals!: Table<CbtThoughtJournal>;
  act_urge_surfs!: Table<ActUrgeSurf>;
  mindfulness_logs!: Table<MindfulnessLog>;
  mi_reduction_logs!: Table<MiReductionLog>;
  habit_loops!: Table<HabitLoop>;
  habit_logs!: Table<HabitLog>;
  inhaler_logs!: Table<InhalerLog>;
  missions!: Table<Mission>;
  coach_insights!: Table<CoachInsightItem>;
  sync_queue!: Table<SyncQueueItem>;

  constructor() {
    super('BreatheDB_v2');
    this.version(1).stores({
      users: 'id',
      craving_events: '++id, timestamp, trigger_category, outcome',
      journal_entries: '++id, timestamp',
      milestones: '++id, key',
      ai_conversations: '++id, sessionId, timestamp',
      cached_insights: '[date+type]',
      analytics_cache: 'id'
    });
    this.version(2).stores({
      users: 'id',
      craving_events: '++id, timestamp, trigger_category, outcome',
      journal_entries: '++id, timestamp',
      milestones: '++id, key, timestamp',
      ai_conversations: '++id, sessionId, timestamp',
      cached_insights: '[date+type]',
      analytics_cache: 'id'
    });
    this.version(3).stores({
      users: 'id',
      craving_events: '++id, timestamp, trigger_category, outcome',
      journal_entries: '++id, timestamp',
      milestones: '++id, key, timestamp',
      ai_conversations: '++id, sessionId, timestamp',
      cached_insights: '[date+type]',
      analytics_cache: 'id',
      cbt_thought_journals: '++id, timestamp, situationTag',
      act_urge_surfs: '++id, timestamp'
    });
    this.version(4).stores({
      users: 'id',
      craving_events: '++id, timestamp, trigger_category, outcome',
      journal_entries: '++id, timestamp',
      milestones: '++id, key, timestamp',
      ai_conversations: '++id, sessionId, timestamp',
      cached_insights: '[date+type]',
      analytics_cache: 'id',
      cbt_thought_journals: '++id, timestamp, situationTag',
      act_urge_surfs: '++id, timestamp',
      mindfulness_logs: '++id, timestamp, type',
      mi_reduction_logs: '++id, date',
      habit_loops: '++id, timestamp',
      habit_logs: '++id, timestamp'
    });
    this.version(5).stores({
      users: 'id',
      craving_events: '++id, timestamp, trigger_category, outcome',
      journal_entries: '++id, timestamp',
      milestones: '++id, key, timestamp',
      ai_conversations: '++id, sessionId, timestamp',
      cached_insights: '[date+type]',
      analytics_cache: 'id',
      cbt_thought_journals: '++id, timestamp, situationTag',
      act_urge_surfs: '++id, timestamp',
      mindfulness_logs: '++id, timestamp, type',
      mi_reduction_logs: '++id, date',
      habit_loops: '++id, timestamp',
      habit_logs: '++id, timestamp',
      inhaler_logs: '++id, timestamp, variantUsed'
    });
    this.version(7).stores({
      users: 'id',
      craving_events: '++id, timestamp, trigger_category, outcome',
      journal_entries: '++id, timestamp',
      milestones: '++id, key, timestamp',
      ai_conversations: '++id, sessionId, timestamp',
      cached_insights: '[date+type]',
      analytics_cache: 'id',
      cbt_thought_journals: '++id, timestamp, situationTag',
      act_urge_surfs: '++id, timestamp',
      mindfulness_logs: '++id, timestamp, type',
      mi_reduction_logs: '++id, date',
      habit_loops: '++id, timestamp',
      habit_logs: '++id, timestamp',
      inhaler_logs: '++id, timestamp, variantUsed',
      missions: '++id, status',
      coach_insights: '++id, timestamp, isRead'
    });
    this.version(8).stores({
      users: 'id',
      craving_events: '++id, timestamp, trigger_category, outcome',
      journal_entries: '++id, timestamp',
      milestones: '++id, key, timestamp',
      ai_conversations: '++id, sessionId, timestamp',
      cached_insights: '[date+type]',
      analytics_cache: 'id',
      cbt_thought_journals: '++id, timestamp, situationTag',
      act_urge_surfs: '++id, timestamp',
      mindfulness_logs: '++id, timestamp, type',
      mi_reduction_logs: '++id, date',
      habit_loops: '++id, timestamp',
      habit_logs: '++id, timestamp',
      inhaler_logs: '++id, timestamp, variantUsed',
      missions: '++id, status',
      coach_insights: '++id, timestamp, isRead',
      sync_queue: '++id, timestamp'
    });
  }
}

export const db = new BreatheDatabase();
