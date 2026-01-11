import { create } from 'zustand';
import { createClient } from '@/lib/supabase';
import { GalleryItem, AspectRatio } from '@/types';
import type { Database } from '@/lib/supabase/types';

export type AppMode = 'EDIT' | 'GENERATE' | 'VIDEO';

type GenerationRow = Database['public']['Tables']['generations']['Row'];

const generationToGalleryItem = (gen: GenerationRow): GalleryItem => ({
  id: gen.id,
  type: gen.type === 'video' ? 'video' : 'image',
  resultUrls: gen.result_urls ?? [],
  sourceImages: [],
  prompt: gen.prompt,
  timestamp: new Date(gen.created_at).getTime(),
  resolution: gen.resolution ?? undefined,
  aspectRatio: (gen.aspect_ratio as AspectRatio) ?? undefined,
});

interface CreativeState {
  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Modal (for viewing results)
  focusedItemIndex: number | null;
  setFocusedItemIndex: (index: number | null) => void;

  // Gallery
  gallery: GalleryItem[];
  galleryLoading: boolean;
  hasMoreGallery: boolean;
  loadGallery: () => Promise<void>;
  loadMoreGallery: () => Promise<void>;
  addToGallery: (item: GalleryItem) => void;
}

export const useCreativeStore = create<CreativeState>((set, get) => ({
  // Mode
  mode: 'EDIT',
  setMode: (mode) => set({ mode }),

  // Modal
  focusedItemIndex: null,
  setFocusedItemIndex: (index) => set({ focusedItemIndex: index }),

  // Gallery
  gallery: [],
  galleryLoading: false,
  hasMoreGallery: true,
  loadGallery: async () => {
    if (get().galleryLoading) return;

    set({ galleryLoading: true });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Failed to load gallery:', error);
        return;
      }

      const items = (data ?? []).map(generationToGalleryItem);
      set({ gallery: items, hasMoreGallery: items.length === 8 });
    } finally {
      set({ galleryLoading: false });
    }
  },
  loadMoreGallery: async () => {
    const { galleryLoading, gallery, hasMoreGallery } = get();
    if (galleryLoading || !hasMoreGallery) return;

    set({ galleryLoading: true });
    try {
      const supabase = createClient();
      const lastItem = gallery[gallery.length - 1];
      const lastTimestamp = lastItem ? new Date(lastItem.timestamp).toISOString() : new Date().toISOString();

      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('status', 'success')
        .lt('created_at', lastTimestamp)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Failed to load more gallery:', error);
        return;
      }

      const items = (data ?? []).map(generationToGalleryItem);
      set({
        gallery: [...gallery, ...items],
        hasMoreGallery: items.length === 8,
      });
    } finally {
      set({ galleryLoading: false });
    }
  },
  addToGallery: (item) => set((state) => ({
    gallery: [item, ...state.gallery]
  })),
}));
