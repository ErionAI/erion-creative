import { GoogleGenAI } from "@google/genai";
import { ModelTier, Resolution, AspectRatio, VariationCount } from "@/types";

/**
 * Maps a requested aspect ratio to one supported by Gemini image generation.
 * Supported: '1:1', '3:4', '4:3', '9:16', '16:9'
 */
const getSupportedImageRatio = (requested: AspectRatio): string => {
  const supported = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  if (supported.includes(requested)) return requested;

  const mapping: Record<string, string> = {
    '4:5': '3:4',
    '5:4': '4:3',
    '9:21': '9:16'
  };
  return mapping[requested] || '1:1';
};

/**
 * Edits images using Gemini models with source images and prompt.
 */
export const editImage = async (
  images: { data: string; mimeType: string }[],
  prompt: string,
  modelTier: ModelTier = 'Basic',
  resolution: Resolution = '1K',
  aspectRatio: AspectRatio = '1:1',
  variations: VariationCount = 1
): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const isPro = modelTier === 'Pro';
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
      imageConfig: {
        aspectRatio: getSupportedImageRatio(aspectRatio)
      }
    };

    if (isPro) {
      config.imageConfig.imageSize = resolution;
      config.tools = [{ googleSearch: {} }];
    }

    const imageParts = images.map(img => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType,
      },
    }));

    const generateSingle = async (): Promise<string | null> => {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: {
            parts: [
              ...imageParts,
              { text: prompt },
            ],
          },
          config: config
        });

        if (!response.candidates || response.candidates.length === 0) return null;

        const candidate = response.candidates[0];
        const parts = candidate.content?.parts;
        if (!parts) return null;

        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const resultMimeType = part.inlineData.mimeType || 'image/png';
            return `data:${resultMimeType};base64,${part.inlineData.data}`;
          }
        }
        return null;
      } catch (e) {
        console.warn("Single generation failed:", e);
        return null;
      }
    };

    const results = await Promise.all(Array.from({ length: variations }, () => generateSingle()));
    const successfulUrls = results.filter((url): url is string => url !== null);

    if (successfulUrls.length === 0) throw new Error("Failed to generate any images.");
    return successfulUrls;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
