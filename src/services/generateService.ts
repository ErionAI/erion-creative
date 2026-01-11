import { ModelTier, Resolution, AspectRatio, VariationCount } from "@/types";

export const generateImage = async (
  prompt: string,
  modelTier: ModelTier = 'Basic',
  resolution: Resolution = '1K',
  aspectRatio: AspectRatio = '1:1',
  variations: VariationCount = 1
): Promise<string[]> => {
  const response = await fetch('/api/creative/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      modelTier,
      resolution,
      aspectRatio,
      variations
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate image');
  }

  return data.results;
};
