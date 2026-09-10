'use client';

import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileCode,
  Archive,
  File,
  Download,
  Eye,
  Lock,
  Trash2,
} from 'lucide-react';
import { StorageItem, ViewMode } from '@/types';

interface FileCardProps {
  file: StorageItem;
  viewMode: ViewMode;
  onPreview: (file: StorageItem) => void;
  onDownload: (file: StorageItem) => void;
  onDelete?: (file: StorageItem) => void;
}

export function getFileMeta(file: StorageItem) {
  const ext = file.extension || (file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '') || '';

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
    return {
      type: 'image',
      label: ext.toUpperCase() || 'IMAGE',
      icon: ImageIcon,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
      iconColor: 'text-emerald-600',
    };
  }

  if (['mp4', 'mkv', 'mov', 'webm', 'avi'].includes(ext)) {
    return {
      type: 'video',
      label: 'VIDEO',
      icon: Video,
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200/60',
      iconColor: 'text-violet-600',
    };
  }

  if (['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext)) {
    return {
      type: 'audio',
      label: 'AUDIO',
      icon: Music,
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200/60',
      iconColor: 'text-pink-600',
    };
  }

  if (ext === 'pdf') {
    return {
      type: 'pdf',
      label: 'PDF',
      icon: FileText,
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/60',
      iconColor: 'text-rose-600',
    };
  }

  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
    return {
      type: 'archive',
      label: 'ARCHIVE',
      icon: Archive,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200/60',
      iconColor: 'text-orange-600',
    };
  }

  if (['js', 'ts', 'tsx', 'jsx', 'py', 'json', 'html', 'css', 'sh', 'c', 'cpp'].includes(ext)) {
    return {
      type: 'code',
      label: ext.toUpperCase(),
      icon: FileCode,
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200/60',
      iconColor: 'text-cyan-600',
    };
  }

  if (['txt', 'md', 'doc', 'docx', 'rtf'].includes(ext)) {
    return {
      type: 'document',
      label: 'DOC',
      icon: FileText,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/60',
      iconColor: 'text-blue-600',
    };
  }

  return {
    type: 'generic',
    label: ext.toUpperCase() || 'FILE',
    icon: File,
    bgColor: 'bg-neutral-100',
    borderColor: 'border-neutral-200',
    iconColor: 'text-neutral-600',
  };
}

export function FileCard({
  file,
  viewMode,
  onPreview,
  onDownload,
  onDelete,
}: FileCardProps) {
  const meta = getFileMeta(file);
  const Icon = meta.icon;
  const isProtected = file.access_status === 'protected' || file.is_protected;

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onPreview(file)}
        className="group flex items-center justify-between px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200/70 rounded-xl transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className={`w-8 h-8 rounded-lg ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center shrink-0`}
          >
            <Icon className={`w-4 h-4 ${meta.iconColor}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-neutral-900 truncate group-hover:text-neutral-950">
                {file.name}
              </p>
              {isProtected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-full shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Protected</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
              <span className="font-mono">{file.size_formatted || '0 B'}</span>
              <span>•</span>
              <span className="uppercase text-[10px] font-mono tracking-wider">
                {meta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div
          className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title={isProtected ? 'Unlock & Preview' : 'Preview file'}
          >
            {isProtected ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onDownload(file)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete file"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={() => onPreview(file)}
      className="group bg-white hover:bg-neutral-50/80 border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className={`w-10 h-10 rounded-xl ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
          >
            <Icon className={`w-5 h-5 ${meta.iconColor}`} />
          </div>

          <div className="flex items-center gap-1">
            {isProtected && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md" title="Password Protected">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-neutral-100/80 text-neutral-600 font-medium">
              {meta.label}
            </span>
          </div>
        </div>

        <h3 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-neutral-950 mb-1" title={file.name}>
          {file.name}
        </h3>

        <p className="text-[11px] font-mono text-neutral-400">
          {file.size_formatted || '0 B'}
        </p>
      </div>

      {/* Footer actions */}
      <div
        className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onPreview(file)}
          className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          {isProtected ? <Lock className="w-3 h-3 text-amber-600" /> : <Eye className="w-3 h-3 text-neutral-400" />}
          <span>{isProtected ? 'Unlock' : 'Preview'}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDownload(file)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete file"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
