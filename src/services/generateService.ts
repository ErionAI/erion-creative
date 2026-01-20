import { createClient } from '@/lib/supabase';
import { ModelTier, Resolution, AspectRatio, VariationCount } from '@/types';

const API_BASE_URL = 'https://erion-api.dorong.net/api';

export interface GenerateImageParams {
  prompt: string;
  modelTier: ModelTier;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  variations: VariationCount;
}

export const startImageGeneration = async (
  params: GenerateImageParams
): Promise<string> => {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      model_tier: params.modelTier,
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      variations: params.variations,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to start generation');
  }

  const data = await response.json();
  return data.generation_id;
};
