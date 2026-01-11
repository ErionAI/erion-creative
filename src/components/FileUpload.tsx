import React, { useRef, useState } from 'react';

export interface UploadedFile {
  data: string;
  mimeType: string;
  preview: string;
}

interface FileUploadProps {
  children: React.ReactNode;
  onFilesSelected: (files: UploadedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  children,
  onFilesSelected,
  multiple = true,
  accept = '*/*',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFiles(Array.from(files));
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
    if (files.length === 0) return;

    const promises = files.map(file => {
      return new Promise<UploadedFile>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
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

    Promise.all(promises).then(onFilesSelected);
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
        transition-all duration-300 aspect-video
        ${isDragging
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800'
        }
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
      {children}
    </div>
  );
};