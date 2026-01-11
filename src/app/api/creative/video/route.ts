import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { VideoResolution, AspectRatio } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      sourceImage,
      resolution = '720p',
      aspectRatio = '16:9'
    }: {
      prompt: string;
      sourceImage?: { data: string; mimeType: string };
      resolution: VideoResolution;
      aspectRatio: AspectRatio;
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: aspectRatio
    };

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: sourceImage ? {
        imageBytes: sourceImage.data,
        mimeType: sourceImage.mimeType
      } : undefined,
      config: videoConfig
    });

    // Polling for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      return NextResponse.json({ error: "Video generation failed: No download link returned." }, { status: 500 });
    }

    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to download video: ${response.statusText}` }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const videoDataUrl = `data:video/mp4;base64,${base64}`;

    return NextResponse.json({ result: videoDataUrl });

  } catch (error: any) {
    console.error("Error generating video with Veo:", error);
    if (error.message?.includes("Requested entity was not found")) {
      return NextResponse.json({ error: "API Key mismatch or invalid project." }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
