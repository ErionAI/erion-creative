declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

type FileType = 'image' | 'video';

interface DownloadOptions {
  url: string;
  type: FileType;
  filename?: string;
}

const MIME_TYPES: Record<FileType, string> = {
  image: 'image/png',
  video: 'video/mp4',
};

const EXTENSIONS: Record<FileType, string> = {
  image: 'png',
  video: 'mp4',
};

export async function downloadFile({ url, type, filename }: DownloadOptions): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const defaultFilename = filename || `erion-${type}-${Date.now()}.${EXTENSIONS[type]}`;

  // Try File System Access API (Chrome/Edge)
  const showSaveFilePicker = window.showSaveFilePicker;
  if (showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [
          {
            description: type === 'video' ? 'Video' : 'Image',
            accept: { [MIME_TYPES[type]]: [`.${EXTENSIONS[type]}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      // User cancelled or API failed, fall through to legacy method
      if ((err as Error).name === 'AbortError') return;
    }
  }

  // Fallback: blob URL download
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
