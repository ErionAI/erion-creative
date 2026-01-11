import { createClient } from '@/lib/supabase';
import { ModelTier, Resolution, AspectRatio, VariationCount } from '@/types';

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

  const response = await supabase.functions.invoke('generate-image', {
    body: {
      prompt: params.prompt,
      model_tier: params.modelTier,
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      variations: params.variations,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to start generation');
  }

  return response.data.generation_id;
};
