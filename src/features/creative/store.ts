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
  loadGallery: () => Promise<void>;
  addToGallery: (item: GalleryItem) => void;
  removeFromGallery: (id: string) => void;
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
        .limit(50);

      if (error) {
        console.error('Failed to load gallery:', error);
        return;
      }

      const items = (data ?? []).map(generationToGalleryItem);
      set({ gallery: items });
    } finally {
      set({ galleryLoading: false });
    }
  },
  addToGallery: (item) => set((state) => ({
    gallery: [item, ...state.gallery]
  })),
  removeFromGallery: (id) => set((state) => ({
    gallery: state.gallery.filter((item) => item.id !== id)
  })),
}));
