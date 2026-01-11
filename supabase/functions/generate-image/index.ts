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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = getSupabaseClient(authHeader);
    const serviceClient = getServiceClient();

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { prompt, model_tier, resolution, aspect_ratio, variations } = body;

    // Create generation record
    const { data: generation, error: insertError } = await serviceClient
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'generate',
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

    // Return generation_id immediately for polling
    const response = new Response(
      JSON.stringify({ generation_id: generation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // Process in background (Edge Runtime handles this)
    EdgeRuntime.waitUntil(processGeneration(serviceClient, generation.id, body, user.id));

    return response;
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processGeneration(
  supabase: any,
  generationId: string,
  body: RequestBody,
  userId: string
) {
  try {
    // Update status to processing
    await supabase
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

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

    // Generate images
    const generateSingle = async (): Promise<string | null> => {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: { parts: [{ text: body.prompt }] },
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
        console.warn('Single generation failed:', e);
        return null;
      }
    };

    const results = await Promise.all(
      Array.from({ length: body.variations }, () => generateSingle())
    );
    const successfulResults = results.filter((r): r is string => r !== null);

    if (successfulResults.length === 0) {
      throw new Error('Failed to generate any images');
    }

    // Upload to storage
    const resultUrls: string[] = [];
    for (let i = 0; i < successfulResults.length; i++) {
      const base64Data = successfulResults[i];
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const path = `images/${userId}/${generationId}/${i}.png`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(path, buffer, { contentType: 'image/png' });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path);
      resultUrls.push(urlData.publicUrl);
    }

    // Update generation with results
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
