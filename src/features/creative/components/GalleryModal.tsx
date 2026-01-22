"use client";

import { useCallback, useState, useEffect } from 'react';
import { Download, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCreativeStore } from '../store';
import { useToast } from '@/components/Toast';

export function GalleryModal() {
  const { gallery, focusedItemIndex, setFocusedItemIndex } = useCreativeStore();
  const { showToast } = useToast();
  const [imageIndex, setImageIndex] = useState(0);

  const focusedItem = focusedItemIndex !== null ? gallery[focusedItemIndex] : null;
  const currentUrl = focusedItem?.resultUrls[imageIndex] ?? focusedItem?.resultUrls[0];

  useEffect(() => {
    setImageIndex(0);
  }, [focusedItemIndex]);

  const handleDownload = useCallback(async () => {
    if (!focusedItem || !currentUrl) return;
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const extension = focusedItem.type === 'video' ? 'mp4' : 'png';
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `erion-${focusedItem.type}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [focusedItem, currentUrl]);

  const handleClose = () => setFocusedItemIndex(null);

  const handleCopyPrompt = useCallback(async () => {
    if (!focusedItem?.prompt) return;
    await navigator.clipboard.writeText(focusedItem.prompt);
    showToast('Prompt copied to clipboard', 'success');
  }, [focusedItem, showToast]);

  const nextItem = () => {
    if (focusedItemIndex !== null && gallery.length > 1) {
      setFocusedItemIndex((focusedItemIndex + 1) % gallery.length);
    }
  };

  const prevItem = () => {
    if (focusedItemIndex !== null && gallery.length > 1) {
      setFocusedItemIndex((focusedItemIndex - 1 + gallery.length) % gallery.length);
    }
  };

  if (!focusedItem) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-200 cursor-pointer"
      onClick={handleClose}
    >
      <div className="relative max-w-5xl w-full flex flex-col items-center gap-4 cursor-default" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 md:top-0 md:right-0 p-2 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-full transition-colors z-10 cursor-pointer"
        >
          <XCircle className="w-6 h-6" />
        </button>

        {/* Main image/video */}
        <div className="relative w-full flex items-center justify-center">
          {/* Gallery item navigation */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={prevItem}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full hidden md:block cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextItem}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full hidden md:block cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {focusedItem.type === 'video' ? (
            <video
              src={currentUrl}
              controls
              autoPlay
              className="max-h-[60vh] max-w-full rounded-lg shadow-2xl"
            />
          ) : (
            <img
              src={currentUrl}
              alt="Result"
              className="max-h-[60vh] max-w-full object-contain shadow-2xl rounded-lg"
            />
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 overflow-x-auto py-2 px-1">
          {focusedItem.resultUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setImageIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                idx === imageIndex
                  ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                  : 'border-zinc-700 hover:border-zinc-500 opacity-60 hover:opacity-100'
              }`}
            >
              {focusedItem.type === 'video' ? (
                <video src={url} className="w-full h-full object-cover" />
              ) : (
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>

        {/* Info and download */}
        <div className="flex flex-col items-center gap-3">
          <p
            onClick={handleCopyPrompt}
            className="text-zinc-400 text-sm italic max-w-md text-center line-clamp-2 cursor-pointer hover:text-zinc-300 transition-colors"
            title="Click to copy"
          >&ldquo;{focusedItem.prompt}&rdquo;</p>
          <button
            onClick={handleDownload}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 text-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
