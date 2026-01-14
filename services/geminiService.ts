
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async explainExpression(expression: string, result: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Explain the scientific context, formula, or logic behind this calculation: Expression: "${expression}", Result: "${result}". Keep it concise and educational.`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text || "No explanation available.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to get an AI explanation at this moment.";
    }
  }

  async solveWordProblem(problem: string): Promise<{ expression: string; result: string; explanation: string }> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Solve the following mathematical word problem. Provide the final mathematical expression that represents the solution and a brief explanation. Problem: "${problem}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              expression: { type: Type.STRING, description: "The mathematical formula/expression to solve the problem" },
              result: { type: Type.STRING, description: "The final numerical result" },
              explanation: { type: Type.STRING, description: "Step by step logic" }
            },
            required: ["expression", "result", "explanation"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini Error:", error);
      throw new Error("Failed to solve word problem.");
    }
  }
}

export const geminiService = new GeminiService();
