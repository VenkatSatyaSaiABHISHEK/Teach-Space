'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  ArrowLeft,
  Presentation as PresentationIcon,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { ShowcaseContentItem } from '@/types';

interface PresentationViewerProps {
  shareToken: string;
  presentationFile?: ShowcaseContentItem | null;
  onBack: () => void;
  downloadUrl?: string;
}

export function PresentationViewer({
  shareToken,
  presentationFile,
  onBack,
  downloadUrl,
}: PresentationViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // The backend PDF preview stream endpoint
  const pdfUrl = `/api/backend/showcase/${encodeURIComponent(shareToken)}/presentation?inline=true`;
  const viewerSrc = `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&view=Fit`;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not permitted or cancelled
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (totalPages ? Math.min(totalPages, prev + 1) : prev + 1));
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-neutral-900 text-white rounded-2xl overflow-hidden shadow-xl border border-neutral-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' : 'w-full my-6'
      }`}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-900/90 border-b border-neutral-800/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Showcase</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span>•</span>
            <span className="flex items-center gap-1 text-neutral-300 font-medium truncate max-w-xs">
              <PresentationIcon className="w-3.5 h-3.5 text-amber-400" />
              {presentationFile?.name || 'Project Presentation'}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
            title="Open slides in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Tab</span>
          </a>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={presentationFile?.name || 'Presentation.pptx'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
              title="Download presentation file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </a>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen presentation'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close presentation"
            aria-label="Close presentation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Presentation Stage */}
      <div className="relative flex-1 bg-neutral-950 flex items-center justify-center min-h-[500px] sm:min-h-[600px] lg:min-h-[680px] p-2 sm:p-4">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/80 z-10 text-neutral-400">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-3" />
            <p className="text-xs sm:text-sm font-medium">Loading presentation slide...</p>
          </div>
        )}

        <div className="w-full h-full max-w-6xl aspect-[16/9] bg-neutral-900 rounded-xl overflow-hidden shadow-2xl border border-neutral-800/80 relative">
          <iframe
            ref={iframeRef}
            src={viewerSrc}
            title="Presentation Slide"
            className="w-full h-full border-0 bg-white"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      {/* Bottom Slide Controller Navigation */}
      <div className="px-4 sm:px-6 py-3.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between shrink-0">
        <div className="text-xs text-neutral-400 hidden sm:block">
          Use <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[10px]">←</kbd> and{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[10px]">→</kbd> to navigate
        </div>

        {/* Slide navigation controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className={`p-2 rounded-xl border border-neutral-700 flex items-center justify-center transition-colors cursor-pointer ${
              currentPage <= 1
                ? 'bg-neutral-800/40 text-neutral-600 border-neutral-800 cursor-not-allowed'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white active:scale-95'
            }`}
            title="Previous Slide"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-800/80 border border-neutral-700/80 text-xs font-mono font-medium text-neutral-200">
            <span>Slide</span>
            <span className="font-bold text-amber-400">{currentPage}</span>
            {totalPages && (
              <>
                <span className="text-neutral-500">/</span>
                <span className="text-neutral-400">{totalPages}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={totalPages !== null && currentPage >= totalPages}
            className={`p-2 rounded-xl border border-neutral-700 flex items-center justify-center transition-colors cursor-pointer ${
              totalPages !== null && currentPage >= totalPages
                ? 'bg-neutral-800/40 text-neutral-600 border-neutral-800 cursor-not-allowed'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white active:scale-95'
            }`}
            title="Next Slide"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
