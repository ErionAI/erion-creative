"use client";

import { Wand2, Palette, Video } from 'lucide-react';
import { useCreativeStore } from '../store';

export function ModeSwitcher() {
  const { mode, setMode } = useCreativeStore();

  return (
    <div className="flex justify-center">
      <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-sm">
        <button
          onClick={() => setMode('EDIT')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'EDIT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Wand2 className="w-4 h-4" /> Image Editing
        </button>
        <button
          onClick={() => setMode('GENERATE')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'GENERATE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Palette className="w-4 h-4" /> Text to Image
        </button>
        <button
          onClick={() => setMode('VIDEO')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'VIDEO' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Video className="w-4 h-4" /> Video Gen
        </button>
      </div>
    </div>
  );
}
