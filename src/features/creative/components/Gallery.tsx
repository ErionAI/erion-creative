"use client";

import { useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, Play } from 'lucide-react';
import { useCreativeStore } from '../store';

export function Gallery() {
  const { gallery, galleryLoading, hasMoreGallery, loadGallery, loadMoreGallery, setFocusedItemIndex } = useCreativeStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMoreGallery && !galleryLoading) {
      loadMoreGallery();
    }
  }, [hasMoreGallery, galleryLoading, loadMoreGallery]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: '100px',
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  if (gallery.length === 0 && !galleryLoading) {
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
            onClick={() => setFocusedItemIndex(gallery.indexOf(item))}
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
                <span className="text-xs font-medium">Click to View</span>
              </div>
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

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {galleryLoading && (
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </section>
  );
}
