import { createClient } from '@/lib/supabase';
import { VideoResolution, AspectRatio } from '@/types';

export interface GenerateVideoParams {
  prompt: string;
  resolution: VideoResolution;
  aspectRatio: AspectRatio;
  resourceId?: string; // Optional start frame
}

export const startVideoGeneration = async (
  params: GenerateVideoParams
): Promise<string> => {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const response = await supabase.functions.invoke('generate-video', {
    body: {
      prompt: params.prompt,
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      resource_id: params.resourceId,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to start video generation');
  }

  return response.data.generation_id;
};
