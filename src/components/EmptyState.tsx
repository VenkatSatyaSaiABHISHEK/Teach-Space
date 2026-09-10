'use client';

import React from 'react';
import { Cloud, Upload, FolderPlus, FilePlus } from 'lucide-react';

interface EmptyStateProps {
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onCreateFile?: () => void;
  isSearch?: boolean;
  onClearSearch?: () => void;
  isReadOnly?: boolean;
}

export function EmptyState({
  onUpload,
  onCreateFolder,
  onCreateFile,
  isSearch = false,
  onClearSearch,
  isReadOnly = false,
}: EmptyStateProps) {
  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-neutral-200/80 rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
          <Cloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">No files found</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          No files or folders matched your search query. Try another keyword.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-4 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center bg-white border border-neutral-200/80 rounded-2xl shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100/90 border border-neutral-200/60 flex items-center justify-center text-neutral-400 mb-4">
        <Cloud className="w-7 h-7 text-neutral-500" />
      </div>

      <h3 className="text-base font-semibold text-neutral-900">
        {isReadOnly ? 'Drive is empty (Read-Only)' : 'Your cloud is empty'}
      </h3>
      <p className="text-xs text-neutral-500 mt-1 max-w-sm">
        {isReadOnly
          ? 'This USB drive contains no files and is mounted in read-only mode.'
          : 'Create a new file, upload existing files, or create a folder to get started.'}
      </p>

      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          {onCreateFile && (
            <button
              type="button"
              onClick={onCreateFile}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5 text-neutral-500" />
              <span>Create File</span>
            </button>
          )}

          {onCreateFolder && (
            <button
              type="button"
              onClick={onCreateFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-neutral-500" />
              <span>Create Folder</span>
            </button>
          )}

          {onUpload && (
            <button
              type="button"
              onClick={onUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
