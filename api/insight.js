import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { statsContext } = req.body;

    const systemInstruction = `You are a strict, concise smoking cessation coach. Generate a short 2-3 sentence insight based on this data. Emphasize their method and point out positive trends. No generic lines. Use emojis sparingly.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this data: ${statsContext}`,
      config: { systemInstruction }
    });

    res.json({ content: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
