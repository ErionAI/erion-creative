"use client";

import { LucideIcon } from 'lucide-react';

interface PanelProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Panel({ icon: Icon, title, subtitle, children }: PanelProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-inner">
      <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
        {title}
        {subtitle && <span className="ml-2 text-xs text-zinc-500">{subtitle}</span>}
      </h2>
      {children}
    </div>
  );
}
