import { create } from 'zustand';
import { GalleryItem } from '@/types';

export type AppMode = 'EDIT' | 'GENERATE' | 'VIDEO';

interface CreativeState {
  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Modal (for viewing results)
  focusedItemIndex: number | null;
  setFocusedItemIndex: (index: number | null) => void;

  // Gallery
  gallery: GalleryItem[];
  addToGallery: (item: GalleryItem) => void;
  removeFromGallery: (id: string) => void;
}

export const useCreativeStore = create<CreativeState>((set) => ({
  // Mode
  mode: 'EDIT',
  setMode: (mode) => set({ mode }),

  // Modal
  focusedItemIndex: null,
  setFocusedItemIndex: (index) => set({ focusedItemIndex: index }),

  // Gallery
  gallery: [],
  addToGallery: (item) => set((state) => ({
    gallery: [item, ...state.gallery]
  })),
  removeFromGallery: (id) => set((state) => ({
    gallery: state.gallery.filter((item) => item.id !== id)
  })),
}));
