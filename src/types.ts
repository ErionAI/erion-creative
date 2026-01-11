
export interface ImageFile {
  data: string; // Base64 string
  mimeType: string;
  preview: string; // URL for preview
}

export interface EditResult {
  imageUrl: string;
  mimeType: string;
}

export type Resolution = '1K' | '2K' | '4K';
export type VideoResolution = '720p' | '1080p';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '4:5' | '5:4' | '9:21' | '16:9' | '9:16';
export type VariationCount = 1 | 2 | 4;

export type GalleryItemType = 'image' | 'video';

export interface GalleryItem {
  id: string;
  type: GalleryItemType;
  resultUrls: string[]; // For images: variations. For videos: single URL in array.
  sourceImages: ImageFile[];
  prompt: string;
  timestamp: number;
  resolution?: string;
  aspectRatio?: AspectRatio;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
