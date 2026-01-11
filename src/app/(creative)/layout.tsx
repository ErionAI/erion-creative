import React from 'react';

export default function CreativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {children}
      </div>
    </div>
  );
}
