
import { GoogleGenAI } from "@google/genai";
import { Resolution, VideoResolution, AspectRatio } from "@/types";

/**
 * Maps a requested aspect ratio to one supported by the API to prevent 400 errors.
 * Supported by Gemini: '1:1', '3:4', '4:3', '9:16', '16:9'
 * Supported by Veo: '16:9', '9:16'
 */
const getSupportedRatio = (requested: AspectRatio, modelType: 'IMAGE' | 'VIDEO'): string => {
  if (modelType === 'VIDEO') {
    // Veo is strict: 16:9 or 9:16
    const wideRatios = ['16:9', '4:3', '5:4', '1:1'];
    return wideRatios.includes(requested) ? '16:9' : '9:16';
  }

  // Image Ratios
  const imageSupported = ['1:1', '3:4', '4:3', '9:16', '16:9'];
  if (imageSupported.includes(requested)) return requested;

  const mapping: Record<string, string> = {
    '4:5': '3:4',
    '5:4': '4:3',
    '9:21': '9:16'
  };
  return mapping[requested] || '1:1';
};

/**
 * Generates 4 variations of images using Gemini models.
 */
export const generateImageWithGemini = async (
  images: { data: string; mimeType: string }[],
  prompt: string,
  resolution: Resolution = '1K',
  aspectRatio: AspectRatio = '1:1'
): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const isPro = resolution === '2K' || resolution === '4K';
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
      imageConfig: {
        aspectRatio: getSupportedRatio(aspectRatio, 'IMAGE')
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

    const results = await Promise.all([1, 2, 3, 4].map(() => generateSingle()));
    const successfulUrls = results.filter((url): url is string => url !== null);

    if (successfulUrls.length === 0) throw new Error("Failed to generate any images.");
    return successfulUrls;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

/**
 * Generates a video using Google Veo model.
 */
export const generateVideoWithVeo = async (
  prompt: string,
  sourceImage?: { data: string; mimeType: string },
  resolution: VideoResolution = '720p',
  aspectRatio: AspectRatio = '16:9'
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: getSupportedRatio(aspectRatio, 'VIDEO')
    };

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: sourceImage ? {
        imageBytes: sourceImage.data,
        mimeType: sourceImage.mimeType
      } : undefined,
      config: videoConfig
    });

    // Polling for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: No download link returned.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error("Error generating video with Veo:", error);
    if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API Key mismatch or invalid project. Please re-select your Paid API Key.");
    }
    throw error;
  }
};
