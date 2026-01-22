"use client";

import { useCallback } from 'react';
import { Download, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadFile } from '@/lib/download';

interface MediaModalProps {
  type: 'image' | 'video';
  resultImages?: string[];
  resultVideo?: string | null;
  selectedIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number | null) => void;
}

export function MediaModal({
  resultImages = [],
  resultVideo = null,
  selectedIndex,
  onClose,
  onIndexChange,
}: MediaModalProps) {

  const handleDownload = useCallback(async () => {
    const url = resultVideo || resultImages[selectedIndex || 0];
    if (!url) return;
    try {
      await downloadFile({
        url,
        type: resultVideo ? 'video' : 'image',
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [resultVideo, resultImages, selectedIndex]);

  const nextItem = () => {
    if (selectedIndex !== null && resultImages.length > 0) {
      onIndexChange((selectedIndex + 1) % resultImages.length);
    }
  };

  const prevItem = () => {
    if (selectedIndex !== null && resultImages.length > 0) {
      onIndexChange((selectedIndex - 1 + resultImages.length) % resultImages.length);
    }
  };

  if (selectedIndex === null || (!resultImages[selectedIndex] && !resultVideo)) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center">
        {resultVideo ? (
          <video
            src={resultVideo}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={resultImages[selectedIndex]}
            alt="Result"
            className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-full transition-colors"
        >
          <XCircle className="w-8 h-8" />
        </button>

        {!resultVideo && resultImages.length > 1 && (
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

        <div className="absolute bottom-8 flex gap-4" onClick={(e) => e.stopPropagation()}>
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
