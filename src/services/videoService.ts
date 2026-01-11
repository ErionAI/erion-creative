import { VideoResolution, AspectRatio } from "@/types";

export const generateVideo = async (
  prompt: string,
  sourceImage?: { data: string; mimeType: string },
  resolution: VideoResolution = '720p',
  aspectRatio: AspectRatio = '16:9'
): Promise<string> => {
  const response = await fetch('/api/creative/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      sourceImage,
      resolution,
      aspectRatio
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate video');
  }

  return data.result;
};
