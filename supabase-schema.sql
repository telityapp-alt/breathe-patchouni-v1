-- Supabase Schema for Breathe AI (Phase 2)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE 
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  quit_date TIMESTAMP WITH TIME ZONE,
  cigarettes_per_day INTEGER,
  years_smoking INTEGER,
  brand_strength TEXT,
  time_to_first_smoke TEXT,
  difficult_forbidden BOOLEAN,
  ftnd_score INTEGER,
  dependancy_level TEXT,
  primary_triggers TEXT[],
  main_quit_reason TEXT[],
  quit_plan_mode TEXT,
  program_weeks INTEGER,
  last_smoked TIMESTAMP WITH TIME ZONE,
  is_onboarded BOOLEAN DEFAULT false,
  quit_method TEXT,
  read_articles TEXT[],
  bookmarked_articles TEXT[],
  notification_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRAVING EVENTS
CREATE TABLE public.craving_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  intensity INTEGER,
  trigger_category TEXT,
  mood TEXT,
  outcome TEXT,
  inhaler_used BOOLEAN,
  notes TEXT,
  location_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INHALER LOGS
CREATE TABLE public.inhaler_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  variant_used TEXT,
  context TEXT[],
  intensity_before INTEGER,
  intensity_after INTEGER,
  is_inhaler_available BOOLEAN,
  fallback_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI CONVERSATIONS
CREATE TABLE public.ai_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  role TEXT,
  content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  session_id TEXT,
  session_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MILESTONES
CREATE TABLE public.milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  key TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MISSIONS
CREATE TABLE public.missions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  target_count INTEGER,
  current_count INTEGER,
  status TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  related_method TEXT,
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CBT THOUGHT JOURNALS
CREATE TABLE public.cbt_thought_journals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  situation TEXT,
  situation_tag TEXT,
  thought TEXT,
  intensity INTEGER,
  reframe TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACT URGE SURFS
CREATE TABLE public.act_urge_surfs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MINDFULNESS LOGS
CREATE TABLE public.mindfulness_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT,
  duration_minutes INTEGER,
  rain_recognize TEXT,
  rain_investigate TEXT,
  satisfaction_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MI REDUCTION LOGS
CREATE TABLE public.mi_reduction_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  date TEXT NOT NULL,
  cigarettes_smoked INTEGER,
  target_cigarettes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HABIT LOOPS
CREATE TABLE public.habit_loops (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  cue TEXT,
  routine TEXT,
  reward TEXT,
  replacement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HABIT LOGS
CREATE TABLE public.habit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  behavior TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COACH INSIGHTS
CREATE TABLE public.coach_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SET ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craving_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inhaler_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_thought_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.act_urge_surfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindfulness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mi_reduction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_insights ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own cravings" ON public.craving_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cravings" ON public.craving_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cravings" ON public.craving_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own inhaler logs" ON public.inhaler_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inhaler logs" ON public.inhaler_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inhaler logs" ON public.inhaler_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own AI convos" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI convos" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI convos" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own milestones" ON public.milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own missions" ON public.missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.missions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cbt journals" ON public.cbt_thought_journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cbt journals" ON public.cbt_thought_journals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own act urges" ON public.act_urge_surfs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own act urges" ON public.act_urge_surfs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own mindfulness logs" ON public.mindfulness_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mindfulness logs" ON public.mindfulness_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own mi reduction logs" ON public.mi_reduction_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mi reduction logs" ON public.mi_reduction_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own habit loops" ON public.habit_loops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit loops" ON public.habit_loops FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own habit logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit logs" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own coach insights" ON public.coach_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coach insights" ON public.coach_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coach insights" ON public.coach_insights FOR UPDATE USING (auth.uid() = user_id);

-- FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
