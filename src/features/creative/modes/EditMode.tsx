"use client";

import { useState } from 'react';
import { Settings2, Sparkles, Frame, Upload, Scaling, ImageIcon, Layers } from 'lucide-react';
import { editImage } from '@/services/editService';
import { FileUpload, UploadedFile } from '@/components/FileUpload';
import { Button } from '@/components/Button';
import { useCreativeStore } from '../store';
import { StudioOutput } from '../components/StudioOutput';
import { MediaModal } from '../components/MediaModal';
import { Panel } from '../components/Panel';
import { ImageGrid } from '../components/ImageGrid';
import { ImageFile, AppStatus, AspectRatio, Resolution, VariationCount, ModelTier } from '@/types';

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '9:21'];
const RESOLUTIONS: Resolution[] = ['1K', '2K', '4K'];
const VARIATIONS: VariationCount[] = [1, 2, 4];

const getModelTier = (resolution: Resolution): ModelTier => resolution === '1K' ? 'Basic' : 'Pro';

interface EditModeState {
  sourceImages: ImageFile[];
  resultImages: string[];
  prompt: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  variations: VariationCount;
  status: AppStatus;
  error: string | null;
}

export function EditMode() {
  const { addToGallery, setFocusedItemIndex } = useCreativeStore();

  const [state, setState] = useState<EditModeState>({
    sourceImages: [],
    resultImages: [],
    prompt: '',
    resolution: '1K',
    aspectRatio: '1:1',
    variations: 1,
    status: AppStatus.IDLE,
    error: null,
  });

  const { sourceImages, resultImages, prompt, resolution, aspectRatio, variations, status, error } = state;

  const handleFilesSelected = (files: UploadedFile[]) => {
    const imageFiles = files.filter(f => f.mimeType.startsWith('image/'));
    setState(prev => ({
      ...prev,
      sourceImages: [...prev.sourceImages, ...imageFiles],
      resultImages: [],
      status: AppStatus.IDLE,
      error: null,
    }));
  };

  const handleRemoveImage = (index: number) => {
    setState(prev => ({
      ...prev,
      sourceImages: prev.sourceImages.filter((_, i) => i !== index),
      resultImages: prev.sourceImages.length === 1 ? [] : prev.resultImages,
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
    if (sourceImages.length === 0) return;
    if (!prompt.trim()) return;

    if (resolution === '2K' || resolution === '4K') {
      await checkAndOpenApiKey();
    }

    setState(prev => ({ ...prev, status: AppStatus.PROCESSING, error: null, resultImages: [] }));
    setFocusedItemIndex(null);

    try {
      const results = await editImage(
        sourceImages.map(img => ({ data: img.data, mimeType: img.mimeType })),
        prompt,
        getModelTier(resolution),
        resolution,
        aspectRatio,
        variations
      );

      if (results && results.length > 0) {
        setState(prev => ({ ...prev, resultImages: results, status: AppStatus.SUCCESS }));
        addToGallery({
          id: Date.now().toString(),
          type: 'image',
          resultUrls: results,
          sourceImages: sourceImages,
          prompt: prompt,
          timestamp: Date.now(),
          resolution: resolution,
          aspectRatio: aspectRatio
        });
      }
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

  return (
    <>
      <MediaModal type="image" resultImages={resultImages} />
      <section className="flex flex-col gap-6">
        <Panel icon={ImageIcon} title="Source Images">
          {sourceImages.length === 0 ? (
            <FileUpload onFilesSelected={handleFilesSelected} multiple accept="image/*">
              <div className="bg-zinc-900/80 p-4 rounded-full mb-4 shadow-xl ring-1 ring-zinc-700 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-200 mb-2">Upload Source Images</h3>
              <p className="text-sm text-zinc-400 text-center max-w-xs">
                <span className="text-xs opacity-60 block">Supports JPG, PNG, WEBP</span>
              </p>
            </FileUpload>
          ) : (
            <ImageGrid
              images={sourceImages}
              multiple
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
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 md:gap-2">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res}
                  onClick={() => setState(s => ({ ...s, resolution: res }))}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
                    resolution === res
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 cursor-pointer'
                  }`}
                >
                  {res}
                  {res !== '1K' && <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1 rounded">Pro</span>}
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

          <div className="mb-4 md:mb-6">
            <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2 md:mb-3 block flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Variations
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 md:gap-2">
              {VARIATIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setState(s => ({ ...s, variations: count }))}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                    variations === count
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 cursor-pointer'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setState(s => ({ ...s, prompt: e.target.value }))}
            placeholder="Describe your imagination..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 md:p-4 text-zinc-200 text-sm md:text-base h-24 md:h-32 focus:ring-2 focus:ring-indigo-500/50 outline-none mb-3 md:mb-4"
          />

          <Button onClick={handleGenerate} isLoading={status === AppStatus.PROCESSING} className="w-full py-3 md:py-4 text-base md:text-lg">
            <Sparkles className="w-5 h-5" />
            Generate {variations} Variation{variations > 1 ? 's' : ''}
          </Button>
        </Panel>
      </section>
      <StudioOutput
        type="image"
        status={status}
        error={error}
        resultImages={resultImages}
        resolution={resolution}
        aspectRatio={aspectRatio}
      />
    </>
  );
}
