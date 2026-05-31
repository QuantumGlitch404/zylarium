import { GoogleGenAI } from "@google/genai";

// Google AI Studio Configuration
const API_KEY = "AIzaSyANqE-hy1JYvoWnedhd8Q5PI6R7oo8Qr0E";
const MODEL_NAME = "gemini-2.0-flash";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateResumeSummary = async (role: string, skills: string[]): Promise<string> => {
  const ai = getAIClient();

  try {
    const prompt = `Write a professional 2-3 sentence resume summary for a ${role} with skills in ${skills.join(', ')}. Keep it impactful and professional.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return `Error: ${error.message || 'Unknown error'}`;
  }
};

export const suggestHustles = async (skills: string[]): Promise<string> => {
  const ai = getAIClient();

  try {
    const prompt = `Suggest 3 specific side hustles for someone with these skills: ${skills.join(', ')}. Return just the titles separated by commas.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Consulting, Freelancing, Tutoring";
  } catch (error: any) {
    console.error("Hustle Suggestion Error:", error);
    return "Consulting, Freelancing, Tutoring";
  }
};

interface SummaryOptions {
  length: 'very_short' | 'short' | 'medium' | 'detailed';
  style: 'bullet_points' | 'paragraph' | 'key_takeaways' | 'exam_notes';
  tone: 'neutral' | 'academic' | 'simple';
}

export const summarizeText = async (text: string, options?: SummaryOptions): Promise<string> => {
  const ai = getAIClient();

  try {
    const lengthMap = {
      very_short: "1-2 sentences",
      short: "1 concise paragraph",
      medium: "2-3 paragraphs",
      detailed: "comprehensive detail"
    };

    const styleMap = {
      bullet_points: "Use bullet points for main ideas.",
      paragraph: "Use coherent paragraphs.",
      key_takeaways: "Focus on 3-5 key actionable takeaways.",
      exam_notes: "Format as study notes with definitions and key concepts highlighted."
    };

    const toneMap = {
      neutral: "Maintain a neutral, objective tone.",
      academic: "Use academic language and structured argumentation.",
      simple: "Use simple English suitable for a general audience."
    };

    const length = options ? lengthMap[options.length] : "concise";
    const style = options ? styleMap[options.style] : "professional summary";
    const tone = options ? toneMap[options.tone] : "neutral tone";

    const prompt = `You are a professional editor. Summarize the following text.
    
Configuration:
- Length: ${length}
- Style: ${style}
- Tone: ${tone}

Focus on clarity, structure, and factual preservation.

TEXT TO SUMMARIZE:
${text}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Could not summarize.";
  } catch (error: any) {
    console.error("Summarization Error:", error);
    return `Error summarizing text: ${error.message || 'Unknown error'}`;
  }
};

export const summarizeBook = async (text: string, type: 'chapter' | 'full' = 'full'): Promise<string> => {
  const ai = getAIClient();

  try {
    const context = text.length > 50000 ? text.substring(0, 50000) + "... [truncated]" : text;

    let prompt = "";
    if (type === 'chapter') {
      prompt = `Analyze the following chapter text. Provide a summary that includes:
1. **Chapter Core Info**: What happens in this section.
2. **Key Concepts**: Important ideas or terms.
3. **Timeline**: Sequential events.

Text: ${context}`;
    } else {
      prompt = `Analyze the following text (book or document) and provide a comprehensive, professional summary. 

Structure your response as follows:
1. **Executive Summary**: A concise overview.
2. **Key Themes & Arguments**: The main points discussed.
3. **Critical Details**: Important specific information.
4. **Conclusion**: The final takeaway.

Text Content: 
${context}`;
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Could not summarize content.";
  } catch (error: any) {
    console.error("Book Summary Error:", error);
    return `Error: ${error.message || "Failed to summarize"}`;
  }
};

export const formatVoiceNotes = async (transcription: string, type: 'clean' | 'summary' | 'action_items' = 'clean'): Promise<string> => {
  const ai = getAIClient();

  try {
    let instruction = "Format this transcription into a clean, organized document. Fix grammar and punctuation.";
    if (type === 'summary') instruction = "Summarize this transcription into key points and main ideas.";
    if (type === 'action_items') instruction = "Extract action items, tasks, and deadlines from this transcription.";

    const prompt = `${instruction}
        
Raw Transcription:
${transcription}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Could not format notes.";
  } catch (error: any) {
    console.error("Voice Note Error:", error);
    return `Error: ${error.message}`;
  }
};

interface TranslationOptions {
  formality: 'informal' | 'neutral' | 'formal';
}

export const translateText = async (text: string, sourceLang: string, targetLang: string, options?: TranslationOptions): Promise<string> => {
  const ai = getAIClient();

  try {
    const formality = options?.formality || 'neutral';

    const prompt = `Act as a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. 

Requirements:
- Tone/Formality: ${formality}
- Priority: Accuracy over literal word-for-word translation.
- Context: Preserve cultural and contextual nuances.

Only return the translated text. Do not add explanations.

Text:
${text}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Translation failed.";
  } catch (error: any) {
    console.error("Translation Error:", error);
    return `Translation Error: ${error.message}`;
  }
};

export const transcribeAudioFile = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAIClient();

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: "Transcribe this audio file verbatim. Identify speakers if multiple (Speaker 1, Speaker 2, etc). Format content cleanly with clear paragraph breaks." }
        ]
      }
    });
    return response.text || "Transcription failed or empty.";
  } catch (error: any) {
    console.error("Transcription Error:", error);
    return `Error transcribing audio: ${error.message}`;
  }
};