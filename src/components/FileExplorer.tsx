'use client';

import React, { useState, useMemo, DragEvent } from 'react';
import {
  ArrowUpDown,
  CornerLeftUp,
  Check,
  HardDrive,
  Lock,
  Eye,
  EyeOff,
  UploadCloud,
  ShieldAlert,
} from 'lucide-react';
import { StorageItem, ViewMode, SortField, SortOrder, Drive } from '@/types';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { EmptyState } from './EmptyState';
import { FileListSkeleton } from './LoadingState';
import { ErrorState } from './ErrorState';

interface FileExplorerProps {
  items: StorageItem[];
  isLoading: boolean;
  error: string | null;
  currentPath: string;
  viewMode: ViewMode;
  searchQuery: string;
  onOpenFolder: (folder: StorageItem) => void;
  onNavigateUp: () => void;
  onPreviewFile: (file: StorageItem) => void;
  onDownloadFile: (file: StorageItem) => void;
  onOpenAccessModal: (folder: StorageItem) => void;
  onOpenShareModal: (folder: StorageItem) => void;
  onOpenUploadModal: () => void;
  onOpenNewFolderModal: () => void;
  onOpenNewFileModal?: () => void;
  onDeleteItem?: (item: StorageItem) => void;
  onRetry: () => void;
  onClearSearch: () => void;
  drives?: Drive[];
  selectedDriveUuid?: string | null;
  onSelectDrive?: (driveUuid: string) => void;
}

export function FileExplorer({
  items,
  isLoading,
  error,
  currentPath,
  viewMode,
  searchQuery,
  onOpenFolder,
  onNavigateUp,
  onPreviewFile,
  onDownloadFile,
  onOpenAccessModal,
  onOpenShareModal,
  onOpenUploadModal,
  onOpenNewFolderModal,
  onOpenNewFileModal,
  onDeleteItem,
  onRetry,
  onClearSearch,
  drives,
  selectedDriveUuid,
  onSelectDrive,
}: FileExplorerProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSystemFiles, setShowSystemFiles] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active drive metadata
  const activeDrive = useMemo(() => {
    if (!drives || drives.length === 0) return null;
    return drives.find((d) => d.uuid === selectedDriveUuid) || drives[0];
  }, [drives, selectedDriveUuid]);

  const rawStatus = (activeDrive?.status || 'online').toLowerCase();
  const isOffline = rawStatus === 'offline';
  const isReadOnly = rawStatus === 'online_readonly' || activeDrive?.mount_mode === 'ro';
  const isOnlineRW = !isOffline && !isReadOnly && (rawStatus === 'online' || activeDrive?.mount_mode === 'rw');

  // Count system items for badge
  const systemItemsCount = useMemo(() => {
    return items.filter((item) => item.is_system).length;
  }, [items]);

  // Filter items by system files and search query
  const filteredItems = useMemo(() => {
    let result = items;
    if (!showSystemFiles) {
      result = result.filter((item) => !item.is_system);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    return result;
  }, [items, showSystemFiles, searchQuery]);

  // Separate folders and files (Folders First as required)
  const { folders, files } = useMemo(() => {
    const f: StorageItem[] = [];
    const doc: StorageItem[] = [];

    filteredItems.forEach((item) => {
      if (item.is_dir) {
        f.push(item);
      } else {
        doc.push(item);
      }
    });

    const compareFn = (a: StorageItem, b: StorageItem) => {
      let result = 0;
      if (sortField === 'name') {
        result = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'size') {
        result = (a.size || 0) - (b.size || 0);
      } else if (sortField === 'date') {
        const dateA = a.modified ? new Date(a.modified).getTime() : 0;
        const dateB = b.modified ? new Date(b.modified).getTime() : 0;
        result = dateA - dateB;
      }
      return sortOrder === 'asc' ? result : -result;
    };

    f.sort(compareFn);
    doc.sort(compareFn);

    return { folders: f, files: doc };
  }, [filteredItems, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setShowSortDropdown(false);
  };

  // Drag and drop direct upload onto physical drive
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isReadOnly && !isOffline) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!isReadOnly && !isOffline) {
      onOpenUploadModal();
    }
  };

  if (isLoading) {
    return <FileListSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load directory"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div
      className="space-y-6 relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Active Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-neutral-900/10 backdrop-blur-xs border-2 border-dashed border-neutral-900 rounded-2xl flex flex-col items-center justify-center p-8 text-neutral-900 animate-in fade-in duration-100">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-3">
            <UploadCloud className="w-7 h-7 text-neutral-900" />
          </div>
          <p className="text-sm font-semibold">Drop files to upload to physical USB storage</p>
          <p className="text-xs text-neutral-600 mt-1">
            Destination: {currentPath ? `/${currentPath}` : 'Root'} ({activeDrive?.name || 'USB SSD'})
          </p>
        </div>
      )}

      {/* Read-Only Alert Banner if drive is mounted RO */}
      {isReadOnly && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-950">Drive is mounted in Read-Only mode</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Physical USB storage is write-protected. Files can be viewed and downloaded, but upload, new folder, and deletion are disabled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-rose-50/90 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-900 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold text-rose-950">Storage Drive Disconnected</p>
              <p className="text-rose-800 text-[11px] mt-0.5">
                Physical USB drive is offline. Reconnect the USB drive to the Raspberry Pi to restore access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-toolbar: Active Drive Pill, Navigate Up, System files toggle & Sorting */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active drive pill / selector */}
          {drives && drives.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-neutral-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <HardDrive className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              {drives.length > 1 && onSelectDrive ? (
                <select
                  value={selectedDriveUuid || ''}
                  onChange={(e) => onSelectDrive(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer pr-1"
                >
                  {drives.map((d) => (
                    <option
                      key={d.uuid || d.name}
                      value={d.uuid || ''}
                      disabled={(d.status || '').toLowerCase() === 'offline'}
                    >
                      {d.label || d.name} ({(d.status || '').toLowerCase() === 'online' ? 'Online' : 'Offline'})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-semibold text-neutral-800">
                  {activeDrive?.label || activeDrive?.name || 'Active Drive'}
                </span>
              )}

              {/* Status pill on active drive */}
              {isOnlineRW && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse" />
                  <span>Online / RW</span>
                </span>
              )}
              {isReadOnly && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                  <span>Read-Only</span>
                </span>
              )}
              {isOffline && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Offline</span>
                </span>
              )}
            </div>
          )}

          {currentPath && (
            <button
              type="button"
              onClick={onNavigateUp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 font-medium transition-all shadow-2xs cursor-pointer"
            >
              <CornerLeftUp className="w-3.5 h-3.5 text-neutral-500" />
              <span>Back</span>
            </button>
          )}

          <span className="text-neutral-400">
            {folders.length} {folders.length === 1 ? 'folder' : 'folders'}, {files.length}{' '}
            {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Right tools: System files toggle + Sort dropdown */}
        <div className="flex items-center gap-2">
          {/* System Files Toggle button */}
          {systemItemsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowSystemFiles(!showSystemFiles)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                showSystemFiles
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200/80 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
              title={showSystemFiles ? 'Hide system metadata folders' : 'Show system metadata folders like $RECYCLE.BIN'}
            >
              {showSystemFiles ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showSystemFiles ? 'Hide System Files' : `System Files (${systemItemsCount})`}</span>
            </button>
          )}

          {/* Sort selector dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 font-medium transition-all shadow-2xs cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <span className="capitalize">
                Sort: {sortField} ({sortOrder})
              </span>
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-neutral-200 shadow-lg py-1 z-20 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => toggleSort('name')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 text-left cursor-pointer"
                >
                  <span>Name</span>
                  {sortField === 'name' && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('size')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 text-left cursor-pointer"
                >
                  <span>Size</span>
                  {sortField === 'size' && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('date')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 text-left cursor-pointer"
                >
                  <span>Date modified</span>
                  {sortField === 'date' && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty Directory State */}
      {isEmpty && (
        <EmptyState
          onUpload={!isReadOnly && !isOffline ? onOpenUploadModal : undefined}
          onCreateFolder={!isReadOnly && !isOffline ? onOpenNewFolderModal : undefined}
          onCreateFile={!isReadOnly && !isOffline ? onOpenNewFileModal : undefined}
          isSearch={Boolean(searchQuery.trim())}
          onClearSearch={onClearSearch}
          isReadOnly={isReadOnly || isOffline}
        />
      )}

      {/* Folders Section (Folders first as required) */}
      {!isEmpty && folders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Folders
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              ({folders.length})
            </span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.path}
                  folder={folder}
                  viewMode="grid"
                  onOpen={() => onOpenFolder(folder)}
                  onOpenAccessSettings={onOpenAccessModal}
                  onOpenShare={onOpenShareModal}
                  onDelete={!isReadOnly && !folder.is_system && onDeleteItem ? () => onDeleteItem(folder) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.path}
                  folder={folder}
                  viewMode="list"
                  onOpen={() => onOpenFolder(folder)}
                  onOpenAccessSettings={onOpenAccessModal}
                  onOpenShare={onOpenShareModal}
                  onDelete={!isReadOnly && !folder.is_system && onDeleteItem ? () => onDeleteItem(folder) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Files Section */}
      {!isEmpty && files.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Files
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              ({files.length})
            </span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {files.map((file) => (
                <FileCard
                  key={file.path}
                  file={file}
                  viewMode="grid"
                  onPreview={onPreviewFile}
                  onDownload={onDownloadFile}
                  onDelete={!isReadOnly && !file.is_system && onDeleteItem ? () => onDeleteItem(file) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {files.map((file) => (
                <FileCard
                  key={file.path}
                  file={file}
                  viewMode="list"
                  onPreview={onPreviewFile}
                  onDownload={onDownloadFile}
                  onDelete={!isReadOnly && !file.is_system && onDeleteItem ? () => onDeleteItem(file) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
