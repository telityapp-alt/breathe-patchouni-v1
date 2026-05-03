import fs from 'fs';
import path from 'path';

function run() {
  const file = path.resolve('src/store/AppContext.tsx');
  let c = fs.readFileSync(file, 'utf8');

  // helper to replace a function
  c = c.replace(/const addCraving = async .*?=> \{([\s\S]*?)\n  \};/m, (all, body) => {
    return all.replace(body, body + `\n    if (user?.id) {\n      const res = await pushToSupabase('craving_events', log, user.id);\n      if (res && res.id) {\n        // sync id back if we cared\n      }\n    }`);
  });

  c = c.replace(/const addChatMessage = async \(msg:.*?\) => \{([\s\S]*?)\};/m,
    `const addChatMessage = async (msg: Omit<AiConversation, 'id'>) => {
    await db.ai_conversations.add(msg as AiConversation);
    if (user?.id) await pushToSupabase('ai_conversations', msg, user.id);
  };`);

  c = c.replace(/const addCbtJournal = async \(entry:.*?\) => \{([\s\S]*?)\};/m,
    `const addCbtJournal = async (entry: Omit<CbtThoughtJournal, 'id'>) => {
    await db.cbt_thought_journals.add(entry as CbtThoughtJournal);
    if (user?.id) await pushToSupabase('cbt_thought_journals', entry, user.id);
  };`);

  c = c.replace(/const addActUrgeSurf = async \(entry:.*?\) => \{([\s\S]*?)\};/m,
    `const addActUrgeSurf = async (entry: Omit<ActUrgeSurf, 'id'>) => {
    await db.act_urge_surfs.add(entry as ActUrgeSurf);
    if (user?.id) await pushToSupabase('act_urge_surfs', entry, user.id);
  };`);

  c = c.replace(/const addMindfulnessLog = async \(entry:.*?\) => \{([\s\S]*?)\};/m,
    `const addMindfulnessLog = async (entry: Omit<MindfulnessLog, 'id'>) => {
    await db.mindfulness_logs.add(entry as MindfulnessLog);
    if (user?.id) await pushToSupabase('mindfulness_logs', entry, user.id);
  };`);

  c = c.replace(/const addMiReductionLog = async \(entry:.*?\) => \{([\s\S]*?)\};/m,
    `const addMiReductionLog = async (entry: Omit<MiReductionLog, 'id'>) => {
    await db.mi_reduction_logs.add(entry as MiReductionLog);
    if (user?.id) await pushToSupabase('mi_reduction_logs', entry, user.id);
  };`);

  c = c.replace(/const saveHabitLoop = async \(entry:.*?\) => \{([\s\S]*?)\};/m,
    `const saveHabitLoop = async (entry: Partial<HabitLoop>) => {
    if (entry.id) {
       await db.habit_loops.update(entry.id, entry);
    } else {
       await db.habit_loops.add(entry as HabitLoop);
    }
    if (user?.id) await pushToSupabase('habit_loops', entry, user.id);
  };`);

  c = c.replace(/const addHabitLog = async \(entry:.*?\) => \{([\s\S]*?)\};/m,
    `const addHabitLog = async (entry: Omit<HabitLog, 'id'>) => {
    await db.habit_logs.add(entry as HabitLog);
    if (user?.id) await pushToSupabase('habit_logs', entry, user.id);
  };`);

  c = c.replace(/const addInhalerLog = async \(entry:.*?\) => \{([\s\S]*?)\};/m,
    `const addInhalerLog = async (entry: Omit<InhalerLog, 'id'>) => {
    await db.inhaler_logs.add(entry as InhalerLog);
    if (user?.id) await pushToSupabase('inhaler_logs', entry, user.id);
  };`);

  c = c.replace(/const updateInhalerLog = async \(id:.*?\) => \{([\s\S]*?)\};/m,
    `const updateInhalerLog = async (id: string, updates: Partial<InhalerLog>) => {
    await db.inhaler_logs.update(id, updates);
    if (user?.id) await pushToSupabase('inhaler_logs', { id, ...updates }, user.id);
  };`);

  c = c.replace(/const addMission = async \(mission:.*?\) => \{([\s\S]*?)\};/m,
    `const addMission = async (mission: Omit<Mission, 'id'>) => {
    await db.missions.add(mission as Mission);
    if (user?.id) await pushToSupabase('missions', mission, user.id);
  };`);

  c = c.replace(/const updateMission = async \(id:.*?\) => \{([\s\S]*?)\};/m,
    `const updateMission = async (id: string, updates: Partial<Mission>) => {
    await db.missions.update(id, updates);
    if (user?.id) await pushToSupabase('missions', { id, ...updates }, user.id);
  };`);
  
  c = c.replace(/const addCoachInsight = async \(insight:.*?\) => \{([\s\S]*?)\};/m,
    `const addCoachInsight = async (insight: Omit<CoachInsightItem, 'id'>) => {
    await db.coach_insights.add(insight as CoachInsightItem);
    if (user?.id) await pushToSupabase('coach_insights', insight, user.id);
  };`);
  
  c = c.replace(/const markInsightRead = async \(id:.*?\) => \{([\s\S]*?)\};/m,
    `const markInsightRead = async (id: string) => {
    await db.coach_insights.update(id, { isRead: true });
    if (user?.id) await pushToSupabase('coach_insights', { id, isRead: true }, user.id);
  };`);

  // milestone inside checkMilestones
  c = c.replace(/await db\.milestones\.add\(unlocked\);/g, `await db.milestones.add(unlocked);
               if (user?.id) await pushToSupabase('milestones', unlocked, user.id);`);

  fs.writeFileSync(file, c);
}

run();
