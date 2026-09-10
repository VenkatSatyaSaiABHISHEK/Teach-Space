'use client';

import React, { useState, useEffect, use, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  HardDrive,
  Folder,
  Layers,
  Code2,
  Settings2,
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Activity,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { TechStorageItem, Drive } from '@/types';
import { api, formatBytes, getTechStorageSpaceApiUrl } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { TechStorageFileManager } from '@/components/techstorage/TechStorageFileManager';
import { TechStorageApiDocs } from '@/components/techstorage/TechStorageApiDocs';
import { TechStorageSettingsTab } from '@/components/techstorage/TechStorageSettingsTab';

function StorageDetailContent({ storageId }: { storageId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'overview' | 'files' | 'api' | 'settings') || 'overview';

  const { showToast } = useToast();

  const [storage, setStorage] = useState<TechStorageItem | null>(null);
  const [drives, setDrives] = useState<Drive[]>(() => api.getCachedDrives() || []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'api' | 'settings'>(initialTab);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = getTechStorageSpaceApiUrl(storageId);

  // Sync tab with URL query parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'files', 'api', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'files' | 'api' | 'settings');
    }
  }, [searchParams]);

  // Load storage space & drives
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [fetchedStorage, fetchedDrives] = await Promise.all([
        api.getTechStorage(storageId),
        api.getDrives().catch(() => api.getCachedDrives() || []),
      ]);

      setStorage(fetchedStorage);
      if (fetchedDrives && fetchedDrives.length > 0) {
        setDrives(fetchedDrives);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load Storage Space';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic polling for physical drive connection changes
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        api.getTechStorage(storageId).catch(() => null),
        api.getDrives().catch(() => []),
      ]).then(([updatedStorage, updatedDrives]) => {
        if (updatedStorage) setStorage(updatedStorage);
        if (updatedDrives && updatedDrives.length > 0) setDrives(updatedDrives);
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [storageId]);

  // Resolve matching physical drive
  const drive = useMemo(() => {
    if (!storage || drives.length === 0) return null;
    return drives.find((d) => d.uuid === storage.drive_uuid) || null;
  }, [storage, drives]);

  // Online / Offline status
  const isDriveOnline = drive
    ? (drive.status || '').toLowerCase() === 'online' ||
      (drive.status || '').toLowerCase() === 'online_readonly'
    : false;
  const isOffline = drives.length > 0 && (!drive || !isDriveOnline);

  const copyStorageId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storageId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
        <div className="h-8 w-48 bg-neutral-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-white border border-neutral-200/80 rounded-2xl p-6 animate-pulse" />
        <div className="h-64 bg-white border border-neutral-200/80 rounded-2xl p-6 animate-pulse" />
      </div>
    );
  }

  if (error || !storage) {
    return (
      <div className="p-4 sm:p-8 max-w-xl mx-auto w-full my-12 text-center">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 shadow-2xs">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-neutral-900">Storage Space Not Found</h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">{error || 'This Storage Space does not exist.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/techstorage"
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
            >
              Back to TechStorage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Link
            href="/techstorage"
            className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>TechStorage</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-neutral-900 truncate max-w-[200px]">
            {storage.name}
          </span>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer active:scale-98"
          title="Refresh storage space"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {storage.name}
              </h1>

              {/* Status Pill */}
              {isOffline ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Storage Offline</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse" />
                  <span>Storage Online</span>
                </span>
              )}

              {/* API Status */}
              {storage.enabled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>API Disabled</span>
                </span>
              )}
            </div>

            {/* Storage ID & Drive Badge Row */}
            <div className="mt-2.5 flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-neutral-400">Storage ID:</span>
                <button
                  type="button"
                  onClick={copyStorageId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200/80 font-mono text-neutral-800 transition-colors cursor-pointer"
                >
                  <span>{storage.storage_id}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400" />
                  )}
                </button>
              </div>

              <span>•</span>

              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-mono text-neutral-700">{storage.drive_uuid}</span>
              </div>

              <span>•</span>

              <div className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-mono text-neutral-700">
                  {storage.folder_path ? `/${storage.folder_path}` : 'Root'}
                </span>
              </div>

              {storage.created_at && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-neutral-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(storage.created_at)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Offline notice inside header card if disconnected */}
        {isOffline && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">The physical storage drive is currently unavailable.</span>{' '}
              <span>
                Your Storage Space configuration is preserved and will automatically become available when the drive is reconnected.
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center gap-1 border-b border-neutral-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'files'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Files</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'api'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>API Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Storage Drive Card */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-medium text-neutral-400">Backing Drive</span>
              <p className="text-base font-bold text-neutral-900 mt-1">
                {drive?.name ? `${drive.name}` : 'USB Partition'}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {drive?.size || (drive?.total_bytes ? formatBytes(drive.total_bytes) : '119.2 GB')} Total Space
              </p>
            </div>

            {/* Folder Card */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-medium text-neutral-400">Storage Root Folder</span>
              <p className="text-base font-bold text-neutral-900 mt-1 font-mono truncate">
                {storage.folder_path ? `/${storage.folder_path}` : '/ (Root)'}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Confined directory</p>
            </div>

            {/* Rate Limits */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-medium text-neutral-400">Rate Limits</span>
              <p className="text-base font-bold text-neutral-900 mt-1">
                {storage.rate_limit || 100} req / {storage.rate_window || 60}s
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Automated throttling</p>
            </div>

            {/* Permissions */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-medium text-neutral-400">Permissions</span>
              <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                {storage.permissions?.read && (
                  <span className="px-1.5 py-0.5 bg-neutral-100 rounded font-medium text-neutral-800">
                    Read
                  </span>
                )}
                {storage.permissions?.upload && (
                  <span className="px-1.5 py-0.5 bg-neutral-100 rounded font-medium text-neutral-800">
                    Upload
                  </span>
                )}
                {storage.permissions?.create_folder && (
                  <span className="px-1.5 py-0.5 bg-neutral-100 rounded font-medium text-neutral-800">
                    Mkdir
                  </span>
                )}
                {storage.permissions?.delete ? (
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-medium">
                    Delete
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-neutral-50 text-neutral-400 rounded">
                    No-Del
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">Access boundaries</p>
            </div>
          </div>

          {/* Drive & Health Breakdown */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Storage Health & Architecture</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-2">
                <span className="font-semibold text-neutral-800">Physical Hardware Storage</span>
                <p className="text-neutral-500 leading-relaxed">
                  TechStorage is directly linked to USB drive partition{' '}
                  <code className="font-mono text-neutral-800 bg-neutral-200/60 px-1 py-0.5 rounded">
                    {storage.drive_uuid}
                  </code>
                  . Files are never stored on a third-party server; they live on your Raspberry Pi’s attached storage.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-neutral-400">Connection:</span>
                  {isOffline ? (
                    <span className="text-rose-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Disconnected
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse" />
                      Active & Mounted
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800">REST API Integration</span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Public Endpoint
                  </span>
                </div>
                <p className="text-neutral-500 leading-relaxed text-xs">
                  Your project can interact with this storage space via standard HTTP endpoints. Use your secret Bearer API key to authorize uploads, downloads, and directory listings.
                </p>
                <div className="pt-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-neutral-200 font-mono text-xs text-neutral-800 shadow-2xs">
                    <span className="truncate pr-2">{apiBaseUrl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(apiBaseUrl);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                      title="Copy API Base URL"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('api')}
                    className="text-neutral-900 font-semibold hover:underline flex items-center gap-1 text-xs"
                  >
                    <span>View Integration Docs & Snippets</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <TechStorageFileManager
          storage={storage}
          drive={drive}
          isOffline={isOffline}
        />
      )}

      {activeTab === 'api' && (
        <TechStorageApiDocs storage={storage} />
      )}

      {activeTab === 'settings' && (
        <TechStorageSettingsTab
          storage={storage}
          onStorageUpdated={(updated) => setStorage(updated)}
        />
      )}
    </div>
  );
}

export default function TechStorageDetailPage({
  params,
}: {
  params: Promise<{ storageId: string }>;
}) {
  const resolvedParams = use(params);
  const storageId = resolvedParams.storageId;

  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="h-8 w-48 bg-neutral-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <StorageDetailContent storageId={storageId} />
    </Suspense>
  );
}
