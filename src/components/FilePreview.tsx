'use client';

import React from 'react';
import {
  X,
  Download,
  Calendar,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { StorageItem } from '@/types';
import { api } from '@/lib/api';
import { getFileMeta } from './FileCard';

interface FilePreviewProps {
  file: StorageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: StorageItem) => void;
}

export function FilePreview({
  file,
  isOpen,
  onClose,
  onDownload,
}: FilePreviewProps) {
  if (!isOpen || !file) return null;

  const meta = getFileMeta(file);
  const downloadUrl = api.getDownloadUrl(file.path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center shrink-0`}
            >
              <meta.icon className={`w-4 h-4 ${meta.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-900 truncate" title={file.name}>
                {file.name}
              </h2>
              <p className="text-[11px] font-mono text-neutral-400">
                {file.size_formatted || 'Unknown size'} • {meta.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg transition-colors ml-1"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Stage */}
        <div className="flex-1 bg-neutral-100/70 overflow-auto flex items-center justify-center p-4 sm:p-8 min-h-[300px]">
          {meta.type === 'image' && (
            <div className="relative max-h-[60vh] max-w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl}
                alt={file.name}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md transition-opacity duration-200"
              />
            </div>
          )}

          {meta.type === 'video' && (
            <div className="max-w-3xl w-full">
              <video
                src={downloadUrl}
                controls
                autoPlay={false}
                className="w-full max-h-[60vh] rounded-xl shadow-md bg-black"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {meta.type === 'audio' && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-200/60 flex items-center justify-center text-pink-600 mx-auto">
                <meta.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{file.name}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{file.size_formatted}</p>
              </div>
              <audio src={downloadUrl} controls className="w-full" />
            </div>
          )}

          {meta.type === 'pdf' && (
            <div className="w-full h-[65vh] rounded-xl overflow-hidden shadow-sm border border-neutral-200 bg-white">
              <iframe
                src={`${downloadUrl}#toolbar=0`}
                className="w-full h-full"
                title={file.name}
              />
            </div>
          )}

          {['generic', 'archive', 'code', 'document'].includes(meta.type) && (
            <div className="bg-white p-8 rounded-2xl border border-neutral-200/80 shadow-xs max-w-sm w-full text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-2xl ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center ${meta.iconColor} mx-auto`}
              >
                <meta.icon className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-neutral-900 break-words">{file.name}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Preview not available for this file type
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onDownload(file)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download file</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Details Bar */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-white text-xs text-neutral-500 shrink-0 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
              <span>{file.size_formatted || '0 B'}</span>
            </div>

            {file.modified && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Modified: {String(file.modified)}</span>
              </div>
            )}

            <div className="text-[11px] font-mono text-neutral-400">
              Path: /{file.path}
            </div>
          </div>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open in new tab</span>
          </a>
        </div>
      </div>
    </div>
  );
}
