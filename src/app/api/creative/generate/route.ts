import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { ModelTier, Resolution, AspectRatio, VariationCount } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      modelTier = 'Basic',
      resolution = '1K',
      aspectRatio = '1:1',
      variations = 1
    }: {
      prompt: string;
      modelTier: ModelTier;
      resolution: Resolution;
      aspectRatio: AspectRatio;
      variations: VariationCount;
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const isPro = modelTier === 'Pro';
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (isPro) {
      config.imageConfig.imageSize = resolution;
      config.tools = [{ googleSearch: {} }];
    }

    const generateSingle = async (): Promise<string | null> => {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: {
            parts: [{ text: prompt }],
          },
          config: config
        });

        if (!response.candidates || response.candidates.length === 0) return null;

        const candidate = response.candidates[0];
        const parts = candidate.content?.parts;
        if (!parts) return null;

        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const resultMimeType = part.inlineData.mimeType || 'image/png';
            return `data:${resultMimeType};base64,${part.inlineData.data}`;
          }
        }
        return null;
      } catch (e) {
        console.warn("Single generation failed:", e);
        return null;
      }
    };

    const results = await Promise.all(Array.from({ length: variations }, () => generateSingle()));
    const successfulUrls = results.filter((url): url is string => url !== null);

    if (successfulUrls.length === 0) {
      return NextResponse.json({ error: "Failed to generate any images." }, { status: 500 });
    }

    return NextResponse.json({ results: successfulUrls });

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
