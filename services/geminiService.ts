
import { GoogleGenAI, Type } from "@google/genai";
import { UsageEntry } from "../types";

export const getAIInsights = async (history: UsageEntry[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summaryText = history.slice(0, 30).map(h => 
    `[${new Date(h.timestamp).toLocaleDateString()}] Model: ${h.modelId}, In: ${h.inputTokens}, Out: ${h.outputTokens}, Cost: $${h.cost.toFixed(4)}, Project: ${h.project}`
  ).join('\n');

  const prompt = `
    Analyze this LLM usage log from a developer's multi-model workflow:
    ${summaryText}

    Task:
    - Identify the most "cost-inefficient" project or model pairing.
    - Recommend a model switch for specific projects based on typical use cases (e.g., if a project is high-input/low-output, suggest a model with cheap input).
    - Provide a "Burn Rate" estimation if this pattern continues daily.
    Format as concise, high-impact bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate insights at this moment.";
  }
};

export const extractUsageFromText = async (rawText: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a technical parser. Extract token usage and model information from this snippet.
    It could be a raw JSON response, a terminal log, or a Python print statement.
    Text: "${rawText}"
    
    Guidelines:
    - Map the found model to standard IDs: gpt-4o, gpt-4o-mini, claude-3-5-sonnet, gemini-1-5-pro, gemini-1-5-flash.
    - If it's a local model like Llama, map it to llama-3-1-405b for cost estimation.
    - Return structured JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modelId: { type: Type.STRING },
            inputTokens: { type: Type.NUMBER },
            outputTokens: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER }
          },
          required: ["modelId", "inputTokens", "outputTokens"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};
