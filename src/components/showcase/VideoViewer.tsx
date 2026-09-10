'use client';

import React, { useState, useRef } from 'react';
import {
  Video as VideoIcon,
  ArrowLeft,
  Play,
  Film,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { ShowcaseContentItem } from '@/types';

interface VideoViewerProps {
  videos: ShowcaseContentItem[];
  driveUuid: string;
  folderPath: string;
  onBack?: () => void;
}

export function VideoViewer({
  videos,
  driveUuid,
  folderPath,
  onBack,
}: VideoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentVideo = videos[currentIndex] || videos[0];
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!currentVideo) return null;

  const getVideoUrl = (video: ShowcaseContentItem) => {
    const cleanPath = video.path.startsWith(folderPath)
      ? video.path
      : `${folderPath.replace(/\/+$/, '')}/${video.path.replace(/^\/+/, '')}`;
    const params = new URLSearchParams({ path: cleanPath, inline: 'true' });
    return `/api/backend/download/${encodeURIComponent(driveUuid)}?${params.toString()}`;
  };

  const currentVideoUrl = getVideoUrl(currentVideo);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-xl my-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-900/90 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Showcase</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-neutral-400 min-w-0">
            {onBack && <span>•</span>}
            <span className="flex items-center gap-1.5 text-neutral-200 font-medium truncate">
              <VideoIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{currentVideo.name}</span>
            </span>
          </div>
        </div>

        <a
          href={currentVideoUrl}
          download={currentVideo.name}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
          title="Download video file"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>

      {/* Video Player Display */}
      <div className="relative bg-black flex items-center justify-center aspect-video w-full max-h-[640px]">
        <video
          ref={videoRef}
          key={currentVideoUrl}
          src={currentVideoUrl}
          controls
          playsInline
          className="w-full h-full object-contain max-h-[640px]"
        >
          Your browser does not support HTML5 video playback.
        </video>
      </div>

      {/* Video Playlist Bar if multiple demo videos exist */}
      {videos.length > 1 && (
        <div className="p-4 bg-neutral-900/80 border-t border-neutral-800">
          <p className="text-xs font-medium text-neutral-400 mb-2.5 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-neutral-500" />
            <span>Project Demos ({videos.length})</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {videos.map((vid, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={vid.path || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-950/40 border-purple-500/50 text-white'
                      : 'bg-neutral-800/60 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{vid.name}</p>
                    {vid.size && (
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {formatFileSize(vid.size)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
