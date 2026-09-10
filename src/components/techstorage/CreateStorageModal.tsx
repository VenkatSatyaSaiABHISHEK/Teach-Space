'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  HardDrive,
  Folder,
  Sliders,
  Shield,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { Drive, CreateTechStorageResponse } from '@/types';
import { api, formatBytes } from '@/lib/api';

interface CreateStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  drives: Drive[];
  onCreated: (newStorage: CreateTechStorageResponse) => void;
}

export function CreateStorageModal({
  isOpen,
  onClose,
  drives,
  onCreated,
}: CreateStorageModalProps) {
  const [name, setName] = useState('');
  const [selectedDriveUuid, setSelectedDriveUuid] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rateLimit, setRateLimit] = useState(100);
  const [rateWindow, setRateWindow] = useState(60);

  // Permissions checkboxes
  const [readEnabled, setReadEnabled] = useState(true);
  const [uploadEnabled, setUploadEnabled] = useState(true);
  const [createFolderEnabled, setCreateFolderEnabled] = useState(true);
  const [deleteEnabled, setDeleteEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first online drive or first available drive
  useEffect(() => {
    if (drives && drives.length > 0) {
      const onlineDrive = drives.find(
        (d) =>
          (d.status || '').toLowerCase() === 'online' ||
          (d.status || '').toLowerCase() === 'online_readonly'
      );
      setSelectedDriveUuid(onlineDrive?.uuid || drives[0].uuid || '');
    }
  }, [drives]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setFolderPath('');
      setRateLimit(100);
      setRateWindow(60);
      setReadEnabled(true);
      setUploadEnabled(true);
      setCreateFolderEnabled(true);
      setDeleteEnabled(false);
      setShowAdvanced(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name for your Storage Space.');
      return;
    }
    if (!selectedDriveUuid) {
      setError('Please select a physical storage drive.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanFolder = folderPath.trim().replace(/^\/+/, '');
      if (cleanFolder && selectedDriveUuid) {
        // Auto-create folder on physical drive so it exists immediately
        await api.createFolder(cleanFolder, selectedDriveUuid).catch(() => {});
      }

      const result = await api.createTechStorage({
        name: name.trim(),
        drive_uuid: selectedDriveUuid,
        folder_path: cleanFolder,
        read_enabled: readEnabled,
        upload_enabled: uploadEnabled,
        create_folder_enabled: createFolderEnabled,
        delete_enabled: deleteEnabled,
        rate_limit: rateLimit,
        rate_window: rateWindow,
      });

      if (result.api_key && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`ts_key_${result.storage_id}`, result.api_key);
        } catch {}
      }

      onCreated(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create Storage Space';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative bg-white border border-neutral-200/90 rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Create Storage Space
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Connect an API-ready space backed by physical storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Creation Error</p>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Space Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Storage Space Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My Project Assets, WebApp Storage"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
            />
          </div>

          {/* Physical Drive Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Physical Storage Drive <span className="text-rose-500">*</span>
            </label>
            {drives.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No storage drives connected to Raspberry Pi. Please plug in a USB storage drive.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedDriveUuid}
                  onChange={(e) => setSelectedDriveUuid(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 appearance-none focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors cursor-pointer"
                >
                  {drives.map((d) => {
                    const status = (d.status || '').toLowerCase();
                    const isOnline = status === 'online' || status === 'online_readonly';
                    const sizeStr = d.size || (d.total_bytes ? formatBytes(d.total_bytes) : '');
                    return (
                      <option key={d.uuid || d.name} value={d.uuid}>
                        {d.name} {d.label ? `(${d.label})` : ''} — {sizeStr} ({isOnline ? 'Online' : 'Offline'})
                      </option>
                    );
                  })}
                </select>
                <HardDrive className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            <p className="text-[11px] text-neutral-400 mt-1">
              TechStorage binds securely to this physical USB drive by UUID.
            </p>
          </div>

          {/* Folder Path */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Target Folder Path <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. ProjectData or leave empty for root"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
              />
              <Folder className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              All API read/write operations will be confined inside this folder.
            </p>
          </div>

          {/* Permissions Section */}
          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              API Permissions
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Read */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={readEnabled}
                  onChange={(e) => setReadEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div className="text-xs">
                  <span className="font-medium text-neutral-800">Read Files</span>
                  <p className="text-[10px] text-neutral-400">List & download</p>
                </div>
              </label>

              {/* Upload */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={uploadEnabled}
                  onChange={(e) => setUploadEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div className="text-xs">
                  <span className="font-medium text-neutral-800">Upload Files</span>
                  <p className="text-[10px] text-neutral-400">Write project files</p>
                </div>
              </label>

              {/* Create Folder */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createFolderEnabled}
                  onChange={(e) => setCreateFolderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div className="text-xs">
                  <span className="font-medium text-neutral-800">Create Folders</span>
                  <p className="text-[10px] text-neutral-400">Sub-directories</p>
                </div>
              </label>

              {/* Delete */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteEnabled}
                  onChange={(e) => setDeleteEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div className="text-xs">
                  <span className="font-medium text-rose-700">Delete Files</span>
                  <p className="text-[10px] text-neutral-400">Destructive access</p>
                </div>
              </label>
            </div>
          </div>

          {/* Advanced Rate Limits Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide' : 'Configure'} Rate Limits & Quotas</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Rate Limit (Requests)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={rateLimit}
                    onChange={(e) => setRateLimit(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Window (Seconds)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3600}
                    value={rateWindow}
                    onChange={(e) => setRateWindow(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || drives.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Space...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Storage Space</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
