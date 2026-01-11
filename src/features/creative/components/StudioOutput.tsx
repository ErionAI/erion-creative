"use client";

import { Image as ImageIcon, Loader2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { useCreativeStore } from '../store';
import { AppStatus } from '@/types';

interface StudioOutputProps {
  type: 'image' | 'video';
  status: AppStatus;
  error: string | null;
  resultImages?: string[];
  resultVideo?: string | null;
  resolution?: string;
  aspectRatio?: string;
}

export function StudioOutput({
  type,
  status,
  error,
  resultImages = [],
  resultVideo = null,
  resolution,
  aspectRatio,
}: StudioOutputProps) {
  const { setFocusedItemIndex } = useCreativeStore();

  return (
    <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col shadow-inner min-h-[300px] md:min-h-[500px]">
      <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Studio Output</h2>

      <div className="flex-1 bg-black/20 rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
        {status === AppStatus.IDLE && !resultImages.length && !resultVideo && (
          <div className="text-zinc-600 text-center p-8">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p>Waiting for prompt...</p>
          </div>
        )}

        {status === AppStatus.PROCESSING && (
          <div className="absolute inset-0 z-10 bg-zinc-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <p className="text-xl font-medium text-white mb-2">
              {type === 'video' ? 'Google Veo is Rendering' : 'Generating Images'}
            </p>
            <p className="text-zinc-400 text-sm animate-pulse max-w-xs">
              {type === 'video' ? 'This may take a few minutes...' : 'Processing your request...'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-400 mb-2">Error Occurred</p>
            <p className="text-zinc-500 text-xs">{error}</p>
          </div>
        )}

        {resultVideo && (
          <div className="w-full h-full flex flex-col p-2">
            <video src={resultVideo} controls className="w-full h-full object-contain rounded-lg shadow-xl" />
            <div className="mt-4 flex justify-between items-center px-2">
              <span className="text-xs text-zinc-500">Video: {resolution} • {aspectRatio}</span>
              <Button onClick={() => setFocusedItemIndex(0)} variant="secondary" className="text-xs py-1">
                <Maximize2 className="w-3 h-3" /> Fullscreen
              </Button>
            </div>
          </div>
        )}

        {resultImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-2 h-full w-full">
            {resultImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative group overflow-hidden rounded-lg bg-black/40 cursor-pointer border border-zinc-800/50"
                onClick={() => setFocusedItemIndex(idx)}
              >
                <img src={imgUrl} alt={`Result ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
