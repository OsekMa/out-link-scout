import { GoogleGenAI, Type } from "@google/genai";
import { LinkData } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const categorizeLinks = async (links: LinkData[]): Promise<Map<string, string>> => {
  const ai = getAiClient();
  
  // We process unique hostnames to save tokens and time
  const uniqueHostnames = Array.from(new Set(links.map(l => l.hostname)));
  
  // Batch processing could be done here if list is huge, but for now we limit to top 50 unique domains
  const hostnamesToAnalyze = uniqueHostnames.slice(0, 50);

  const prompt = `
    You are a web categorization expert. 
    Classify the following domain names into short, single-word or two-word categories (e.g., "Social Media", "News", "E-commerce", "Tech", "Government", "Ads", "Unknown").
    
    Domains:
    ${hostnamesToAnalyze.join(', ')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  domain: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ['domain', 'category']
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) return new Map();

    const parsed = JSON.parse(resultText);
    const map = new Map<string, string>();
    
    if (parsed.classifications && Array.isArray(parsed.classifications)) {
      parsed.classifications.forEach((item: any) => {
        map.set(item.domain, item.category);
      });
    }

    return map;

  } catch (error) {
    console.error("Gemini categorization failed:", error);
    throw error;
  }
};
