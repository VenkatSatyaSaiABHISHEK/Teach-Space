'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Database,
  Plus,
  RefreshCw,
  Search,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TechStorageItem, Drive, CreateTechStorageResponse } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { TechStorageCard } from '@/components/techstorage/TechStorageCard';
import { CreateStorageModal } from '@/components/techstorage/CreateStorageModal';
import { ApiKeyModal } from '@/components/techstorage/ApiKeyModal';

export default function TechStoragePage() {
  const { showToast } = useToast();

  // Safe client hydration states
  const [storages, setStorages] = useState<TechStorageItem[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdStorageResponse, setCreatedStorageResponse] = useState<CreateTechStorageResponse | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  // Load drives and storages from real backend
  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    setLoadError(null);

    try {
      const [fetchedDrives, fetchedStorages] = await Promise.all([
        api.getDrives().catch((err) => {
          console.warn('Failed to refresh drives in TechStorage:', err);
          return api.getCachedDrives() || [];
        }),
        api.getTechStorages().catch((err) => {
          const msg = err instanceof Error ? err.message : 'Failed to fetch storage spaces';
          return Promise.reject(new Error(msg));
        }),
      ]);

      if (fetchedDrives && fetchedDrives.length > 0) {
        setDrives(fetchedDrives);
      }

      setStorages(fetchedStorages);
    } catch (err) {
      const existing = api.getCachedTechStorages();
      if (!existing || existing.length === 0) {
        const msg = err instanceof Error ? err.message : 'Cannot connect to storage server.';
        setLoadError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Section 11: Periodic polling (every 6 seconds) for dynamic physical drive online/offline status
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Background silent poll
      Promise.all([
        api.getDrives().catch(() => []),
        api.getTechStorages().catch(() => []),
      ]).then(([newDrives, newStorages]) => {
        if (newDrives && newDrives.length > 0) {
          setDrives(newDrives);
        }
        if (newStorages && Array.isArray(newStorages) && newStorages.length > 0) {
          setStorages(newStorages);
        }
      });
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  // Filtered list based on search and status
  const filteredStorages = useMemo(() => {
    return storages.filter((storage) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        storage.name.toLowerCase().includes(q) ||
        storage.storage_id.toLowerCase().includes(q) ||
        (storage.folder_path && storage.folder_path.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status match
      if (statusFilter === 'all') return true;

      const drive = drives.find((d) => d.uuid === storage.drive_uuid);
      const isDriveOnline = drive
        ? (drive.status || '').toLowerCase() === 'online' ||
          (drive.status || '').toLowerCase() === 'online_readonly'
        : false;

      if (statusFilter === 'online') return isDriveOnline;
      if (statusFilter === 'offline') return !isDriveOnline;

      return true;
    });
  }, [storages, drives, searchQuery, statusFilter]);

  // Status counts
  const { onlineCount, offlineCount } = useMemo(() => {
    let online = 0;
    let offline = 0;
    storages.forEach((s) => {
      const drive = drives.find((d) => d.uuid === s.drive_uuid);
      const isDriveOnline = drive
        ? (drive.status || '').toLowerCase() === 'online' ||
          (drive.status || '').toLowerCase() === 'online_readonly'
        : false;
      if (isDriveOnline) online++;
      else offline++;
    });
    return { onlineCount: online, offlineCount: offline };
  }, [storages, drives]);

  const handleCreated = (newStorage: CreateTechStorageResponse) => {
    setCreateModalOpen(false);
    setCreatedStorageResponse(newStorage);
    setApiKeyModalOpen(true);
    // Add to list immediately
    setStorages((prev) => [newStorage, ...prev]);
    showToast('success', 'Storage Space Created', `${newStorage.name} is ready for API access.`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              TechStorage
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-medium text-neutral-600">
              {storages.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1.5">
            Give your projects secure, API-powered storage backed by your physical TechSpace storage.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
            title="Refresh Storage Spaces"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Create Storage Space</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-400">Total Spaces</span>
          <p className="text-lg font-bold text-neutral-900 mt-0.5">{storages.length}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Storage Online</span>
          </span>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">{onlineCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Storage Offline</span>
          </span>
          <p className="text-lg font-bold text-neutral-700 mt-0.5">{offlineCount}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-400">Connected Drives</span>
          <p className="text-lg font-bold text-neutral-900 mt-0.5">
            {drives.filter((d) => (d.status || '').toLowerCase().includes('online')).length}
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search spaces by name, ID or folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200/90 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors shadow-2xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All ({storages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('online')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'online'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Online ({onlineCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('offline')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'offline'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Offline ({offlineCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-neutral-200/80 rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-5 w-24 bg-neutral-100 rounded-full" />
                    <div className="h-4 w-16 bg-neutral-100 rounded" />
                  </div>
                  <div className="h-5 w-3/4 bg-neutral-100 rounded mb-2" />
                  <div className="h-4 w-full bg-neutral-100 rounded mb-1" />
                  <div className="h-4 w-2/3 bg-neutral-100 rounded" />
                </div>
                <div className="pt-4 border-t border-neutral-100 flex justify-between">
                  <div className="h-8 w-20 bg-neutral-100 rounded-xl" />
                  <div className="h-8 w-16 bg-neutral-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          /* Error State */
          <div className="bg-white border border-rose-200/90 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-600 border border-rose-200/60">
              <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
              Could Not Load TechStorage
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
              {loadError}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => loadData(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        ) : storages.length === 0 ? (
          /* Section 17: Empty State */
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto shadow-2xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5 text-neutral-900 border border-neutral-200/60">
              <Database className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
              Give your projects their own secure storage.
            </h3>

            <p className="text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed">
              Create a Storage Space backed by your TechSpace physical storage. Connect external apps, web services, or Python scripts with an authenticated REST API.
            </p>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Storage Space</span>
              </button>
            </div>
          </div>
        ) : filteredStorages.length === 0 ? (
          /* Filter zero matches */
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-10 text-center my-6">
            <p className="text-sm font-medium text-neutral-700">No Storage Spaces match your filters</p>
            <p className="text-xs text-neutral-400 mt-1">Try clearing your search or status filter.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStorages.map((storage) => (
              <TechStorageCard
                key={storage.storage_id}
                storage={storage}
                drives={drives}
                onOpenApiDocs={(s) => {
                  window.location.href = `/techstorage/${s.storage_id}?tab=api`;
                }}
                onOpenSettings={(s) => {
                  window.location.href = `/techstorage/${s.storage_id}?tab=settings`;
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateStorageModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        drives={drives}
        onCreated={handleCreated}
      />

      {/* Section 5: API Key Display Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        storageData={createdStorageResponse}
      />
    </div>
  );
}
