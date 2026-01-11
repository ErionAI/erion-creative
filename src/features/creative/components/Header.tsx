"use client";

import { Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function Header() {
  const { user, signOut } = useAuth();

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

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user?.email}</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
