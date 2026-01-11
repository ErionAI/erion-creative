import { createClient } from '@/lib/supabase';
import { ModelTier, Resolution, AspectRatio, VariationCount } from '@/types';

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

  const response = await supabase.functions.invoke('edit-image', {
    body: {
      prompt: params.prompt,
      model_tier: params.modelTier,
      resolution: params.resolution,
      aspect_ratio: params.aspectRatio,
      variations: params.variations,
      resource_ids: params.resourceIds,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || 'Failed to start edit');
  }

  return response.data.generation_id;
};
