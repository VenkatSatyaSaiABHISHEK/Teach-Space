'use client';

import React, { useState } from 'react';
import {
  Save,
  Shield,
  Sliders,
  AlertTriangle,
  Loader2,
  Check,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { TechStorageItem } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface TechStorageSettingsTabProps {
  storage: TechStorageItem;
  onStorageUpdated: (updated: TechStorageItem) => void;
}

export function TechStorageSettingsTab({
  storage,
  onStorageUpdated,
}: TechStorageSettingsTabProps) {
  const { showToast } = useToast();

  const [name, setName] = useState(storage.name);
  const [readEnabled, setReadEnabled] = useState(storage.permissions?.read ?? true);
  const [uploadEnabled, setUploadEnabled] = useState(storage.permissions?.upload ?? true);
  const [createFolderEnabled, setCreateFolderEnabled] = useState(storage.permissions?.create_folder ?? true);
  const [deleteEnabled, setDeleteEnabled] = useState(storage.permissions?.delete ?? false);
  const [rateLimit, setRateLimit] = useState(storage.rate_limit || 100);
  const [rateWindow, setRateWindow] = useState(storage.rate_window || 60);

  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Name Required', 'Storage Space name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.updateTechStorage(storage.storage_id, {
        name: name.trim(),
        read_enabled: readEnabled,
        upload_enabled: uploadEnabled,
        create_folder_enabled: createFolderEnabled,
        delete_enabled: deleteEnabled,
        rate_limit: rateLimit,
        rate_window: rateWindow,
      });

      showToast('success', 'Settings Saved', 'Storage Space configuration updated successfully.');
      onStorageUpdated(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      showToast('error', 'Update Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleApiStatus = async () => {
    setTogglingStatus(true);
    try {
      if (storage.enabled) {
        await api.revokeTechStorage(storage.storage_id);
        showToast('warning', 'API Access Revoked', 'API requests to this space are now blocked.');
        onStorageUpdated({ ...storage, enabled: false });
      } else {
        await api.restoreTechStorage(storage.storage_id);
        showToast('success', 'API Access Restored', 'API requests to this space are now active.');
        onStorageUpdated({ ...storage, enabled: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      showToast('error', 'Action Failed', msg);
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* General Settings Form */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs">
        <h3 className="text-base font-bold text-neutral-900 mb-1">General Settings</h3>
        <p className="text-xs text-neutral-500 mb-5">
          Update the display name and operational limits for this Storage Space.
        </p>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Storage Space Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
            />
          </div>

          {/* Rate Limits */}
          <div className="pt-2 border-t border-neutral-100">
            <h4 className="text-xs font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-neutral-500" />
              <span>Rate Limits & Throttling</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Max Requests Allowed
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={rateLimit}
                  onChange={(e) => setRateLimit(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                  Time Window (Seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={rateWindow}
                  onChange={(e) => setRateWindow(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              Clients sending more requests than this within the window will receive HTTP 429 Too Many Requests.
            </p>
          </div>

          {/* Permissions */}
          <div className="pt-2 border-t border-neutral-100">
            <h4 className="text-xs font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-neutral-500" />
              <span>API Permissions</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Read */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={readEnabled}
                  onChange={(e) => setReadEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div>
                  <span className="text-xs font-medium text-neutral-800">Read Files</span>
                  <p className="text-[10px] text-neutral-400">Allow listing & downloading files</p>
                </div>
              </label>

              {/* Upload */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={uploadEnabled}
                  onChange={(e) => setUploadEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div>
                  <span className="text-xs font-medium text-neutral-800">Upload Files</span>
                  <p className="text-[10px] text-neutral-400">Allow writing files via POST</p>
                </div>
              </label>

              {/* Create Folder */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createFolderEnabled}
                  onChange={(e) => setCreateFolderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div>
                  <span className="text-xs font-medium text-neutral-800">Create Folders</span>
                  <p className="text-[10px] text-neutral-400">Allow directory creation</p>
                </div>
              </label>

              {/* Delete */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteEnabled}
                  onChange={(e) => setDeleteEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 border-neutral-300"
                />
                <div>
                  <span className="text-xs font-medium text-rose-700">Delete Files</span>
                  <p className="text-[10px] text-neutral-400">Allow permanent file deletion</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98 disabled:bg-neutral-300"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Access Control & Revocation Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs">
        <h3 className="text-base font-bold text-neutral-900 mb-1">API Key Access Control</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Instantly suspend or re-activate all incoming external API traffic to this Storage Space.
        </p>

        <div className="p-4 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/60">
          <div className="flex items-start gap-3">
            {storage.enabled ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-semibold text-neutral-900">
                {storage.enabled ? 'API Access is Active' : 'API Access is Revoked'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {storage.enabled
                  ? 'Authorized requests with your API key will be processed normally.'
                  : 'All API requests with this space’s key will immediately return HTTP 401.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={togglingStatus}
            onClick={handleToggleApiStatus}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              storage.enabled
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
            }`}
          >
            {togglingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : storage.enabled ? (
              'Revoke API Access'
            ) : (
              'Restore API Access'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
