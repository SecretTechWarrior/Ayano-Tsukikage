import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "./shadow-persona.js";
import { logger } from "./logger.js";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY not set");

const genAI = new GoogleGenerativeAI(apiKey);

export async function chat(
  history: { role: "user" | "model"; content: string }[],
  userMessage: string,
  contextNote?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT + (contextNote ? `\n\nContext: ${contextNote}` : ""),
      generationConfig: { maxOutputTokens: 1024, temperature: 0.85 },
    });

    const geminiHistory: Content[] = history.slice(-20).map((h) => ({
      role: h.role,
      parts: [{ text: h.content }],
    }));

    const chatSession = model.startChat({ history: geminiHistory });
    const result = await chatSession.sendMessage(userMessage);
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Gemini AI error");
    return "…The shadows whisper of a disruption. My connection to the cosmic network falters momentarily. Try again, subordinate.";
  }
}

export async function summarize(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Summarize the following text concisely in 3-5 bullet points:\n\n${text}`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Summarize error");
    return "Summary unavailable.";
  }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Translate the following text to ${targetLang}. Return ONLY the translation, nothing else:\n\n${text}`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Translate error");
    return "Translation unavailable.";
  }
}

export async function correctGrammar(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Fix the grammar and spelling of this text. Return ONLY the corrected text:\n\n${text}`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Grammar check error");
    return "Grammar check unavailable.";
  }
}

export async function generateStory(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Write a short, engaging story (200-300 words) based on this prompt: ${prompt}`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Story generation error");
    return "Story generation unavailable.";
  }
}

export async function generatePoem(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Write a beautiful, creative poem about: ${prompt}. Make it 8-16 lines.`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Poem generation error");
    return "Poem generation unavailable.";
  }
}

export async function roast(name: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Write a playful, lighthearted, FUNNY roast of someone named ${name}. Keep it fun and not genuinely mean. 2-3 sentences max.`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Roast generation error");
    return "Roast generation unavailable.";
  }
}

export async function compliment(name: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Write a genuine, creative, heartfelt compliment for someone named ${name}. 1-2 sentences.`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Compliment generation error");
    return "Compliment generation unavailable.";
  }
}

export async function analyzeImage(base64Image: string, mimeType: string, prompt?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      { inlineData: { data: base64Image, mimeType } },
      prompt ?? "Describe this image in detail.",
    ]);
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "Image analysis error");
    return "Image analysis unavailable.";
  }
}

export async function answerQuestion(question: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Answer this question concisely and accurately: ${question}`
    );
    return result.response.text();
  } catch (err) {
    logger.error({ err }, "QA error");
    return "Answer unavailable.";
  }
}
