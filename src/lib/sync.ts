import { supabase } from './supabase';
import { db } from './db';

// Using a simplified mapping to write to Supabase
export async function pushToSupabase(table: string, payload: any, userId: string) {
  if (!supabase || !userId) return null;
  // payload might have camelCase from Dexie, we need to convert to snake_case for Supabase
  try {
    const { id, ...rest } = payload;
    let mapped: any = { user_id: userId };
    
    // profile table uses `id` for primary key instead of user_id constraint sometimes, so if table is profiles, ensure `id` is pushed. 
    // actually, our mapped user_id is the reference for the row. But profile ID is user ID.
    if (table === 'profiles') {
       mapped.id = userId;
    }

    // Convert to snake case loosely
    for (const key of Object.keys(rest)) {
      const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      mapped[snake] = rest[key];
    }
    
    if (table !== 'profiles' && id && typeof id === 'string' && id.includes('-')) {
       mapped.id = id;
    }

    const { data: result, error } = await supabase.from(table).upsert(mapped).select().single();
    if (error) {
       console.error(`Error pushing to ${table}:`, error);
       // Add to sync queue for later retry
       await db.sync_queue.add({
         table,
         payload,
         userId,
         operation: 'upsert',
         timestamp: new Date().toISOString()
       });
       return null;
    }
    return result;
  } catch (err) {
    console.error("Push Error (Network?):", err);
    // Queue it
    await db.sync_queue.add({
      table,
      payload,
      userId,
      operation: 'upsert',
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

export async function deleteFromSupabase(table: string, id: string, userId: string) {
  if (!supabase || !userId) return;
  try {
     const { error } = await supabase.from(table).delete().eq('id', id);
     if (error) {
        console.error(`Error deleting from ${table}:`, error);
        await db.sync_queue.add({
           table,
           payload: { id },
           userId,
           operation: 'delete',
           timestamp: new Date().toISOString()
        });
     }
  } catch (err) {
     console.error("Delete Error (Network?):", err);
     await db.sync_queue.add({
        table,
        payload: { id },
        userId,
        operation: 'delete',
        timestamp: new Date().toISOString()
     });
  }
}

export async function processSyncQueue() {
  if (!supabase || !navigator.onLine) return;
  const pending = await db.sync_queue.orderBy('timestamp').toArray();
  if (pending.length === 0) return;

  console.log(`Processing ${pending.length} items in sync queue...`);
  
  for (const item of pending) {
    try {
      const { id: queueId, table, payload, userId, operation } = item;
      
      if (operation === 'upsert') {
         // Transform payload
         const { id, ...rest } = payload;
         let mapped: any = { user_id: userId };
         if (table === 'profiles') mapped.id = userId;

         for (const key of Object.keys(rest)) {
           const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
           mapped[snake] = rest[key];
         }
         
         if (table !== 'profiles' && id && typeof id === 'string' && id.includes('-')) {
            mapped.id = id;
         }

         const { error } = await supabase.from(table).upsert(mapped);
         if (!error && queueId) {
            await db.sync_queue.delete(queueId);
         }
      } else if (operation === 'delete') {
         const { error } = await supabase.from(table).delete().eq('id', payload.id);
         if (!error && queueId) {
            await db.sync_queue.delete(queueId);
         }
      }
    } catch (err) {
      console.error("Failed processing sync queue item:", item, err);
      // Let it remain in the queue
    }
  }
}

export async function pullFromSupabase(userId: string) {
  if (!supabase) return;

  try {
    // Process sync queue first so local edits are pushed to remote 
    // before we pull down and potentially overwrite them.
    await processSyncQueue();

    // 1. Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (profile) {
      db.users.put({
        id: profile.id,
        quitDate: profile.quit_date,
        cigarettesPerDay: profile.cigarettes_per_day,
        yearsSmoking: profile.years_smoking,
        brandStrength: profile.brand_strength,
        timeToFirstSmoke: profile.time_to_first_smoke,
        difficultForbidden: profile.difficult_forbidden,
        ftndScore: profile.ftnd_score,
        dependancyLevel: profile.dependancy_level,
        primaryTriggers: profile.primary_triggers || [],
        mainQuitReason: profile.main_quit_reason || [],
        quitPlanMode: profile.quit_plan_mode,
        programWeeks: profile.program_weeks,
        lastSmoked: profile.last_smoked,
        isOnboarded: profile.is_onboarded,
        quitMethod: profile.quit_method,
        readArticles: profile.read_articles || [],
        bookmarkedArticles: profile.bookmarked_articles || [],
        notificationSettings: profile.notification_settings,
        cbtSosUses: profile.cbt_sos_uses,
        actCoreValues: profile.act_core_values || [],
        actExercisesCompleted: profile.act_exercises_completed || [],
        mindfulnessBellInterval: profile.mindfulness_bell_interval,
        miCigarettesTarget: profile.mi_cigarettes_target,
        miCigarettesSmokedToday: profile.mi_cigarettes_smoked_today,
        miLastLogDate: profile.mi_last_log_date
      } as any);
    }

    // 2. Cravings
    const { data: cravings } = await supabase.from('craving_events').select('*').eq('user_id', userId);
    if (cravings && cravings.length > 0) {
      await db.craving_events.bulkPut(cravings.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        intensity: c.intensity,
        trigger_category: c.trigger_category,
        mood: c.mood,
        outcome: c.outcome,
        inhaler_used: c.inhaler_used,
        notes: c.notes,
        location_context: c.location_context
      })));
    }

    // 3. AI Convos
    const { data: convos } = await supabase.from('ai_conversations').select('*').eq('user_id', userId);
    if (convos && convos.length > 0) {
      await db.ai_conversations.bulkPut(convos.map(c => ({
        id: c.id,
        role: c.role as any,
        content: c.content,
        timestamp: c.timestamp,
        sessionId: c.session_id,
        sessionSummary: c.session_summary
      })));
    }
    
    // 4. Inhaler Logs
    const { data: inhalers } = await supabase.from('inhaler_logs').select('*').eq('user_id', userId);
    if (inhalers && inhalers.length > 0) {
      await db.inhaler_logs.bulkPut(inhalers.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        variantUsed: c.variant_used as any,
        context: c.context || [],
        intensityBefore: c.intensity_before,
        intensityAfter: c.intensity_after,
        isInhalerAvailable: c.is_inhaler_available,
        fallbackMethod: c.fallback_method,
        notes: c.notes
      })));
    }

    // 5. Missions
    const { data: missions } = await supabase.from('missions').select('*').eq('user_id', userId);
    if (missions && missions.length > 0) {
      await db.missions.bulkPut(missions.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        targetCount: m.target_count,
        currentCount: m.current_count,
        status: m.status as any,
        startDate: m.start_date,
        endDate: m.end_date,
        relatedMethod: m.related_method,
        reflection: m.reflection
      })));
    }

    // 6. Milestone
    const { data: milestones } = await supabase.from('milestones').select('*').eq('user_id', userId);
    if (milestones && milestones.length > 0) {
      await db.milestones.bulkPut(milestones.map(m => ({
        id: m.id,
        key: m.key,
        timestamp: m.timestamp,
        title: m.title,
        description: m.description
      })));
    }

    // 7. Coach Insights
    const { data: coachInsights } = await supabase.from('coach_insights').select('*').eq('user_id', userId);
    if (coachInsights && coachInsights.length > 0) {
      await db.coach_insights.bulkPut(coachInsights.map(c => ({
        id: c.id,
        content: c.content,
        timestamp: c.timestamp,
        isRead: c.is_read,
        type: c.type
      })));
    }

    // 8. CBT Thought Journals
    const { data: cbtLogs } = await supabase.from('cbt_thought_journals').select('*').eq('user_id', userId);
    if (cbtLogs && cbtLogs.length > 0) {
      await db.cbt_thought_journals.bulkPut(cbtLogs.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        situation: c.situation,
        situationTag: c.situation_tag,
        thought: c.thought,
        intensity: c.intensity,
        reframe: c.reframe
      })));
    }

    // 9. ACT Urge Surfs
    const { data: actLogs } = await supabase.from('act_urge_surfs').select('*').eq('user_id', userId);
    if (actLogs && actLogs.length > 0) {
      await db.act_urge_surfs.bulkPut(actLogs.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        durationMinutes: c.duration_minutes
      })));
    }

    // 10. Mindfulness Logs
    const { data: mindfulLogs } = await supabase.from('mindfulness_logs').select('*').eq('user_id', userId);
    if (mindfulLogs && mindfulLogs.length > 0) {
      await db.mindfulness_logs.bulkPut(mindfulLogs.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        type: c.type as any,
        durationMinutes: c.duration_minutes,
        rainRecognize: c.rain_recognize,
        rainInvestigate: c.rain_investigate,
        satisfactionRating: c.satisfaction_rating
      })));
    }

    // 11. Habit Loops
    const { data: habitLoopsData } = await supabase.from('habit_loops').select('*').eq('user_id', userId);
    if (habitLoopsData && habitLoopsData.length > 0) {
      await db.habit_loops.bulkPut(habitLoopsData.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        cue: c.cue,
        routine: c.routine,
        reward: c.reward,
        replacement: c.replacement
      })));
    }

    // 12. Habit Logs
    const { data: habitLogsData } = await supabase.from('habit_logs').select('*').eq('user_id', userId);
    if (habitLogsData && habitLogsData.length > 0) {
      await db.habit_logs.bulkPut(habitLogsData.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        behavior: c.behavior
      })));
    }

    // 13. MI Reduction Logs
    const { data: miLogs } = await supabase.from('mi_reduction_logs').select('*').eq('user_id', userId);
    if (miLogs && miLogs.length > 0) {
      await db.mi_reduction_logs.bulkPut(miLogs.map(c => ({
        id: c.id,
        date: c.date,
        cigarettesSmoked: c.cigarettes_smoked,
        targetCigarettes: c.target_cigarettes
      })));
    }

  } catch (err) {
    console.error("Error pulling from supabase:", err);
  }
}
