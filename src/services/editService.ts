import { createClient } from '@/lib/supabase';
import { ModelTier, Resolution, AspectRatio, VariationCount } from '@/types';

const API_BASE_URL = 'https://erion-api.dorong.net/api';

export interface EditImageParams {
  resourceIds: string[];
  prompt: string;
  modelTier: ModelTier;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  variations: VariationCount;
}

export const uploadSourceImage = async (
  file: File
): Promise<string> => {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `images/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('resources')
    .upload(fileName, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Create resource record
  const { data: resource, error: insertError } = await supabase
    .from('resources')
    .insert({
      user_id: user.id,
      storage_path: fileName,
      mime_type: file.type,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create resource: ${insertError.message}`);
  }

  return resource.id;
};

export const startImageEdit = async (
  params: EditImageParams
): Promise<string> => {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/edit-image`, {
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
      resource_ids: params.resourceIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to start edit');
  }

  const data = await response.json();
  return data.generation_id;
};
