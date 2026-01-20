import { createClient } from '@/lib/supabase';
import { VideoResolution, AspectRatio } from '@/types';

const API_BASE_URL = 'https://erion-api.dorong.net/api';

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

  const response = await fetch(`${API_BASE_URL}/generate-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      resource_id: params.resourceId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to start video generation');
  }

  const data = await response.json();
  return data.generation_id;
};
