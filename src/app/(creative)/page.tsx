"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, RotateCcw, Download, LayoutGrid, Trash2, Eye, Plus, X, Settings2, Key, Wand2, Palette, Maximize2, XCircle, ChevronLeft, ChevronRight, Video, Play, Loader2, Frame } from 'lucide-react';
import { generateImageWithGemini, generateVideoWithVeo } from '@/services/geminiService';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/Button';
import { ImageFile, AppStatus, GalleryItem, Resolution, VideoResolution, AspectRatio } from '@/types';

type AppMode = 'EDIT' | 'GENERATE' | 'VIDEO';

const VIDEO_LOADING_MESSAGES = [
  "Igniting the creative engine...",
  "Simulating physics and cinematic motion...",
  "Rendering frames at high spirit...",
  "Applying dynamic lighting and textures...",
  "Polishing pixels for the final cut...",
  "Almost there! Just a few more seconds...",
  "Encoding your masterpiece..."
];

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '9:21'];

function App() {
  const [mode, setMode] = useState<AppMode>('EDIT');
  const [sourceImages, setSourceImages] = useState<ImageFile[]>([]);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);

  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [videoResolution, setVideoResolution] = useState<VideoResolution>('720p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  
  const addImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (status === AppStatus.PROCESSING && mode === 'VIDEO') {
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % VIDEO_LOADING_MESSAGES.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [status, mode]);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setStatus(AppStatus.IDLE);
    setError(null);
    setResultImages([]);
    setResultVideo(null);
    setFocusedItemIndex(null);
  };

  const handleImagesSelected = (files: ImageFile[]) => {
    setSourceImages(prev => [...prev, ...files]);
    setResultImages([]);
    setResultVideo(null);
    setStatus(AppStatus.IDLE);
    setError(null);
  };

  const handleAddMoreImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const fileList = Array.from(files) as File[];
        const validFiles = fileList.filter(file => file.type.startsWith('image/'));
        const promises = validFiles.map(file => {
            return new Promise<ImageFile>((resolve) => {
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
      
          Promise.all(promises).then(images => {
            handleImagesSelected(images);
          });
    }
    if (addImageInputRef.current) addImageInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSourceImages(prev => prev.filter((_, index) => index !== indexToRemove));
    if (sourceImages.length === 1) {
        setResultImages([]);
        setResultVideo(null);
    }
  };

  const checkAndOpenApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      return true;
    }
    return false;
  };

  const handleGenerate = async () => {
    if ((mode === 'EDIT' || (mode === 'VIDEO' && sourceImages.length > 0)) && sourceImages.length === 0 && mode === 'EDIT') return;
    if (!prompt.trim()) return;

    if (resolution === '2K' || resolution === '4K' || mode === 'VIDEO') {
      await checkAndOpenApiKey();
    }

    setStatus(AppStatus.PROCESSING);
    setError(null);
    setResultImages([]);
    setResultVideo(null);
    setFocusedItemIndex(null);

    try {
      if (mode === 'VIDEO') {
        const videoUrl = await generateVideoWithVeo(
          prompt,
          sourceImages.length > 0 ? { data: sourceImages[0].data, mimeType: sourceImages[0].mimeType } : undefined,
          videoResolution,
          aspectRatio
        );
        setResultVideo(videoUrl);
        setStatus(AppStatus.SUCCESS);
        setGallery(prev => [{
          id: Date.now().toString(),
          type: 'video',
          resultUrls: [videoUrl],
          sourceImages: sourceImages.slice(0, 1),
          prompt: prompt,
          timestamp: Date.now(),
          resolution: videoResolution,
          aspectRatio: aspectRatio
        }, ...prev]);
      } else {
        const imagesToProcess = mode === 'EDIT' ? sourceImages : [];
        const results = await generateImageWithGemini(
          imagesToProcess.map(img => ({ data: img.data, mimeType: img.mimeType })),
          prompt,
          resolution,
          aspectRatio
        );

        if (results && results.length > 0) {
          setResultImages(results);
          setStatus(AppStatus.SUCCESS);
          setGallery(prev => [{
            id: Date.now().toString(),
            type: 'image',
            resultUrls: results,
            sourceImages: imagesToProcess,
            prompt: prompt,
            timestamp: Date.now(),
            resolution: resolution,
            aspectRatio: aspectRatio
          }, ...prev]);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("re-select")) {
          await window.aistudio?.openSelectKey();
      }
      setError(err.message || "Something went wrong while generating.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setSourceImages([]);
    setResultImages([]);
    setResultVideo(null);
    setFocusedItemIndex(null);
    setPrompt('');
    setResolution('1K');
    setAspectRatio('1:1');
    setStatus(AppStatus.IDLE);
    setError(null);
  };

  const handleRestore = (item: GalleryItem) => {
    setSourceImages(item.sourceImages);
    setPrompt(item.prompt);
    if (item.type === 'video') {
        setMode('VIDEO');
        setResultVideo(item.resultUrls[0]);
        setResultImages([]);
        setVideoResolution(item.resolution as VideoResolution || '720p');
        setAspectRatio(item.aspectRatio || '1:1');
    } else {
        setMode(item.sourceImages.length > 0 ? 'EDIT' : 'GENERATE');
        setResultImages(item.resultUrls);
        setResultVideo(null);
        setResolution(item.resolution as Resolution || '1K');
        setAspectRatio(item.aspectRatio || '1:1');
    }
    setStatus(AppStatus.SUCCESS);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGallery(prev => prev.filter(item => item.id !== id));
  };

  const nextItem = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (focusedItemIndex !== null && resultImages.length > 0) {
      setFocusedItemIndex((focusedItemIndex + 1) % resultImages.length);
    }
  };

  const prevItem = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (focusedItemIndex !== null && resultImages.length > 0) {
      setFocusedItemIndex((focusedItemIndex - 1 + resultImages.length) % resultImages.length);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-white p-4 md:p-8">
      
      {/* Modal Overlay */}
      {focusedItemIndex !== null && (resultImages[focusedItemIndex] || resultVideo) && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setFocusedItemIndex(null)}
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
                        src={resultImages[focusedItemIndex]} 
                        alt="Result"
                        className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
                
                <button 
                    onClick={() => setFocusedItemIndex(null)}
                    className="absolute top-4 right-4 p-2 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-full transition-colors"
                >
                    <XCircle className="w-8 h-8" />
                </button>

                {!resultVideo && resultImages.length > 1 && (
                    <>
                        <button onClick={prevItem} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full"><ChevronLeft className="w-8 h-8" /></button>
                        <button onClick={nextItem} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full"><ChevronRight className="w-8 h-8" /></button>
                    </>
                )}

                <div className="absolute bottom-8 flex gap-4" onClick={(e) => e.stopPropagation()}>
                    <a 
                        href={resultVideo || resultImages[focusedItemIndex || 0]} 
                        download={`erion-${mode.toLowerCase()}-${Date.now()}.mp4`}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" /> Download
                    </a>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between border-b border-zinc-800 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">ERION CREATIVE</h1>
              <p className="text-sm text-zinc-500">Multimodal AI Studio</p>
            </div>
          </div>
          {(sourceImages.length > 0 || prompt || resultImages.length > 0 || resultVideo) && (
            <Button variant="outline" onClick={handleReset} className="text-sm"><RotateCcw className="w-4 h-4" /> Reset</Button>
          )}
        </header>

        {/* Mode Switcher */}
        <div className="flex justify-center">
            <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800 backdrop-blur-sm">
                <button
                    onClick={() => handleModeChange('EDIT')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'EDIT' ? 'bg-zinc-800 text-white ring-1 ring-white/10 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Wand2 className="w-4 h-4" /> Image Editing
                </button>
                <button
                    onClick={() => handleModeChange('GENERATE')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'GENERATE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Palette className="w-4 h-4" /> Text to Image
                </button>
                <button
                    onClick={() => handleModeChange('VIDEO')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'VIDEO' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Video className="w-4 h-4" /> Video Gen
                </button>
            </div>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="flex flex-col gap-6">
            {(mode === 'EDIT' || mode === 'VIDEO') && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-inner animate-in fade-in duration-500">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-indigo-400" />
                        Source {mode === 'VIDEO' ? 'Reference' : 'Images'}
                        {mode === 'VIDEO' && sourceImages.length > 0 && <span className="ml-2 text-xs text-zinc-500">(1 used as start frame)</span>}
                    </h2>
                    {sourceImages.length === 0 ? (
                        <FileUpload onImagesSelected={handleImagesSelected} multiple={mode !== 'VIDEO'} />
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {sourceImages.map((img, idx) => (
                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-800 h-32">
                                    <img src={img.preview} className="w-full h-full object-cover" />
                                    <button onClick={() => handleRemoveImage(idx)} className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                            {mode !== 'VIDEO' && (
                                <div onClick={() => addImageInputRef.current?.click()} className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 cursor-pointer">
                                    <input ref={addImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddMoreImages} />
                                    <Plus className="w-5 h-5 text-zinc-500" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-inner">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Settings2 className="w-5 h-5 text-indigo-400" /> Configuration</h2>
                
                {/* Resolution Selectors */}
                <div className="flex items-center bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50 text-xs">
                    {mode === 'VIDEO' ? (
                        <>
                            <button onClick={() => setVideoResolution('720p')} className={`px-3 py-1.5 rounded-md transition-all ${videoResolution === '720p' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>720p</button>
                            <button onClick={() => setVideoResolution('1080p')} className={`px-3 py-1.5 rounded-md transition-all ${videoResolution === '1080p' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>1080p</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setResolution('1K')} className={`px-3 py-1.5 rounded-md transition-all ${resolution === '1K' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>1K</button>
                            <button onClick={() => setResolution('2K')} className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${resolution === '2K' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>2K <Key className="w-2 h-2" /></button>
                            <button onClick={() => setResolution('4K')} className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${resolution === '4K' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>4K <Key className="w-2 h-2" /></button>
                        </>
                    )}
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="mb-6">
                <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3 block flex items-center gap-2">
                    <Frame className="w-3.5 h-3.5" /> Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                                aspectRatio === ratio 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50' 
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'VIDEO' ? "Describe the motion, scene, and details..." : "Describe your imagination..."}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-200 h-32 focus:ring-2 focus:ring-indigo-500/50 outline-none mb-4"
              />
              
              <Button onClick={handleGenerate} isLoading={status === AppStatus.PROCESSING} className="w-full py-4 text-lg">
                <Sparkles className="w-5 h-5" /> 
                {mode === 'VIDEO' ? 'Create Cinematic Video' : 'Generate 4 Variations'}
              </Button>
              {(mode === 'VIDEO' || resolution !== '1K') && <p className="text-[10px] text-zinc-500 mt-2 text-center flex items-center justify-center gap-1"><Key className="w-3 h-3" /> Requires Paid Google Project API Key.</p>}
            </div>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-inner min-h-[500px]">
             <h2 className="text-lg font-semibold mb-4">Studio Output</h2>

              <div className="flex-1 bg-black/20 rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
                {status === AppStatus.IDLE && !resultImages.length && !resultVideo && (
                    <div className="text-zinc-600 text-center p-8">
                        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4"><ImageIcon className="w-8 h-8" /></div>
                        <p>Waiting for prompt...</p>
                    </div>
                )}

                {status === AppStatus.PROCESSING && (
                  <div className="absolute inset-0 z-10 bg-zinc-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                     <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                     <p className="text-xl font-medium text-white mb-2">{mode === 'VIDEO' ? 'Google Veo is Rendering' : 'Generating Images'}</p>
                     <p className="text-zinc-400 text-sm animate-pulse max-w-xs">{mode === 'VIDEO' ? VIDEO_LOADING_MESSAGES[loadingMsgIndex] : 'Using Gemini 3.0 Pro for ultra-fidelity...'}</p>
                  </div>
                )}

                {error && <div className="p-8 text-center"><p className="text-red-400 mb-2">Error Occurred</p><p className="text-zinc-500 text-xs">{error}</p></div>}

                {resultVideo && (
                    <div className="w-full h-full flex flex-col p-2">
                        <video src={resultVideo} controls className="w-full h-full object-contain rounded-lg shadow-xl" />
                        <div className="mt-4 flex justify-between items-center px-2">
                             <span className="text-xs text-zinc-500">Video: {videoResolution} • {aspectRatio}</span>
                             <Button onClick={() => setFocusedItemIndex(0)} variant="secondary" className="text-xs py-1"><Maximize2 className="w-3 h-3" /> Fullscreen</Button>
                        </div>
                    </div>
                )}

                {resultImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 p-2 h-full w-full">
                    {resultImages.map((imgUrl, idx) => (
                         <div key={idx} className="relative group overflow-hidden rounded-lg bg-black/40 cursor-pointer border border-zinc-800/50" onClick={() => setFocusedItemIndex(idx)}>
                             <img src={imgUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Maximize2 className="w-6 h-6 text-white" /></div>
                         </div>
                    ))}
                  </div>
                )}
              </div>
          </section>
        </main>

        {gallery.length > 0 && (
          <section className="mt-16 border-t border-zinc-800 pt-10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><LayoutGrid className="w-5 h-5" /> Creative Archive</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {gallery.map((item) => (
                    <div key={item.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer" onClick={() => handleRestore(item)}>
                        <div className="aspect-square relative overflow-hidden bg-black">
                            {item.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <video src={item.resultUrls[0]} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 flex items-center justify-center"><Play className="w-10 h-10 text-white drop-shadow-lg" /></div>
                                    <div className="absolute top-2 right-2 bg-purple-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">Veo</div>
                                </div>
                            ) : (
                                <img src={item.resultUrls[0]} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <span className="text-xs font-medium">Click to Restore</span>
                            </div>
                            <button onClick={(e) => handleDelete(item.id, e)} className="absolute top-2 left-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        <div className="p-3 border-t border-zinc-800">
                            <p className="text-xs text-zinc-400 line-clamp-1 italic">"{item.prompt}"</p>
                            <div className="flex justify-between mt-2 text-[10px] text-zinc-600">
                                <span>{item.type.toUpperCase()} • {item.aspectRatio || '1:1'}</span>
                                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
