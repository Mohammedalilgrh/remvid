import { GoogleGenAI, Modality, Type } from "@google/genai";

const getAI = () =>
  new GoogleGenAI({
    apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || "",
  });

export interface Scene {
  text: string;
  emphasis: string;
  keywords: string;
  duration: number;
}

export interface Script {
  text: string;
  scenes: Scene[];
}

export async function generateScripts(niche: string, count: number): Promise<Script[]> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are creating viral short-form video scripts for the niche: "${niche}".

EXACT STYLE REFERENCE (copy this style precisely):
- Narrator says: "stop selling your product. start selling the outcome. if you're selling flights to aspen, don't sell the plane ride. sell the feeling of fresh mountain air. of crisp powder. of skiing the slopes. they're not buying a seat on a plane. they're buying a feeling."
- This is ONE confident narrator voice. Fast paced. Conversational. Punchy. No fluff.
- Total duration: 12-18 seconds.

SCRIPT RULES:
1. Single narrator voice only. No speakers A/B labels.
2. Hook: Start with a bold command or contradiction ("stop X. start Y." format)
3. Flow: Problem → Pivot → Vivid sensory example → Punchline truth
4. Use specific concrete examples (brand names, places, sensory details)
5. Pacing: short punchy phrases. Every 0.8-1.5 seconds = new scene/caption
6. NO generic advice. Be specific and vivid.

CAPTION RULES (shown on screen):
- Each scene = 2-5 words MAX (what will appear on screen at that moment)
- emphasis = ONE word per scene that gets highlighted in CYAN UPPERCASE
- The caption text is what is SPOKEN during that scene
- Keywords = specific cinematic stock footage search terms

SCENE COUNT: 10-16 scenes per video.

Generate ${count} complete video scripts now.

Return ONLY valid JSON array, no markdown.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "Full spoken narration text concatenated"
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description: "2-5 word caption shown on screen (what is spoken)"
                    },
                    emphasis: {
                      type: Type.STRING,
                      description: "Single word to highlight in cyan uppercase"
                    },
                    keywords: {
                      type: Type.STRING,
                      description: "Specific Pexels video search query"
                    },
                    duration: {
                      type: Type.NUMBER,
                      description: "Duration in seconds, between 0.8 and 1.5"
                    }
                  },
                  required: ["text", "emphasis", "keywords", "duration"]
                }
              }
            },
            required: ["text", "scenes"]
          }
        }
      }
    });

    const raw = JSON.parse(response.text || "[]");
    return raw as Script[];
  } catch (e: any) {
    console.error("Script generation failed:", e);
    throw new Error("AI script generation failed: " + (e?.message || "unknown error"));
  }
}

export async function generateTTS(script: Script): Promise<string> {
  const ai = getAI();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script.text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }
          }
        }
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from TTS");

    return buildWavDataUrl(base64Audio, 24000);
  } catch (e: any) {
    console.error("TTS generation failed:", e);
    throw new Error("Voiceover generation failed: " + (e?.message || "unknown error"));
  }
}

function buildWavDataUrl(base64Pcm: string, sampleRate: number): string {
  const binary = window.atob(base64Pcm);
  const len = binary.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + len, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, len, true);

  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, binary.charCodeAt(i));
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}
