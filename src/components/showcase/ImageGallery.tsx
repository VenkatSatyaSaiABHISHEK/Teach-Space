'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { ShowcaseContentItem } from '@/types';

interface ImageGalleryProps {
  images: ShowcaseContentItem[];
  driveUuid: string;
  folderPath: string;
}

export function ImageGallery({ images, driveUuid, folderPath }: ImageGalleryProps) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const getImageUrl = (item: ShowcaseContentItem) => {
    const cleanPath = item.path.startsWith(folderPath)
      ? item.path
      : `${folderPath.replace(/\/+$/, '')}/${item.path.replace(/^\/+/, '')}`;
    const params = new URLSearchParams({ path: cleanPath, inline: 'true' });
    return `/api/backend/download/${encodeURIComponent(driveUuid)}?${params.toString()}`;
  };

  const handleOpenLightbox = (index: number) => {
    setActiveLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setActiveLightboxIndex(null);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePrev = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : images.length - 1));
  };

  const handleNext = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((prev) => (prev! < images.length - 1 ? prev! + 1 : 0));
  };

  // Keyboard navigation inside lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignored
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  const activeImage = activeLightboxIndex !== null ? images[activeLightboxIndex] : null;
  const activeImageUrl = activeImage ? getImageUrl(activeImage) : '';

  return (
    <div className="w-full">
      {/* Responsive Grid: 2 cols on mobile, 3 on tablet, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {images.map((img, idx) => {
          const url = getImageUrl(img);
          return (
            <div
              key={img.path || idx}
              onClick={() => handleOpenLightbox(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenLightbox(idx);
                }
              }}
              className="group relative aspect-4/3 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 cursor-pointer shadow-2xs hover:shadow-md transition-all duration-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={img.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover overlay with filename */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <p className="text-white text-xs font-medium truncate">{img.name}</p>
                <span className="text-[10px] text-neutral-300 flex items-center gap-1 mt-0.5">
                  <Maximize2 className="w-3 h-3" />
                  <span>Click to expand</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeLightboxIndex !== null && activeImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-fade-in">
          {/* Lightbox Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-black/40 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400">
                {activeLightboxIndex + 1} / {images.length}
              </span>
              <span className="text-neutral-500">•</span>
              <p className="text-xs sm:text-sm text-neutral-200 font-medium truncate max-w-xs sm:max-w-md">
                {activeImage.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activeImageUrl}
                download={activeImage.name}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCloseLightbox}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Close Lightbox"
                aria-label="Close Lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div className="relative flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
            {/* Prev button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors border border-white/10 cursor-pointer shadow-lg active:scale-95"
                title="Previous Image"
                aria-label="Previous Image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImageUrl}
              alt={activeImage.name}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform select-none"
            />

            {/* Next button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors border border-white/10 cursor-pointer shadow-lg active:scale-95"
                title="Next Image"
                aria-label="Next Image"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails Strip */}
          {images.length > 1 && (
            <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto shrink-0">
              {images.map((img, idx) => {
                const thumbUrl = getImageUrl(img);
                const isCurrent = idx === activeLightboxIndex;
                return (
                  <button
                    key={img.path || idx}
                    type="button"
                    onClick={() => setActiveLightboxIndex(idx)}
                    className={`relative w-12 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      isCurrent ? 'border-amber-400 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
