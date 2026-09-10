'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sidebar,
} from '@/components/Sidebar';
import {
  Header,
} from '@/components/Header';
import {
  StorageCard,
} from '@/components/StorageCard';
import {
  DriveCard,
} from '@/components/DriveCard';
import {
  FileExplorer,
} from '@/components/FileExplorer';
import {
  UploadModal,
} from '@/components/UploadModal';
import {
  NewFolderModal,
} from '@/components/NewFolderModal';
import {
  NewFileModal,
} from '@/components/NewFileModal';
import {
  DeleteConfirmModal,
} from '@/components/DeleteConfirmModal';
import {
  AccessModal,
} from '@/components/AccessModal';
import {
  PasswordModal,
} from '@/components/PasswordModal';
import {
  PublicShareModal,
} from '@/components/PublicShareModal';
import {
  FilePreview,
} from '@/components/FilePreview';
import {
  SettingsModal,
} from '@/components/SettingsModal';
import {
  SystemStatusModal,
} from '@/components/SystemStatusModal';
import {
  DriveSkeleton,
  StorageSkeleton,
} from '@/components/LoadingState';
import {
  ErrorState,
} from '@/components/ErrorState';
import {
  ToastProvider,
  useToast,
} from '@/components/Toast';
import {
  Drive,
  StorageItem,
  StorageSummary,
  BreadcrumbItem,
  ViewMode,
  ActiveNavTab,
} from '@/types';
import { api, getApiBaseUrl } from '@/lib/api';
import {
  HardDrive,
  FolderClosed,
  Share2,
  Upload,
  ArrowRight,
  FilePlus,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';

function VSSACloudApp() {
  // Navigation & View States
  const [currentTab, setCurrentTab] = useState<ActiveNavTab['tab']>('dashboard');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Selected Drive UUID (allows multi-drive switching)
  const [selectedDriveUuid, setSelectedDriveUuid] = useState<string | null>(null);

  // Backend Data States with Instant SWR Cache
  const [drives, setDrives] = useState<Drive[]>(() => {
    return api.getCachedDrives() || [];
  });
  const [drivesLoading, setDrivesLoading] = useState(() => {
    const c = api.getCachedDrives();
    return !c || c.length === 0;
  });
  const [drivesError, setDrivesError] = useState<string | null>(null);

  // Compute active drive and UUID with fallback to first online or online_readonly drive
  const activeDrive = useMemo(() => {
    if (selectedDriveUuid) {
      const found = drives.find((d) => d.uuid === selectedDriveUuid);
      if (found) return found;
    }
    const online = drives.find((d) => {
      const s = (d.status || '').toLowerCase();
      return s === 'online' || s === 'online_readonly';
    });
    return online || drives[0] || null;
  }, [selectedDriveUuid, drives]);

  const activeDriveUuid = activeDrive?.uuid || null;
  const isDriveReadOnly = (activeDrive?.status || '').toLowerCase() === 'online_readonly' || activeDrive?.mount_mode === 'ro';

  // Keep API client synchronized with active drive
  useEffect(() => {
    if (activeDriveUuid) {
      api.setActiveDriveUuid(activeDriveUuid);
    }
  }, [activeDriveUuid]);

  const [items, setItems] = useState<StorageItem[]>(() => {
    const uuid = api.getActiveDriveUuid();
    return uuid ? api.getCachedFiles(uuid, currentPath) || [] : [];
  });
  const [filesLoading, setFilesLoading] = useState(() => {
    const uuid = api.getActiveDriveUuid();
    const c = uuid ? api.getCachedFiles(uuid, currentPath) : null;
    return !c;
  });
  const [filesError, setFilesError] = useState<string | null>(null);

  // Deletion State
  const [itemToDelete, setItemToDelete] = useState<StorageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Raspberry Pi Health / Online Status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingLatency, setPingLatency] = useState<number | undefined>(undefined);

  // In-memory unlocked protected folders for the current session (Never stored in localStorage or URL!)
  const [unlockedPaths, setUnlockedPaths] = useState<Set<string>>(new Set());
  const [protectedFolderToUnlock, setProtectedFolderToUnlock] = useState<StorageItem | null>(null);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [accessModalFolder, setAccessModalFolder] = useState<StorageItem | null>(null);
  const [shareModalFolder, setShareModalFolder] = useState<StorageItem | null>(null);
  const [previewFile, setPreviewFile] = useState<StorageItem | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [systemModalOpen, setSystemModalOpen] = useState(false);

  const { showToast } = useToast();

  // Ping Raspberry Pi backend
  const checkBackendHealth = useCallback(async () => {
    setIsPinging(true);
    try {
      const res = await api.pingBackend();
      setIsOnline(res.online);
      setPingLatency(res.latencyMs);
    } catch {
      setIsOnline(false);
    } finally {
      setIsPinging(false);
    }
  }, []);

  // Fetch Connected Storage Drives (GET /drives)
  const loadDrives = useCallback(async () => {
    setDrivesLoading(true);
    setDrivesError(null);
    try {
      const data = await api.getDrives();
      setDrives(data);
      setIsOnline(true);
      const onlineDrives = data.filter((d) => {
        const s = (d.status || '').toLowerCase();
        return s === 'online' || s === 'online_readonly';
      });
      if (onlineDrives.length > 0) {
        setSelectedDriveUuid((prev) => {
          if (prev && onlineDrives.some((d) => d.uuid === prev)) {
            return prev;
          }
          return onlineDrives[0].uuid || null;
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to drives';
      setDrivesError(msg);
      // If server unreachable, mark offline
      if (msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('network')) {
        setIsOnline(false);
      }
    } finally {
      setDrivesLoading(false);
    }
  }, []);

  // Fetch Directory Files (GET /drives/{drive_uuid}/files?path= or GET /files?path=)
  const loadFiles = useCallback(async (path: string, driveUuid?: string | null) => {
    const targetUuid = driveUuid !== undefined ? (driveUuid || undefined) : (selectedDriveUuid || undefined);
    const cached = targetUuid ? api.getCachedFiles(targetUuid, path) : null;
    if (cached && cached.length > 0) {
      setItems(cached);
      setFilesLoading(false);
    } else {
      setFilesLoading(true);
    }
    setFilesError(null);
    try {
      const data = await api.getFiles(path, targetUuid);
      setItems(data);
      setIsOnline(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load files';
      setFilesError(msg);
      if (msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('network')) {
        setIsOnline(false);
      }
    } finally {
      setFilesLoading(false);
    }
  }, [selectedDriveUuid]);

  // Initial load & path synchronization
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [drivesRes, pingRes] = await Promise.allSettled([
          api.getDrives(),
          api.pingBackend(),
        ]);

        if (cancelled) return;

        let activeUuid = selectedDriveUuid;
        if (drivesRes.status === 'fulfilled') {
          setDrives(drivesRes.value);
          setDrivesError(null);
          setIsOnline(true);
          const onlineDrives = drivesRes.value.filter((d) => {
            const s = (d.status || '').toLowerCase();
            return s === 'online' || s === 'online_readonly';
          });
          if (onlineDrives.length > 0) {
            if (!activeUuid || !onlineDrives.some((d) => d.uuid === activeUuid)) {
              activeUuid = onlineDrives[0].uuid || null;
              setSelectedDriveUuid(activeUuid);
            }
          }
        } else {
          const msg = drivesRes.reason instanceof Error ? drivesRes.reason.message : 'Unable to connect to drives';
          setDrivesError(msg);
        }

        if (activeUuid) {
          try {
            const filesData = await api.getFiles(currentPath, activeUuid);
            if (!cancelled) {
              setItems(filesData);
              setFilesError(null);
              setIsOnline(true);
            }
          } catch (filesErr) {
            if (!cancelled) {
              const msg = filesErr instanceof Error ? filesErr.message : 'Unable to load files';
              setFilesError(msg);
            }
          }
        } else {
          if (!cancelled) {
            setItems([]);
          }
        }

        if (pingRes.status === 'fulfilled') {
          setIsOnline(pingRes.value.online);
          setPingLatency(pingRes.value.latencyMs);
        }
      } finally {
        if (!cancelled) {
          setDrivesLoading(false);
          setFilesLoading(false);
        }
      }
    }

    void fetchData();

    // Heartbeat ping every 60 seconds (requirement 14: cached endpoint, no excessive polling)
    const interval = setInterval(() => {
      void checkBackendHealth();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentPath, selectedDriveUuid, checkBackendHealth]);

  // Aggregate storage summary
  const summary: StorageSummary = useMemo(() => {
    return api.calculateSummary(drives);
  }, [drives]);

  // Dynamic breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (!currentPath) return [];
    const segments = currentPath.split('/').filter(Boolean);
    let accum = '';
    return segments.map((seg) => {
      accum = accum ? `${accum}/${seg}` : seg;
      return {
        name: seg,
        path: accum,
      };
    });
  }, [currentPath]);

  // Navigation handlers
  const handleNavigatePath = (path: string) => {
    setProtectedFolderToUnlock(null);
    setCurrentPath(path);
  };

  const handleNavigateUp = () => {
    setProtectedFolderToUnlock(null);
    if (!currentPath) return;
    const segments = currentPath.split('/').filter(Boolean);
    segments.pop();
    setCurrentPath(segments.join('/'));
  };

  // Opening a folder with Protected Folder Verification
  const handleOpenFolder = (folder: StorageItem) => {
    // If folder is password protected and not yet unlocked in this session:
    const isProtected = folder.access_status === 'protected' || folder.is_protected;
    if (isProtected && !unlockedPaths.has(folder.path)) {
      setProtectedFolderToUnlock(folder);
      return;
    }

    setProtectedFolderToUnlock(null);
    setCurrentPath(folder.path);
    if (currentTab !== 'files') {
      setCurrentTab('files');
    }
  };

  // Previewing a file with Protected File Verification
  const handlePreviewFile = (file: StorageItem) => {
    const isProtected = file.access_status === 'protected' || file.is_protected;
    if (isProtected && !unlockedPaths.has(file.path)) {
      setProtectedFolderToUnlock(file);
      return;
    }
    setPreviewFile(file);
  };

  // Unlocking folder or file
  const handleUnlockSuccess = () => {
    if (!protectedFolderToUnlock) return;
    const item = protectedFolderToUnlock;
    const path = item.path;
    setUnlockedPaths((prev) => new Set(prev).add(path));
    setProtectedFolderToUnlock(null);

    if (item.is_dir) {
      setCurrentPath(path);
      if (currentTab !== 'files') {
        setCurrentTab('files');
      }
    } else {
      setPreviewFile(item);
    }
  };

  // Open drive handler: switch to files tab and open drive root
  const handleOpenDrive = (drive: Drive) => {
    if (drive.status && drive.status.toLowerCase() === 'offline') {
      return;
    }
    if (drive.uuid) {
      setSelectedDriveUuid(drive.uuid);
    }
    setCurrentTab('files');
    setCurrentPath('');
  };

  // Download handler (GET /download/{drive_uuid}?path=)
  const handleDownloadFile = async (file: StorageItem) => {
    const isProtected = file.access_status === 'protected' || file.is_protected;
    if (isProtected && !unlockedPaths.has(file.path)) {
      setProtectedFolderToUnlock(file);
      return;
    }

    try {
      showToast('info', 'Downloading', `Starting download for ${file.name}...`);
      await api.downloadFile(file.path, file.name, activeDriveUuid || undefined);
    } catch {
      showToast('error', 'Download failed', 'Could not download the requested file.');
    }
  };

  // Delete item handlers (DELETE /items/{drive_uuid}?path=)
  const handleDeleteItem = (item: StorageItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteItem(itemToDelete.path, activeDriveUuid || undefined);
      showToast(
        'success',
        itemToDelete.is_dir ? 'Folder deleted' : 'File deleted',
        `"${itemToDelete.name}" was deleted successfully.`
      );
      setItemToDelete(null);
      void loadFiles(currentPath);
      void loadDrives();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete item';
      showToast('error', 'Delete failed', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setProtectedFolderToUnlock(null);
        }}
        isOnline={isOnline}
        isPinging={isPinging}
        onRefreshStatus={checkBackendHealth}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenSystemModal={() => setSystemModalOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Sticky Header */}
        <Header
          breadcrumbs={breadcrumbs}
          onNavigateBreadcrumb={handleNavigatePath}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenUploadModal={() => setUploadModalOpen(true)}
          onOpenNewFolderModal={() => setNewFolderModalOpen(true)}
          onOpenNewFileModal={() => setNewFileModalOpen(true)}
          onOpenSystemModal={() => setSystemModalOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          showFileActions={currentTab === 'files' || currentTab === 'dashboard'}
        />

        {/* Dynamic Tab Views */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Protected Folder Lock Screen */}
          {protectedFolderToUnlock ? (
            <PasswordModal
              folderPath={protectedFolderToUnlock.path}
              folderName={protectedFolderToUnlock.name}
              onSuccess={handleUnlockSuccess}
              onBack={() => setProtectedFolderToUnlock(null)}
            />
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {currentTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-150">
                  {/* Storage Pool Metrics */}
                  {drivesLoading ? (
                    <StorageSkeleton />
                  ) : (
                    <StorageCard
                      summary={summary}
                      isOnline={isOnline}
                      driveCount={drives.length}
                    />
                  )}

                  {/* Connected Storage Drives Section */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                          Connected Storage
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Physical drives attached via USB and system storage
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={loadDrives}
                        className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                      >
                        Refresh Drives
                      </button>
                    </div>

                    {drivesLoading ? (
                      <DriveSkeleton />
                    ) : drivesError ? (
                      <ErrorState
                        title="Storage Drives Unavailable"
                        message={drivesError}
                        onRetry={loadDrives}
                        isDriveError
                      />
                    ) : drives.length === 0 ? (
                      <div className="bg-neutral-50/80 border border-neutral-200/70 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center col-span-full">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-800">No Storage Drives Detected</p>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                          Connect a USB drive or SSD to the Raspberry Pi. TechSpace will automatically detect and mount it.
                        </p>
                        <button
                          type="button"
                          onClick={loadDrives}
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer active:scale-98"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Scan for Drives</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drives.map((drive, idx) => (
                          <DriveCard
                            key={drive.id || idx}
                            drive={drive}
                            index={idx}
                            onOpenDrive={handleOpenDrive}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Quick File Explorer on Dashboard */}
                  <section className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderClosed className="w-4 h-4 text-neutral-500" />
                        <h2 className="text-sm font-semibold text-neutral-900">
                          {currentPath ? `/${currentPath}` : 'Recent Files & Folders'}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentTab('files')}
                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                      >
                        <span>View all in My Files</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <FileExplorer
                      items={items}
                      isLoading={filesLoading}
                      error={filesError}
                      currentPath={currentPath}
                      viewMode={viewMode}
                      searchQuery={searchQuery}
                      onOpenFolder={handleOpenFolder}
                      onNavigateUp={handleNavigateUp}
                      onPreviewFile={handlePreviewFile}
                      onDownloadFile={handleDownloadFile}
                      onDeleteItem={handleDeleteItem}
                      onOpenAccessModal={(f) => setAccessModalFolder(f)}
                      onOpenShareModal={(f) => setShareModalFolder(f)}
                      onOpenUploadModal={() => setUploadModalOpen(true)}
                      onOpenNewFolderModal={() => setNewFolderModalOpen(true)}
                      onOpenNewFileModal={() => setNewFileModalOpen(true)}
                      onRetry={() => loadFiles(currentPath)}
                      onClearSearch={() => setSearchQuery('')}
                      drives={drives}
                      selectedDriveUuid={activeDriveUuid}
                      onSelectDrive={(uuid) => {
                        setSelectedDriveUuid(uuid);
                        setCurrentPath('');
                      }}
                    />
                  </section>
                </div>
              )}

              {/* TAB 2: MY FILES */}
              {currentTab === 'files' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-200/80 pb-4 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-semibold text-neutral-900">My Files</h1>
                        {activeDrive && (
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              isDriveReadOnly
                                ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            }`}
                          >
                            {isDriveReadOnly ? 'Online / Read-Only' : 'Online / Read-Write'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {currentPath ? `Directory: /${currentPath}` : 'Root personal cloud storage directory'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewFileModalOpen(true)}
                        disabled={isDriveReadOnly}
                        title={isDriveReadOnly ? 'Drive is mounted in Read-Only mode' : 'Create new text file'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white text-neutral-700 text-xs font-medium transition-all shadow-2xs ${
                          isDriveReadOnly
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer'
                        }`}
                      >
                        <FilePlus className="w-3.5 h-3.5 text-neutral-500" />
                        <span>New File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewFolderModalOpen(true)}
                        disabled={isDriveReadOnly}
                        title={isDriveReadOnly ? 'Drive is mounted in Read-Only mode' : 'Create new folder'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white text-neutral-700 text-xs font-medium transition-all shadow-2xs ${
                          isDriveReadOnly
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer'
                        }`}
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-neutral-500" />
                        <span>New Folder</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadModalOpen(true)}
                        disabled={isDriveReadOnly}
                        title={isDriveReadOnly ? 'Drive is mounted in Read-Only mode' : 'Upload file to physical USB storage'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-medium transition-all shadow-2xs ${
                          isDriveReadOnly
                            ? 'bg-neutral-400 opacity-40 cursor-not-allowed'
                            : 'bg-neutral-900 hover:bg-neutral-800 cursor-pointer active:scale-98'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                    </div>
                  </div>

                  <FileExplorer
                    items={items}
                    isLoading={filesLoading}
                    error={filesError}
                    currentPath={currentPath}
                    viewMode={viewMode}
                    searchQuery={searchQuery}
                    onOpenFolder={handleOpenFolder}
                    onNavigateUp={handleNavigateUp}
                    onPreviewFile={handlePreviewFile}
                    onDownloadFile={handleDownloadFile}
                    onDeleteItem={handleDeleteItem}
                    onOpenAccessModal={(f) => setAccessModalFolder(f)}
                    onOpenShareModal={(f) => setShareModalFolder(f)}
                    onOpenUploadModal={() => setUploadModalOpen(true)}
                    onOpenNewFolderModal={() => setNewFolderModalOpen(true)}
                    onOpenNewFileModal={() => setNewFileModalOpen(true)}
                    onRetry={() => loadFiles(currentPath)}
                    onClearSearch={() => setSearchQuery('')}
                    drives={drives}
                    selectedDriveUuid={activeDriveUuid}
                    onSelectDrive={(uuid) => {
                      setSelectedDriveUuid(uuid);
                      setCurrentPath('');
                    }}
                  />
                </div>
              )}

              {/* TAB 3: SHARED FOLDERS */}
              {currentTab === 'shared' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="border-b border-neutral-200/80 pb-4">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-neutral-700" />
                      <h1 className="text-xl font-semibold text-neutral-900">Shared Folders</h1>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Folders configured with Public access links or QR codes
                    </p>
                  </div>

                  {(() => {
                    const publicFolders = items.filter(
                      (item) => item.is_dir && (item.access_status === 'public' || item.is_public)
                    );

                    if (publicFolders.length === 0) {
                      return (
                        <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center shadow-2xs">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-3">
                            <Share2 className="w-6 h-6" />
                          </div>
                          <h3 className="text-sm font-semibold text-neutral-900">
                            No shared folders yet
                          </h3>
                          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                            Make any folder public to generate shareable links and QR codes.
                          </p>
                          <button
                            type="button"
                            onClick={() => setCurrentTab('files')}
                            className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-2xs cursor-pointer"
                          >
                            Go to My Files
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {publicFolders.map((f) => (
                          <div
                            key={f.path}
                            className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <Share2 className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                                  Public Link
                                </span>
                              </div>
                              <h3 className="text-xs font-semibold text-neutral-900 truncate">
                                {f.name}
                              </h3>
                              <p className="text-[11px] font-mono text-neutral-400 mt-1">
                                https://cloud.vssa.site/share/{encodeURIComponent(f.path)}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleOpenFolder(f)}
                                className="text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                              >
                                View folder
                              </button>
                              <button
                                type="button"
                                onClick={() => setShareModalFolder(f)}
                                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-2xs"
                              >
                                Share & QR
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: STORAGE MANAGER */}
              {currentTab === 'storage' && (
                <div className="space-y-8 animate-in fade-in duration-150">
                  <div className="border-b border-neutral-200/80 pb-4">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-neutral-700" />
                      <h1 className="text-xl font-semibold text-neutral-900">Storage & Drives</h1>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Physical USB drives, partitions, and capacity allocation
                    </p>
                  </div>

                  <StorageCard
                    summary={summary}
                    isOnline={isOnline}
                    driveCount={drives.length}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-neutral-900">
                        Drive Volumes ({drives.length})
                      </h2>
                      <button
                        type="button"
                        onClick={loadDrives}
                        className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                      >
                        Scan for new USB drives
                      </button>
                    </div>

                    {drivesLoading ? (
                      <DriveSkeleton />
                    ) : drives.length === 0 ? (
                      <div className="bg-neutral-50/80 border border-neutral-200/70 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center col-span-full">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-neutral-800">No Storage Drives Detected</p>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                          Connect a USB drive or SSD to the Raspberry Pi. TechSpace will automatically detect and mount it.
                        </p>
                        <button
                          type="button"
                          onClick={loadDrives}
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer active:scale-98"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Scan for Drives</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drives.map((drive, idx) => (
                          <DriveCard
                            key={drive.id || idx}
                            drive={drive}
                            index={idx}
                            onOpenDrive={handleOpenDrive}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        currentPath={currentPath}
        driveUuid={activeDriveUuid || undefined}
        onUploadSuccess={() => {
          loadFiles(currentPath);
          loadDrives();
        }}
      />

      <NewFolderModal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        currentPath={currentPath}
        driveUuid={activeDriveUuid || undefined}
        onFolderCreated={() => loadFiles(currentPath)}
      />

      <NewFileModal
        isOpen={newFileModalOpen}
        onClose={() => setNewFileModalOpen(false)}
        currentPath={currentPath}
        driveUuid={activeDriveUuid || undefined}
        onFileCreated={() => loadFiles(currentPath)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        item={itemToDelete}
        isDeleting={isDeleting}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <AccessModal
        isOpen={Boolean(accessModalFolder)}
        onClose={() => setAccessModalFolder(null)}
        folder={accessModalFolder}
        onAccessUpdated={() => loadFiles(currentPath)}
      />

      <PublicShareModal
        isOpen={Boolean(shareModalFolder)}
        onClose={() => setShareModalFolder(null)}
        folder={shareModalFolder}
      />

      <FilePreview
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSettingsSaved={() => {
          loadDrives();
          loadFiles(currentPath);
          checkBackendHealth();
        }}
      />

      <SystemStatusModal
        isOpen={systemModalOpen}
        onClose={() => setSystemModalOpen(false)}
        isOnline={isOnline}
        pingLatency={pingLatency}
        driveCount={drives.length || 1}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <VSSACloudApp />
    </ToastProvider>
  );
}
