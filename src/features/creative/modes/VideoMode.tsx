"use client";

import { useState } from 'react';
import { Settings2, Key, Sparkles, Frame, Upload, Scaling, ImageIcon } from 'lucide-react';
import { generateVideoWithVeo } from '@/services/geminiService';
import { FileUpload, UploadedFile } from '@/components/FileUpload';
import { Button } from '@/components/Button';
import { useCreativeStore } from '../store';
import { StudioOutput } from '../components/StudioOutput';
import { MediaModal } from '../components/MediaModal';
import { Panel } from '../components/Panel';
import { ImageGrid } from '../components/ImageGrid';
import { ImageFile, AppStatus, AspectRatio, VideoResolution } from '@/types';

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '9:21'];
const RESOLUTIONS: VideoResolution[] = ['720p', '1080p'];

interface VideoModeState {
  sourceImage: ImageFile | null;
  resultVideo: string | null;
  prompt: string;
  resolution: VideoResolution;
  aspectRatio: AspectRatio;
  status: AppStatus;
  error: string | null;
}

export function VideoMode() {
  const { addToGallery, setFocusedItemIndex } = useCreativeStore();

  const [state, setState] = useState<VideoModeState>({
    sourceImage: null,
    resultVideo: null,
    prompt: '',
    resolution: '720p',
    aspectRatio: '1:1',
    status: AppStatus.IDLE,
    error: null,
  });

  const { sourceImage, resultVideo, prompt, resolution, aspectRatio, status, error } = state;

  const handleFilesSelected = (files: UploadedFile[]) => {
    const imageFile = files.find(f => f.mimeType.startsWith('image/')) || null;
    setState(prev => ({
      ...prev,
      sourceImage: imageFile,
      resultVideo: null,
      status: AppStatus.IDLE,
      error: null,
    }));
  };

  const handleRemoveImage = () => {
    setState(prev => ({
      ...prev,
      sourceImage: null,
      resultVideo: null,
    }));
  };

  const checkAndOpenApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      return true;
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    await checkAndOpenApiKey();

    setState(prev => ({ ...prev, status: AppStatus.PROCESSING, error: null, resultVideo: null }));
    setFocusedItemIndex(null);

    try {
      const videoUrl = await generateVideoWithVeo(
        prompt,
        sourceImage ? { data: sourceImage.data, mimeType: sourceImage.mimeType } : undefined,
        resolution,
        aspectRatio
      );
      setState(prev => ({ ...prev, resultVideo: videoUrl, status: AppStatus.SUCCESS }));
      addToGallery({
        id: Date.now().toString(),
        type: 'video',
        resultUrls: [videoUrl],
        sourceImages: sourceImage ? [sourceImage] : [],
        prompt: prompt,
        timestamp: Date.now(),
        resolution: resolution,
        aspectRatio: aspectRatio
      });
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("re-select")) {
        await window.aistudio?.openSelectKey();
      }
      setState(prev => ({
        ...prev,
        error: err.message || "Something went wrong while generating.",
        status: AppStatus.ERROR,
      }));
    }
  };

  const sourceImages = sourceImage ? [sourceImage] : [];

  return (
    <>
      <MediaModal type="video" resultVideo={resultVideo} />
      <section className="flex flex-col gap-6">
        <Panel icon={ImageIcon} title="Source Reference" subtitle={sourceImages.length > 0 ? "(1 used as start frame)" : undefined}>
          {sourceImages.length === 0 ? (
            <FileUpload onFilesSelected={handleFilesSelected} multiple={false} accept="image/*">
              <div className="bg-zinc-900/80 p-4 rounded-full mb-4 shadow-xl ring-1 ring-zinc-700 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-200 mb-2">Upload Start Frame</h3>
              <p className="text-sm text-zinc-400 text-center max-w-xs">
                <span className="text-xs opacity-60 block">Supports JPG, PNG, WEBP</span>
              </p>
            </FileUpload>
          ) : (
            <ImageGrid
              images={sourceImages}
              multiple={false}
              onFilesSelected={handleFilesSelected}
              onRemoveImage={handleRemoveImage}
            />
          )}
        </Panel>

        <Panel icon={Settings2} title="Configuration">
          <div className="mb-4 md:mb-6">
            <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2 md:mb-3 block flex items-center gap-2">
              <Scaling className="w-3.5 h-3.5" /> Resolution
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res}
                  onClick={() => setState(s => ({ ...s, resolution: res }))}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                    resolution === res
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 cursor-pointer'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 md:mb-6">
            <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2 md:mb-3 block flex items-center gap-2">
              <Frame className="w-3.5 h-3.5" /> Aspect Ratio
            </label>
            <div className="grid grid-cols-4 gap-1.5 md:gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setState(s => ({ ...s, aspectRatio: ratio }))}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                    aspectRatio === ratio
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 cursor-pointer'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setState(s => ({ ...s, prompt: e.target.value }))}
            placeholder="Describe the motion, scene, and details..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 md:p-4 text-zinc-200 text-sm md:text-base h-24 md:h-32 focus:ring-2 focus:ring-indigo-500/50 outline-none mb-3 md:mb-4"
          />

          <Button onClick={handleGenerate} isLoading={status === AppStatus.PROCESSING} className="w-full py-3 md:py-4 text-base md:text-lg">
            <Sparkles className="w-5 h-5" />
            Create Cinematic Video
          </Button>
          <p className="text-[10px] text-zinc-500 mt-2 text-center flex items-center justify-center gap-1"><Key className="w-3 h-3" /> Requires Paid Google Project API Key.</p>
        </Panel>
      </section>
      <StudioOutput
        type="video"
        status={status}
        error={error}
        resultVideo={resultVideo}
        resolution={resolution}
        aspectRatio={aspectRatio}
      />
    </>
  );
}
