import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.35.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient, getSupabaseClient } from '../_shared/supabase.ts';

interface RequestBody {
  prompt: string;
  resolution: string;
  aspect_ratio: string;
  resource_id?: string; // Optional start frame image
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
    const { prompt, resolution, aspect_ratio, resource_id } = body;

    // Create generation record
    const { data: generation, error: insertError } = await serviceClient
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'video',
        status: 'pending',
        prompt,
        resolution,
        aspect_ratio,
        model_tier: 'Pro', // Video is always Pro
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create generation: ${insertError.message}`);
    }

    // Link resource to generation if provided
    if (resource_id) {
      await serviceClient
        .from('resources')
        .update({ generation_id: generation.id })
        .eq('id', resource_id);
    }

    const response = new Response(
      JSON.stringify({ generation_id: generation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    EdgeRuntime.waitUntil(processVideo(serviceClient, generation.id, body, user.id, resource_id));

    return response;
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processVideo(
  supabase: any,
  generationId: string,
  body: RequestBody,
  userId: string,
  resourceId?: string
) {
  try {
    await supabase
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

    let sourceImage: { data: string; mimeType: string } | undefined;

    // Load source image if provided
    if (resourceId) {
      const { data: resource } = await supabase
        .from('resources')
        .select('storage_path, mime_type')
        .eq('id', resourceId)
        .single();

      if (resource) {
        const { data: fileData } = await supabase.storage
          .from('resource')
          .download(resource.storage_path);

        if (fileData) {
          const buffer = await fileData.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          sourceImage = { data: base64, mimeType: resource.mime_type };
        }
      }
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const ai = new GoogleGenAI({ apiKey });

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: body.resolution,
      aspectRatio: body.aspect_ratio,
    };

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: body.prompt,
      image: sourceImage ? {
        imageBytes: sourceImage.data,
        mimeType: sourceImage.mimeType,
      } : undefined,
      config: videoConfig,
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('Video generation failed: No download link returned');
    }

    // Download video
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const path = `videos/${userId}/${generationId}/output.mp4`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('asset')
      .upload(path, new Uint8Array(videoBuffer), { contentType: 'video/mp4' });

    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('asset').getPublicUrl(path);

    await supabase
      .from('generations')
      .update({
        status: 'success',
        result_urls: [urlData.publicUrl],
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
