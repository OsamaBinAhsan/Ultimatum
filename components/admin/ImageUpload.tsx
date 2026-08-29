'use client';

import { useState, useRef, ChangeEvent, DragEvent, ClipboardEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Check,
  Sparkles,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  category?: 'game' | 'news' | 'recipe' | 'tech' | 'beauty' | 'general';
  aspectRatio?: 'video' | 'square' | 'banner';
  description?: string;
}

const PRESET_GALLERIES: Record<string, { label: string; url: string }[]> = {
  game: [
    { label: 'Cyber Arcade', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80' },
    { label: 'Hyper Chess', url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80' },
    { label: 'Retro Cabinet', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80' },
    { label: 'Pixel Grid', url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80' },
    { label: 'Sci-Fi Cockpit', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
  ],
  recipe: [
    { label: 'Michelin Wagyu', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80' },
    { label: 'Truffle Pasta', url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80' },
    { label: 'Artisan Sourdough', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' },
    { label: 'Asian Ramen', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80' },
    { label: 'Berry Tart', url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80' },
  ],
  news: [
    { label: 'Tech Lab Future', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
    { label: 'Breaking News', url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80' },
    { label: 'AI Robotics', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Cyber Security', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80' },
  ],
  tech: [
    { label: 'Gaming GPU', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80' },
    { label: 'Mechanical Keyboard', url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80' },
    { label: 'VR Headset', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80' },
    { label: 'Studio Audio', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' },
  ],
  beauty: [
    { label: 'Luxury Serum', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Botanical Skincare', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80' },
    { label: 'High Fashion', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80' },
  ],
  general: [
    { label: 'Editorial Dark', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
    { label: 'Modern Abstract', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
  ],
};

export function ImageUpload({
  label = 'Cover Image / Thumbnail',
  value,
  onChange,
  category = 'general',
  aspectRatio = 'video',
  description,
}: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = PRESET_GALLERIES[category] || PRESET_GALLERIES.general;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (.png, .jpg, .webp, .svg)');
      return;
    }
    setError(null);
    setUploading(true);

    // 1. Immediate client preview via FileReader (Data URL)
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload file to server /public/uploads/ for permanent URL
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          onChange(data.url);
        }
      }
    } catch (err) {
      console.warn('API file upload notice (client data URL will be retained):', err);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
      }
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-[220px]'
      : aspectRatio === 'banner'
      ? 'aspect-[21/9]'
      : 'aspect-[16/9]';

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-mono font-bold text-zinc-300 uppercase tracking-wide">
            {label}
          </label>
          {description && <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 p-0.5 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              mode === 'upload' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('presets')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              mode === 'presets' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              mode === 'url' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/80 border border-red-500/50 p-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Mode 1: Drag-and-Drop & File Picker */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-zinc-950/60 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/20'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-cyan-400 py-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-mono font-bold">Uploading & Optimizing Image...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center py-1">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Click to browse files or drag & drop here
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                    PNG, JPG, WEBP, GIF, SVG (Max 10MB) • Paste directly with Ctrl+V
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Presets Gallery */}
      {mode === 'presets' && (
        <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-2">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">
            Curated High-Resolution {category.toUpperCase()} Presets:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((preset, idx) => {
              const isSelected = value === preset.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className={`relative rounded-xl overflow-hidden border transition-all text-left group aspect-video ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white truncate">{preset.label}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-cyan-500 text-zinc-950">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 3: Manual URL Input */}
      {mode === 'url' && (
        <div className="space-y-1.5">
          <div className="relative">
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 font-mono focus:border-cyan-500 focus:outline-none pr-10"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Paste any direct image URL from Unsplash, Cloudinary, AWS S3, or external CDN.
          </div>
        </div>
      )}

      {/* Live Thumbnail Preview Card */}
      {value && (
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 flex-shrink-0 w-24 h-16`}>
              <img
                src={value}
                alt="Uploaded Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/600x400/18181b/ffffff?text=Image+Preview';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Image Selected</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate max-w-xs mt-0.5">
                {value.startsWith('data:') ? 'Local Upload (Base64 Encoded)' : value}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
              title="Remove Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
