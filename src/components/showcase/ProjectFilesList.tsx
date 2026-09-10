'use client';

import React, { useState } from 'react';
import {
  FileText,
  Presentation,
  Video,
  Image as ImageIcon,
  File,
  Download,
  Eye,
  Search,
  HardDrive,
} from 'lucide-react';
import { ShowcaseContentItem } from '@/types';

interface ProjectFilesListProps {
  files: ShowcaseContentItem[];
  driveUuid: string;
  folderPath: string;
  onPreviewItem?: (item: ShowcaseContentItem) => void;
}

export function ProjectFilesList({
  files,
  driveUuid,
  folderPath,
  onPreviewItem,
}: ProjectFilesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const formatFileSize = (bytes?: number | null) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (filename: string) => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (['pptx', 'ppt', 'key', 'odp'].includes(ext)) {
      return <Presentation className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    }
    if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) {
      return <Video className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
  };

  const getFileDownloadUrl = (item: ShowcaseContentItem) => {
    const cleanPath = item.path.startsWith(folderPath)
      ? item.path
      : `${folderPath.replace(/\/+$/, '')}/${item.path.replace(/^\/+/, '')}`;
    const params = new URLSearchParams({ path: cleanPath });
    return `/api/backend/download/${encodeURIComponent(driveUuid)}?${params.toString()}`;
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-2xs">
      {/* Header & Search Bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Project Files</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {files.length} {files.length === 1 ? 'file' : 'files'} stored on physical drive
          </p>
        </div>

        {files.length > 5 && (
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-500">
          No files match your search.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {filteredFiles.map((file, idx) => {
            const ext = (file.name.split('.').pop() || '').toUpperCase();
            const downloadUrl = getFileDownloadUrl(file);
            const canPreview =
              ['PPTX', 'PPT', 'PDF', 'PNG', 'JPG', 'JPEG', 'WEBP', 'MP4', 'WEBM', 'TXT', 'MD'].includes(
                ext
              );

            return (
              <div
                key={file.path || idx}
                className="p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors group"
              >
                {/* File Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    {getFileIcon(file.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                      <span className="font-mono uppercase font-semibold text-neutral-500">
                        {ext || 'FILE'}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {canPreview && onPreviewItem && (
                    <button
                      type="button"
                      onClick={() => onPreviewItem(file)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Preview file"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                  )}

                  <a
                    href={downloadUrl}
                    download={file.name}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200/80 transition-colors cursor-pointer shadow-2xs"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
