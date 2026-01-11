"use client";

import { useCallback } from 'react';
import { Download, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCreativeStore } from '../store';

export function GalleryModal() {
  const { gallery, focusedItemIndex, setFocusedItemIndex } = useCreativeStore();

  const focusedItem = focusedItemIndex !== null ? gallery[focusedItemIndex] : null;

  const handleDownload = useCallback(() => {
    if (!focusedItem) return;
    const url = focusedItem.resultUrls[0];
    if (!url) return;
    const extension = focusedItem.type === 'video' ? 'mp4' : 'png';
    const link = document.createElement('a');
    link.href = url;
    link.download = `erion-${focusedItem.type}-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [focusedItem]);

  const handleClose = () => setFocusedItemIndex(null);

  const nextItem = () => {
    if (focusedItemIndex !== null && gallery.length > 0) {
      setFocusedItemIndex((focusedItemIndex + 1) % gallery.length);
    }
  };

  const prevItem = () => {
    if (focusedItemIndex !== null && gallery.length > 0) {
      setFocusedItemIndex((focusedItemIndex - 1 + gallery.length) % gallery.length);
    }
  };

  if (!focusedItem) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center">
        {focusedItem.type === 'video' ? (
          <video
            src={focusedItem.resultUrls[0]}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={focusedItem.resultUrls[0]}
            alt="Result"
            className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-full transition-colors"
        >
          <XCircle className="w-8 h-8" />
        </button>

        {gallery.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevItem(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextItem(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="absolute bottom-8 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-zinc-400 text-sm italic max-w-md text-center line-clamp-2">&ldquo;{focusedItem.prompt}&rdquo;</p>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
