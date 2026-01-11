import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.35.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient, getSupabaseClient } from '../_shared/supabase.ts';

interface RequestBody {
  prompt: string;
  model_tier: 'Basic' | 'Pro';
  resolution: string;
  aspect_ratio: string;
  variations: number;
  resource_ids: string[]; // IDs of uploaded resources
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = getSupabaseClient(authHeader);
    const serviceClient = getServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { prompt, model_tier, resolution, aspect_ratio, variations, resource_ids } = body;

    // Create generation record
    const { data: generation, error: insertError } = await serviceClient
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'edit',
        status: 'pending',
        prompt,
        resolution,
        aspect_ratio,
        model_tier,
        variations,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create generation: ${insertError.message}`);
    }

    // Link resources to generation
    if (resource_ids.length > 0) {
      await serviceClient
        .from('resources')
        .update({ generation_id: generation.id })
        .in('id', resource_ids);
    }

    const response = new Response(
      JSON.stringify({ generation_id: generation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    EdgeRuntime.waitUntil(processEdit(serviceClient, generation.id, body, user.id, resource_ids));

    return response;
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processEdit(
  supabase: any,
  generationId: string,
  body: RequestBody,
  userId: string,
  resourceIds: string[]
) {
  try {
    await supabase
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

    // Get resource storage paths
    const { data: resources } = await supabase
      .from('resources')
      .select('storage_path, mime_type')
      .in('id', resourceIds);

    if (!resources || resources.length === 0) {
      throw new Error('No source images found');
    }

    // Download source images
    const sourceImages: { data: string; mimeType: string }[] = [];
    for (const resource of resources) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('resource')
        .download(resource.storage_path);

      if (downloadError) {
        console.error('Download error:', downloadError);
        continue;
      }

      const buffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      sourceImages.push({ data: base64, mimeType: resource.mime_type });
    }

    if (sourceImages.length === 0) {
      throw new Error('Failed to load source images');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const ai = new GoogleGenAI({ apiKey });
    const isPro = body.model_tier === 'Pro';
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
      imageConfig: { aspectRatio: body.aspect_ratio },
    };

    if (isPro) {
      config.imageConfig.imageSize = body.resolution;
      config.tools = [{ googleSearch: {} }];
    }

    const generateSingle = async (): Promise<string | null> => {
      try {
        const imageParts = sourceImages.map(img => ({
          inlineData: { data: img.data, mimeType: img.mimeType },
        }));

        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [...imageParts, { text: body.prompt }],
          },
          config,
        });

        if (!response.candidates || response.candidates.length === 0) return null;
        const parts = response.candidates[0].content?.parts;
        if (!parts) return null;

        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
        return null;
      } catch (e) {
        console.warn('Single edit failed:', e);
        return null;
      }
    };

    const results = await Promise.all(
      Array.from({ length: body.variations }, () => generateSingle())
    );
    const successfulResults = results.filter((r): r is string => r !== null);

    if (successfulResults.length === 0) {
      throw new Error('Failed to edit any images');
    }

    const resultUrls: string[] = [];
    for (let i = 0; i < successfulResults.length; i++) {
      const base64Data = successfulResults[i];
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const path = `images/${userId}/${generationId}/${i}.png`;

      const { error: uploadError } = await supabase.storage
        .from('asset')
        .upload(path, buffer, { contentType: 'image/png' });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from('asset').getPublicUrl(path);
      resultUrls.push(urlData.publicUrl);
    }

    await supabase
      .from('generations')
      .update({
        status: 'success',
        result_urls: resultUrls,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId);

  } catch (error) {
    console.error('Process error:', error);
    await supabase
      .from('generations')
      .update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId);
  }
}
