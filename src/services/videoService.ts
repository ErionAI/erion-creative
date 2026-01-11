import { GoogleGenAI } from "@google/genai";
import { VideoResolution, AspectRatio } from "@/types";

/**
 * Maps a requested aspect ratio to one supported by Veo.
 * Supported: '16:9', '9:16'
 */
const getSupportedVideoRatio = (requested: AspectRatio): string => {
  const wideRatios = ['16:9', '4:3', '5:4', '1:1'];
  return wideRatios.includes(requested) ? '16:9' : '9:16';
};

/**
 * Generates a video using Google Veo model.
 */
export const generateVideo = async (
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
      aspectRatio: getSupportedVideoRatio(aspectRatio)
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
