'use client';

import React from 'react';
import {
  Folder,
  Globe,
  Lock,
  Share2,
  Settings,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { StorageItem, ViewMode } from '@/types';

interface FolderCardProps {
  folder: StorageItem;
  viewMode: ViewMode;
  onOpen: (path: string) => void;
  onOpenAccessSettings: (folder: StorageItem) => void;
  onOpenShare: (folder: StorageItem) => void;
  onDelete?: (folder: StorageItem) => void;
}

export function FolderCard({
  folder,
  viewMode,
  onOpen,
  onOpenAccessSettings,
  onOpenShare,
  onDelete,
}: FolderCardProps) {
  const isPublic = folder.access_status === 'public' || folder.is_public;
  const isProtected = folder.access_status === 'protected' || folder.is_protected;

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpen(folder.path)}
        className="group flex items-center justify-between px-4 py-3 bg-white hover:bg-neutral-50 border border-neutral-200/70 rounded-xl transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 shrink-0">
            <Folder className="w-4 h-4 fill-amber-500/20 text-amber-600" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-900 truncate group-hover:text-neutral-950">
                {folder.name}
              </span>

              {/* Status badges */}
              {isPublic && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded-full">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Public</span>
                </span>
              )}
              {isProtected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Protected</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              {folder.item_count !== undefined ? `${folder.item_count} items` : 'Folder'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {isPublic && (
            <button
              type="button"
              onClick={() => onOpenShare(folder)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 transition-colors"
              title="Share public folder"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenAccessSettings(folder)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Folder access settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(folder)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete folder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 transition-colors ml-1" />
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={() => onOpen(folder.path)}
      className="group bg-white hover:bg-neutral-50/80 border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
            <Folder className="w-5 h-5 fill-amber-500/20 text-amber-600" />
          </div>

          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {isPublic && (
              <button
                type="button"
                onClick={() => onOpenShare(folder)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 transition-colors"
                title="Share link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenAccessSettings(folder)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              title="Access settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(folder)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete folder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-neutral-950 mb-1">
          {folder.name}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400">
            {folder.item_count !== undefined ? `${folder.item_count} items` : 'Folder'}
          </span>
        </div>
      </div>

      {/* Access status badges */}
      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
        {isPublic ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
            <Globe className="w-2.5 h-2.5" />
            <span>Public</span>
          </span>
        ) : isProtected ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
            <Lock className="w-2.5 h-2.5" />
            <span>Protected</span>
          </span>
        ) : (
          <span className="text-[10px] text-neutral-400 font-medium">Private</span>
        )}

        <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
      </div>
    </div>
  );
}
