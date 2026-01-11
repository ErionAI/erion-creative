"use client";

import { LayoutGrid, Trash2, Play } from 'lucide-react';
import { useCreativeStore } from '../store';

export function Gallery() {
  const { gallery, handleRestore, removeFromGallery } = useCreativeStore();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromGallery(id);
  };

  if (gallery.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 md:mt-16 border-t border-zinc-800 pt-6 md:pt-10">
      <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" /> Creative Archive
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {gallery.map((item) => (
          <div
            key={item.id}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-xl overflow-hidden cursor-pointer"
            onClick={() => handleRestore(item)}
          >
            <div className="aspect-square relative overflow-hidden bg-black">
              {item.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <video src={item.resultUrls[0]} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-indigo-600 px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] uppercase font-bold">
                    Veo
                  </div>
                </div>
              ) : (
                <>
                  <img src={item.resultUrls[0]} alt={item.prompt} className="w-full h-full object-cover" />
                  {item.resultUrls.length > 1 && (
                    <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-zinc-800 px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold">
                      +{item.resultUrls.length - 1}
                    </div>
                  )}
                </>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-medium">Click to Restore</span>
              </div>
              <button
                onClick={(e) => handleDelete(item.id, e)}
                className="absolute top-1.5 left-1.5 md:top-2 md:left-2 p-1 md:p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
              </button>
            </div>
            <div className="p-2 md:p-3 border-t border-zinc-800">
              <p className="text-[10px] md:text-xs text-zinc-400 line-clamp-1 italic">&ldquo;{item.prompt}&rdquo;</p>
              <div className="flex justify-between mt-1.5 md:mt-2 text-[8px] md:text-[10px] text-zinc-600">
                <span>{item.type.toUpperCase()} • {item.aspectRatio || '1:1'}</span>
                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
