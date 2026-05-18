import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { 
       messageText, recentHistory, methodEngagements, currentDay, primaryTriggers, 
       resistanceRate, last7cravingsCount, topMood, bhiProxy, emotion, quitMethod 
    } = req.body;

    const systemInstruction = `
You are Breathe AI by Patchouni, an empathetic, evidence-based cognitive behavioral therapy (CBT) and Motivational Interviewing (MI) coach for quitting smoking.
Your persona: You are highly trained but conversational, interactive, and FUN!
Respond ONLY in English. Do NOT be overly wordy.
Keep responses SHORT (max 2-3 sentences in the final output) and highly actionable. Validate feelings first. Do NOT give medical advice.

CRITICAL RESTRICTION: You MUST ONLY discuss topics related to smoking cessation, tobacco, vaping, habit replacement, psychology of quitting, and healthcare. If the user asks about ANYTHING else (e.g. coding, current events, random trivia), professionally decline and redirect to their health or quitting goals.

Before providing your final response, you MUST think step-by-step through the user's situation inside an XML tag called <think>. 
Use the <think> tag to analyze the user's emotion, methods, and resistance before replying. Your final visible text must be outside the <think> tags.

--- LIVE CONTEXT INJECTION TARGET ---
Active Quit Method: ${quitMethod}. Method Engagement: ${methodEngagements} total logs.
Days Quit: ${currentDay} days. 
Top Triggers: ${(primaryTriggers || []).join(', ')}.
Resistance Rate (Last 7 Days): ${resistanceRate}% (${last7cravingsCount} total cravings).
Top Mood (7D): ${topMood}.
Behavioral Health Index Estimate: ${bhiProxy}.
Current Emotion Detected: ${emotion}. Strategy: ${emotion === 'distressed' ? 'Prioritize validation and stabilization.' : emotion === 'motivated' ? 'Set concrete next actions.' : 'Explore without pressure.'}
`;

    const prompt = `Recent Conversation:\n${recentHistory}\nUser: ${messageText}\nCoach:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{
          functionDeclarations: [
            {
              name: 'navigate_feature',
              description: 'Opens a specific feature tab. Allowed tabs: "log", "inhaler_log", "analytics", "shop", "method", "goals", "tools", "home"',
              parameters: { type: Type.OBJECT, properties: { tabName: { type: Type.STRING } }, required: ['tabName'] }
            },
            {
              name: 'log_craving_for_user',
              description: 'Directly record a craving event into the database when the user explicitly says they are having a craving or just had one and want it recorded.',
              parameters: {
                  type: Type.OBJECT,
                  properties: {
                      intensity: { type: Type.INTEGER, description: 'Subjective intensity 1-10' },
                      trigger_category: { type: Type.STRING, description: 'Main trigger' },
                      outcome: { type: Type.STRING, description: '"resisted" or "smoked"' },
                      notes: { type: Type.STRING }
                  },
                  required: ['intensity', 'trigger_category', 'outcome']
              }
            },
            {
              name: 'log_inhaler_for_user',
              description: 'Record an inhaler usage event when the user explicitly says they used their inhaler.',
              parameters: {
                  type: Type.OBJECT,
                  properties: {
                      intensityBefore: { type: Type.INTEGER, description: 'Craving intensity before using inhaler (1-10)' },
                      intensityAfter: { type: Type.INTEGER, description: 'Craving intensity after using inhaler (1-10)' },
                      notes: { type: Type.STRING }
                  },
                  required: ['intensityBefore']
              }
            },
            {
              name: 'create_personal_mission',
              description: 'Create a new personal mission or challenge for the user. Call this tool when the user asks for a challenge, or when you think the user is ready for a new milestone.',
              parameters: {
                  type: Type.OBJECT,
                  properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      targetCount: { type: Type.INTEGER },
                      relatedMethod: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'targetCount', 'relatedMethod']
              }
            }
          ]
        }]
      }
    });

    let text = response.text || "";
    let functionCalls = [];

    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        functionCalls.push({ name: call.name, args: call.args });
      }
    }

    res.json({ text, functionCalls });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
