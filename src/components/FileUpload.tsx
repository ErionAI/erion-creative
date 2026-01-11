import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { ImageFile } from '../types';

interface FileUploadProps {
  onImagesSelected: (files: ImageFile[]) => void;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onImagesSelected, multiple = true }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFiles(Array.from(files));
    // Reset input value to allow selecting same file again if needed
    if (inputRef.current) inputRef.current.value = '';
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
    if (files && files.length > 0) processFiles(Array.from(files));
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    const promises = validFiles.map(file => {
      return new Promise<ImageFile>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract base64 data without prefix for API
          const base64Data = result.split(',')[1];
          
          resolve({
            data: base64Data,
            mimeType: file.type,
            preview: result
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(images => {
      onImagesSelected(images);
    });
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer 
        border-2 border-dashed rounded-xl p-8 
        flex flex-col items-center justify-center 
        transition-all duration-300 h-full min-h-[300px]
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="bg-zinc-900/80 p-4 rounded-full mb-4 shadow-xl ring-1 ring-zinc-700 group-hover:scale-110 transition-transform duration-300">
        <Upload className="w-8 h-8 text-indigo-400" />
      </div>
      
      <h3 className="text-lg font-medium text-zinc-200 mb-2">
        {multiple ? 'Upload Source Images' : 'Upload Source Image'}
      </h3>
      <p className="text-sm text-zinc-400 text-center max-w-xs">
        Drag and drop your {multiple ? 'images' : 'image'} here, or click to browse.
        <br />
        <span className="text-xs opacity-60 mt-2 block">Supports JPG, PNG, WEBP</span>
      </p>
    </div>
  );
};