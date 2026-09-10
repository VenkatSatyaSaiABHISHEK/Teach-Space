'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  RefreshCw,
  Search,
  Briefcase,
  HardDrive,
  Share2,
  FolderPlus,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { WorkspaceCard } from '@/components/workspaces/WorkspaceCard';
import { ShareWorkspaceModal } from '@/components/workspaces/ShareWorkspaceModal';
import { Workspace, Drive } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function WorkspacesPage() {
  const { showToast } = useToast();

  // Instant SWR state: initialize immediately from client cache so tab switching is instantaneous
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    return api.getCachedWorkspaces() || [];
  });
  const [drives, setDrives] = useState<Drive[]>(() => {
    return api.getCachedDrives() || [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = api.getCachedWorkspaces();
    return !cached || cached.length === 0;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [sharingWorkspace, setSharingWorkspace] = useState<Workspace | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load drives and workspaces
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      // Only show full skeleton loader if user has NO cached data at all
      const currentCache = api.getCachedWorkspaces();
      if (!currentCache || currentCache.length === 0) {
        setLoading(true);
      }
    }
    setLoadError(null);

    try {
      let wsError: string | null = null;
      const [fetchedDrives, fetchedWorkspaces] = await Promise.all([
        api.getDrives().catch((err) => {
          console.error('Failed to load drives:', err);
          return [];
        }),
        api.getWorkspaces().catch((err) => {
          console.error('Failed to load workspaces:', err);
          wsError = err instanceof Error ? err.message : 'Failed to connect to storage server';
          return null;
        }),
      ]);

      if (fetchedDrives && fetchedDrives.length > 0) {
        setDrives(fetchedDrives);
      }

      if (fetchedWorkspaces === null) {
        const existing = api.getCachedWorkspaces();
        if (!existing || existing.length === 0) {
          const errorMsg = wsError || 'Failed to connect to storage backend.';
          setLoadError(errorMsg);
          setWorkspaces([]);
          showToast('error', 'Storage Connection Failed', errorMsg);
        }
        return;
      }

      // Enhance workspaces with content counts if missing
      const enhancedWorkspaces = await Promise.all(
        fetchedWorkspaces.map(async (ws) => {
          if (ws.content_counts) return ws;
          try {
            const contentRes = await api.getShowcaseContent(ws.share_token);
            const c = contentRes.content || {};
            const pCount = c.presentation ? (Array.isArray(c.presentation) ? c.presentation.length : 1) : 0;
            const dCount = Array.isArray(c.documentation) ? c.documentation.length : 0;
            const vCount = Array.isArray(c.videos) ? c.videos.length : 0;
            const iCount = Array.isArray(c.images) ? c.images.length : 0;
            const oCount = Array.isArray(c.other_files) ? c.other_files.length : 0;

            return {
              ...ws,
              content_counts: {
                presentation: pCount,
                documentation: dCount,
                videos: vCount,
                images: iCount,
                other_files: oCount,
              },
            };
          } catch {
            return ws;
          }
        })
      );

      setWorkspaces(enhancedWorkspaces);
      api.setCachedWorkspaces(enhancedWorkspaces);
    } catch (err) {
      const existing = api.getCachedWorkspaces();
      if (!existing || existing.length === 0) {
        const msg = err instanceof Error ? err.message : 'Please check your connection.';
        setLoadError(msg);
        showToast(
          'error',
          'Failed to load workspaces',
          msg
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter workspaces by search and status
  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch =
      ws.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      ws.folder_path.toLowerCase().includes(searchQuery.toLowerCase().trim());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;

    const drive = drives.find((d) => d.uuid === ws.drive_uuid);
    const isDriveOnline = drive ? (drive.status || '').toLowerCase().includes('online') : false;

    if (statusFilter === 'online') return isDriveOnline;
    if (statusFilter === 'offline') return !isDriveOnline;

    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Project Workspaces
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono font-medium text-neutral-600">
              {workspaces.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Turn folders on your physical TechSpace drives into interactive showcases.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
            title="Refresh workspaces"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/workspaces/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Create Showcase</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workspaces by title, description or folder..."
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
            All ({workspaces.length})
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
            Online
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
            Offline
          </button>
        </div>
      </div>

      {/* Content Area */}
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
                    <div className="h-5 w-20 bg-neutral-100 rounded-full" />
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
          /* Error State with Retry */
          <div className="bg-white border border-rose-200/90 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-600 border border-rose-200/60">
              <AlertCircle className="w-7 h-7 stroke-[1.75]" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
              Could Not Load Workspaces
            </h3>

            <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
              {loadError}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => loadData(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto shadow-2xs my-8">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5 text-neutral-800 border border-neutral-200/60">
              <Briefcase className="w-7 h-7 stroke-[1.75]" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
              No Project Workspaces Yet
            </h3>

            <p className="text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed">
              Turn your project folder on your physical TechSpace drive into a beautiful interactive showcase with presentations, documentation, demo videos, and image galleries.
            </p>

            <div className="mt-7">
              <Link
                href="/workspaces/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create Your First Showcase</span>
              </Link>
            </div>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          /* No search matches */
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-10 text-center my-6">
            <p className="text-sm font-medium text-neutral-700">No workspaces match your filters</p>
            <p className="text-xs text-neutral-400 mt-1">Try clearing your search or filter criteria.</p>
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
          /* Workspaces Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorkspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                drives={drives}
                onOpenShare={(item) => setSharingWorkspace(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {sharingWorkspace && (
        <ShareWorkspaceModal
          isOpen={true}
          onClose={() => setSharingWorkspace(null)}
          workspace={sharingWorkspace}
        />
      )}
    </div>
  );
}
