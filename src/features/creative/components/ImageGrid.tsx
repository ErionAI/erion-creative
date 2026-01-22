"use client";

import { useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { UploadedFile } from '@/components/FileUpload';
import { ImageFile } from '@/types';

interface ImageGridProps {
  images: ImageFile[];
  multiple?: boolean;
  onFilesSelected: (files: UploadedFile[]) => void;
  onRemoveImage: (index: number) => void;
}

export function ImageGrid({
  images,
  multiple = true,
  onFilesSelected,
  onRemoveImage,
}: ImageGridProps) {
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const promises = imageFiles.map(file => {
      return new Promise<UploadedFile>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve({
            file,
            data: result.split(',')[1],
            mimeType: file.type,
            preview: result
          });
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(promises).then(onFilesSelected);
  };

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  return (
    <div className={multiple ? "grid grid-cols-2 gap-4" : ""}>
      {images.map((img, idx) => (
        <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-black/40 aspect-video">
          <img src={img.preview} alt={`Source ${idx + 1}`} className="w-full h-full object-cover" />
          <button
            onClick={() => onRemoveImage(idx)}
            className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {multiple && (
        <div
          onClick={() => addMoreInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer aspect-video overflow-hidden transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/50'
          }`}
        >
          <input
            ref={addMoreInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddMore}
          />
          <Plus className="w-8 h-8 text-zinc-500" />
        </div>
      )}
    </div>
  );
}
