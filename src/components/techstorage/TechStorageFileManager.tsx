'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Search,
  File,
  FileText,
  FileCode,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  AlertTriangle,
  ChevronRight,
  Home,
  Loader2,
  Eye,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { StorageItem, TechStorageItem, Drive } from '@/types';
import { api, formatBytes, getApiBaseUrl } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface TechStorageFileManagerProps {
  storage: TechStorageItem;
  drive: Drive | null;
  isOffline: boolean;
}

export function TechStorageFileManager({
  storage,
  drive,
  isOffline,
}: TechStorageFileManagerProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subpath navigation relative to storage.folder_path
  const [subPath, setSubPath] = useState('');
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [folderMissing, setFolderMissing] = useState(false);
  const [initializingFolder, setInitializingFolder] = useState(false);

  // Upload modal / state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // New folder modal
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Delete item modal
  const [itemToDelete, setItemToDelete] = useState<StorageItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Calculate full path on the physical drive
  const rootFolder = (storage.folder_path || '').trim().replace(/^\/+|\/+$/g, '');
  const currentPhysicalPath = useMemo(() => {
    if (!subPath) return rootFolder;
    return rootFolder ? `${rootFolder}/${subPath}` : subPath;
  }, [rootFolder, subPath]);

  // Load files
  const loadFiles = useCallback(async (isRefresh = false) => {
    if (isOffline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);

    try {
      const files = await api.getFiles(currentPhysicalPath, storage.drive_uuid);
      setItems(files || []);
      setFolderMissing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load files';
      // If folder does not exist on physical drive yet, attempt auto-initialization
      if (
        (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('could not be found')) &&
        storage.drive_uuid
      ) {
        if (currentPhysicalPath) {
          try {
            await api.createFolder(currentPhysicalPath, storage.drive_uuid);
            const retriedFiles = await api.getFiles(currentPhysicalPath, storage.drive_uuid);
            setItems(retriedFiles || []);
            setFolderMissing(false);
            setLoadError(null);
            return;
          } catch {
            setFolderMissing(true);
            setLoadError(null);
            setItems([]);
            return;
          }
        }
      }
      setLoadError(msg);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOffline, currentPhysicalPath, storage.drive_uuid]);

  const handleInitializeFolder = async () => {
    setInitializingFolder(true);
    try {
      await api.createFolder(currentPhysicalPath, storage.drive_uuid);
      showToast('success', 'Folder Initialized', `Created folder /${currentPhysicalPath} on drive.`);
      setFolderMissing(false);
      await loadFiles(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize folder';
      showToast('error', 'Initialization Failed', msg);
    } finally {
      setInitializingFolder(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Navigation handlers
  const handleOpenFolder = (folderName: string) => {
    setSubPath((prev) => (prev ? `${prev}/${folderName}` : folderName));
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setSubPath('');
      return;
    }
    const parts = subPath.split('/').filter(Boolean);
    const newParts = parts.slice(0, index + 1);
    setSubPath(newParts.join('/'));
  };

  // Upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isOffline) {
      showToast('error', 'Storage Offline', 'Cannot upload while physical drive is offline.');
      return;
    }

    const file = files[0];
    setUploading(true);
    setUploadProgress(0);

    try {
      await api.uploadFile(
        file,
        currentPhysicalPath,
        (percent) => setUploadProgress(percent),
        storage.drive_uuid
      );
      showToast('success', 'File Uploaded', `${file.name} uploaded successfully.`);
      await loadFiles(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast('error', 'Upload Failed', msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Create folder handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const folderName = newFolderName.trim();
    if (!folderName) return;

    if (isOffline) {
      showToast('error', 'Storage Offline', 'Cannot create folder while storage is offline.');
      return;
    }

    setCreatingFolder(true);
    const targetPath = currentPhysicalPath ? `${currentPhysicalPath}/${folderName}` : folderName;

    try {
      await api.createFolder(targetPath, storage.drive_uuid);
      showToast('success', 'Folder Created', `Created folder "${folderName}".`);
      setNewFolderModalOpen(false);
      setNewFolderName('');
      await loadFiles(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create folder';
      showToast('error', 'Creation Failed', msg);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Delete handler
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await api.deleteItem(itemToDelete.path, storage.drive_uuid);
      showToast('success', 'Item Deleted', `Deleted ${itemToDelete.name}.`);
      setItemToDelete(null);
      await loadFiles(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete item';
      showToast('error', 'Deletion Failed', msg);
    } finally {
      setDeleting(false);
    }
  };

  // Download handler
  const handleDownload = (item: StorageItem) => {
    void api.downloadFile(item.path, item.name, storage.drive_uuid);
  };

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Icon helper
  const getFileIcon = (item: StorageItem) => {
    if (item.is_dir) {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
    }
    const ext = (item.extension || item.name.split('.').pop() || '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    }
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return <Music className="w-5 h-5 text-pink-500" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-blue-500" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <Archive className="w-5 h-5 text-amber-600" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    return <File className="w-5 h-5 text-neutral-400" />;
  };

  const breadcrumbs = subPath.split('/').filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-semibold text-rose-900">Physical Storage Offline</p>
            <p className="text-xs text-rose-700 mt-0.5">
              The physical storage drive is currently disconnected. Storage is currently offline. Files cannot be accessed, uploaded, or deleted until the physical drive is reconnected.
            </p>
          </div>
        </div>
      )}

      {/* Action & Search Bar */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        {/* Breadcrumb row */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => handleNavigateToBreadcrumb(-1)}
            className="flex items-center gap-1 font-semibold text-neutral-900 hover:text-neutral-700 transition-colors shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{rootFolder || 'Storage Root'}</span>
          </button>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
              <button
                type="button"
                onClick={() => handleNavigateToBreadcrumb(idx)}
                className={`truncate max-w-[120px] transition-colors shrink-0 ${
                  idx === breadcrumbs.length - 1
                    ? 'font-semibold text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {crumb}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => loadFiles(true)}
            disabled={refreshing || isOffline}
            className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* New Folder Button */}
          <button
            type="button"
            disabled={isOffline || !storage.permissions?.create_folder}
            onClick={() => setNewFolderModalOpen(true)}
            title={
              !storage.permissions?.create_folder
                ? 'Create Folder permission is disabled'
                : 'Create a new subfolder'
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            disabled={isOffline || !storage.permissions?.upload || uploading}
            onClick={() => fileInputRef.current?.click()}
            title={
              !storage.permissions?.upload
                ? 'Upload permission is disabled'
                : 'Upload a file to this folder'
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98 disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter files in this folder..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200/90 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors shadow-2xs"
        />
      </div>

      {/* Files List / Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-neutral-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-600 mb-2" />
            <p className="text-xs">Loading storage files...</p>
          </div>
        ) : isOffline ? (
          <div className="p-10 text-center text-neutral-500">
            <AlertTriangle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-800">Storage Offline</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Files will appear automatically once physical drive {storage.drive_uuid} is plugged in.
            </p>
          </div>
        ) : folderMissing ? (
          <div className="p-10 text-center text-neutral-600">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-800 border border-neutral-200/60">
              <FolderPlus className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Folder Not Initialized on Drive</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
              The folder <code className="font-mono text-neutral-800 bg-neutral-100 px-1 py-0.5 rounded">/{currentPhysicalPath}</code> does not exist on physical drive {storage.drive_uuid} yet.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleInitializeFolder}
                disabled={initializingFolder}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                {initializingFolder ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Initializing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Initialize Folder on Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : loadError ? (
          <div className="p-8 text-center text-rose-600">
            <p className="text-xs sm:text-sm">{loadError}</p>
            <button
              type="button"
              onClick={() => loadFiles(true)}
              className="mt-3 px-4 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Folder className="w-10 h-10 stroke-[1.25] text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-700">No files in this directory</p>
            <p className="text-xs text-neutral-400 mt-1">
              Upload files or connect via API to store data.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 overflow-x-auto">
            <div className="grid grid-cols-12 px-4 py-2.5 bg-neutral-50/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-6">Name</div>
              <div className="col-span-3 sm:col-span-2 text-right sm:text-left">Size</div>
              <div className="hidden sm:block sm:col-span-2">Modified</div>
              <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
            </div>

            {filteredItems.map((item) => (
              <div
                key={item.path}
                className="grid grid-cols-12 px-4 py-3 items-center text-xs hover:bg-neutral-50/70 transition-colors group"
              >
                {/* Name */}
                <div className="col-span-6 sm:col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="shrink-0">{getFileIcon(item)}</span>
                  {item.is_dir ? (
                    <button
                      type="button"
                      onClick={() => handleOpenFolder(item.name)}
                      className="font-medium text-neutral-900 hover:underline truncate text-left cursor-pointer"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <span className="font-medium text-neutral-800 truncate">{item.name}</span>
                  )}
                </div>

                {/* Size */}
                <div className="col-span-3 sm:col-span-2 text-right sm:text-left text-neutral-500 font-mono text-[11px]">
                  {item.is_dir ? '—' : item.size_formatted || formatBytes(item.size)}
                </div>

                {/* Modified */}
                <div className="hidden sm:block sm:col-span-2 text-neutral-400 text-[11px]">
                  {item.modified
                    ? new Date(item.modified).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </div>

                {/* Actions */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                  {!item.is_dir && (
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      title="Download file"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {storage.permissions?.delete && (
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      title="Delete item"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {newFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">New Folder</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Create a subfolder in {currentPhysicalPath || 'root'}
            </p>

            <form onSubmit={handleCreateFolder} className="mt-4 space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewFolderModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 disabled:bg-neutral-300"
                >
                  {creatingFolder ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">Delete Item</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Are you sure you want to permanently delete{' '}
              <strong className="text-neutral-800">{itemToDelete.name}</strong> from physical storage?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 rounded-xl text-xs text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:bg-rose-300 flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
