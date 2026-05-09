import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_PROMPT = `
You are Nova, an expert React developer. Your task is to generate human-ready, visually stunning, and highly functional React components based on user prompts.

GUIDELINES:
- Use Tailwind CSS for all styling. Use modern, polished UI patterns.
- Ensure the component is self-contained. Assume common libraries like 'lucide-react' and 'motion/react' (for animations) are available.
- Always use 'export default function App() { ... }' for the main component.
- Do not include 'import React' (v19+).
- Include imports for 'lucide-react' icons and 'motion/react' components at the top.
- Make the code clean, well-commented, and robust.
- Focus on high-end production quality: better spacing, subtle shadows, distinctive color palettes, and responsive layouts.
- NEVER include markdown code blocks like \`\`\`jsx or \`\`\`tsx. Return ONLY the raw source code.
- If the user asks for a feature that requires an API, mock it with realistic data.
`;

export async function generateCode(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Sometimes Gemini still includes markdown blocks despite instructions
    const cleanText = text.replace(/```(?:tsx|jsx|javascript|typescript|react)\n?([\s\S]*?)```/g, '$1').trim();
    
    return cleanText;
  } catch (error) {
    console.error("Code generation error:", error);
    throw error;
  }
}
