export type DependancyLevel = 'low' | 'medium' | 'high';

export type QuitMethod = 'cbt' | 'act' | 'mindfulness' | 'mi' | 'habit';

export interface UserProfile {
  cigarettesPerDay: number;
  yearsSmoking: number;
  usualBrand: string;
  primaryTriggers: string[];
  mainQuitReason: string;
  ftndScore: number;
  dependancyLevel: DependancyLevel;
  quitDate: string;
  isOnboarded: boolean;
  quitMethod?: QuitMethod;
}

export type CravingContext =
  | 'after_meal'
  | 'stressed'
  | 'bored'
  | 'social'
  | 'waking_up'
  | 'working'
  | 'drinking_coffee'
  | 'other';

export type Mood = 'happy' | 'stressed' | 'anxious' | 'bored' | 'sad';

export interface CravingLog {
  id: string;
  timestamp: string;
  intensity: number; // 1-10
  context: CravingContext;
  mood: Mood;
  resisted: boolean;
  inhalerUsed: boolean;
  location?: string;
  note?: string;
  autoLogged?: boolean;
}

export interface InhalerSession {
  id: string;
  timestamp: string;
  durationSeconds: number;
  deviceId: string;
}

export interface DailyInsight {
  date: string;
  insight: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface AppState {
  profile: UserProfile | null;
  cravings: CravingLog[];
  inhalerSessions: InhalerSession[];
  messages: ChatMessage[];
  lastInsight: DailyInsight | null;
}
