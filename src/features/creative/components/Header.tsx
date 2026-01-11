"use client";

import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between border-b border-zinc-800 pb-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">ERION CREATIVE</h1>
          <p className="text-sm text-zinc-500">Multimodal AI Studio</p>
        </div>
      </div>
    </header>
  );
}
