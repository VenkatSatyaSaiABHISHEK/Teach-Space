'use client';

import React from 'react';
import {
  Presentation,
  FileText,
  Video,
  Image as ImageIcon,
  FolderOpen,
  Share2,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { ShowcaseContent } from '@/types';

interface ShowcaseHeroProps {
  title: string;
  description?: string | null;
  content: ShowcaseContent;
  driveName?: string;
  onNavigateSection: (sectionId: string) => void;
  onOpenShare?: () => void;
}

export function ShowcaseHero({
  title,
  description,
  content,
  driveName,
  onNavigateSection,
  onOpenShare,
}: ShowcaseHeroProps) {
  const hasPresentation = !!content.presentation && (!Array.isArray(content.presentation) || content.presentation.length > 0);
  const hasDocs = Array.isArray(content.documentation) && content.documentation.length > 0;
  const hasVideos = Array.isArray(content.videos) && content.videos.length > 0;
  const hasImages = Array.isArray(content.images) && content.images.length > 0;
  const hasFiles = Array.isArray(content.other_files) && content.other_files.length > 0;

  return (
    <header className="relative bg-white border-b border-neutral-200/80 pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle radial ambient highlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-b from-neutral-100/60 to-transparent pointer-events-none rounded-full blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto text-center">
        {/* Top Badges */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs font-medium text-neutral-800 mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="tracking-wide">Project Showcase</span>
          {driveName && (
            <>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-500 font-mono text-[11px] flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-neutral-400" />
                {driveName}
              </span>
            </>
          )}
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 text-balance uppercase font-sans">
          {title}
        </h1>

        {/* Hero Description */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed text-balance">
          {description || 'An interactive project showcase powered by TechSpace physical storage.'}
        </p>

        {/* Quick Jump CTAs based on detected content */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {hasPresentation && (
            <button
              type="button"
              onClick={() => onNavigateSection('presentation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <Presentation className="w-4 h-4 text-amber-300" />
              <span>View Presentation</span>
            </button>
          )}

          {hasDocs && (
            <button
              type="button"
              onClick={() => onNavigateSection('documentation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 text-xs sm:text-sm font-medium shadow-2xs hover:border-neutral-300 transition-all cursor-pointer active:scale-98"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Documentation</span>
            </button>
          )}

          {hasVideos && (
            <button
              type="button"
              onClick={() => onNavigateSection('demo')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 text-xs sm:text-sm font-medium shadow-2xs hover:border-neutral-300 transition-all cursor-pointer active:scale-98"
            >
              <Video className="w-4 h-4 text-purple-500" />
              <span>Watch Demo</span>
            </button>
          )}

          {hasImages && (
            <button
              type="button"
              onClick={() => onNavigateSection('gallery')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 text-xs sm:text-sm font-medium shadow-2xs hover:border-neutral-300 transition-all cursor-pointer active:scale-98"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span>Gallery</span>
            </button>
          )}

          {hasFiles && (
            <button
              type="button"
              onClick={() => onNavigateSection('files')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 text-xs sm:text-sm font-medium shadow-2xs hover:border-neutral-300 transition-all cursor-pointer active:scale-98"
            >
              <FolderOpen className="w-4 h-4 text-neutral-500" />
              <span>Browse Files</span>
            </button>
          )}

          {onOpenShare && (
            <button
              type="button"
              onClick={onOpenShare}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-98"
              title="Share this showcase"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
