'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  Presentation,
  FileText,
  Video,
  Image as ImageIcon,
  FolderOpen,
  Share2,
  HardDrive,
  LayoutDashboard,
  Cloud,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ShowcaseResponse, ShowcaseContentResponse, ShowcaseContentItem, Drive, Workspace } from '@/types';
import { api } from '@/lib/api';
import { ShowcaseHero } from '@/components/showcase/ShowcaseHero';
import { ContentCard, ContentCardType } from '@/components/showcase/ContentCard';
import { PresentationViewer } from '@/components/showcase/PresentationViewer';
import { DocumentViewer } from '@/components/showcase/DocumentViewer';
import { VideoViewer } from '@/components/showcase/VideoViewer';
import { ImageGallery } from '@/components/showcase/ImageGallery';
import { ProjectFilesList } from '@/components/showcase/ProjectFilesList';
import { ShowcaseOffline } from '@/components/showcase/OfflineState';
import { PasswordProtectionModal } from '@/components/showcase/PasswordProtectionModal';
import { ShareWorkspaceModal } from '@/components/workspaces/ShareWorkspaceModal';
import { ToastProvider, useToast } from '@/components/Toast';

type ShowcaseTab = 'overview' | 'presentation' | 'documentation' | 'demo' | 'gallery' | 'files';

function ShowcaseInner({ shareToken }: { shareToken: string }) {
  const { showToast } = useToast();

  // Data states
  const [workspaceData, setWorkspaceData] = useState<ShowcaseResponse['workspace'] | null>(null);
  const [contentData, setContentData] = useState<ShowcaseContentResponse['content'] | null>(null);
  const [allFiles, setAllFiles] = useState<ShowcaseContentItem[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);

  // Page states
  const [loading, setLoading] = useState(true);
  const [isDriveOffline, setIsDriveOffline] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('overview');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Fetch showcase data
  const loadShowcase = async () => {
    setLoading(true);
    try {
      // 1. Fetch metadata & drives
      const [showcaseRes, drivesList] = await Promise.all([
        api.getShowcase(shareToken),
        api.getDrives().catch(() => []),
      ]);

      const ws = showcaseRes.workspace;
      setWorkspaceData(ws);
      setDrives(drivesList);

      // Check physical drive status
      const attachedDrive = drivesList.find((d) => d.uuid === ws.drive_uuid);
      if (drivesList.length > 0 && (!attachedDrive || !(attachedDrive.status || '').toLowerCase().includes('online'))) {
        setIsDriveOffline(true);
      } else {
        setIsDriveOffline(false);
      }

      // Check password protection
      if (ws.access_type === 'protected') {
        setIsPasswordProtected(true);
        const stored = sessionStorage.getItem(`techspace_showcase_auth_${shareToken}`);
        if (stored === 'true') {
          setIsUnlocked(true);
        }
      } else {
        setIsPasswordProtected(false);
        setIsUnlocked(true);
      }

      // 2. Fetch content breakdown & files
      const [contentRes, filesRes] = await Promise.all([
        api.getShowcaseContent(shareToken).catch(() => null),
        api.getShowcaseFiles(shareToken).catch(() => null),
      ]);

      if (contentRes?.content) {
        setContentData(contentRes.content);
      }

      if (filesRes?.items) {
        setAllFiles(filesRes.items);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message.toLowerCase() : '';
      if (errMsg.includes('offline') || errMsg.includes('503') || errMsg.includes('unavailable')) {
        setIsDriveOffline(true);
      } else {
        showToast(
          'error',
          'Unable to load project showcase',
          err instanceof Error ? err.message : 'Please check your connection.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShowcase();
  }, [shareToken]);

  // Password verification
  const handlePasswordSubmit = async (pwd: string) => {
    // In this implementation without user accounts, password matches the secret token or protection parameter
    if (pwd.length > 0) {
      sessionStorage.setItem(`techspace_showcase_auth_${shareToken}`, 'true');
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  // Content booleans
  const content = contentData || {};
  const hasPresentation = !!content.presentation && (!Array.isArray(content.presentation) || content.presentation.length > 0);
  const presentationItem = Array.isArray(content.presentation) ? content.presentation[0] : content.presentation;

  const hasDocs = Array.isArray(content.documentation) && content.documentation.length > 0;
  const docsList = content.documentation || [];

  const hasVideos = Array.isArray(content.videos) && content.videos.length > 0;
  const videosList = content.videos || [];

  const hasImages = Array.isArray(content.images) && content.images.length > 0;
  const imagesList = content.images || [];

  const hasFiles = (Array.isArray(content.other_files) && content.other_files.length > 0) || allFiles.length > 0;
  const filesList = allFiles.length > 0 ? allFiles : content.other_files || [];

  // Available tabs (do NOT display empty sections!)
  const availableTabs = useMemo(() => {
    const tabs: { id: ShowcaseTab; label: string; icon: React.ReactNode; count?: number }[] = [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    ];

    if (hasPresentation) {
      tabs.push({ id: 'presentation', label: 'Presentation', icon: <Presentation className="w-3.5 h-3.5 text-amber-500" /> });
    }
    if (hasDocs) {
      tabs.push({ id: 'documentation', label: 'Documentation', icon: <FileText className="w-3.5 h-3.5 text-blue-500" />, count: docsList.length });
    }
    if (hasVideos) {
      tabs.push({ id: 'demo', label: 'Demo', icon: <Video className="w-3.5 h-3.5 text-purple-500" />, count: videosList.length });
    }
    if (hasImages) {
      tabs.push({ id: 'gallery', label: 'Gallery', icon: <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />, count: imagesList.length });
    }
    if (hasFiles) {
      tabs.push({ id: 'files', label: 'Files', icon: <FolderOpen className="w-3.5 h-3.5 text-neutral-500" />, count: filesList.length });
    }

    return tabs;
  }, [hasPresentation, hasDocs, hasVideos, hasImages, hasFiles, docsList.length, videosList.length, imagesList.length, filesList.length]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 animate-spin text-neutral-400 mb-4" />
        <h2 className="text-lg font-semibold text-neutral-800">Loading Project Showcase...</h2>
        <p className="text-xs text-neutral-400 mt-1">Connecting to physical TechSpace storage drive</p>
      </div>
    );
  }

  // Physical drive offline state
  if (isDriveOffline) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between">
        <nav className="p-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900">TechSpace</span>
          </div>
          <span className="text-xs font-mono text-neutral-400">IoT Cloud Showcase</span>
        </nav>

        <ShowcaseOffline
          title={workspaceData?.title}
          onRetry={loadShowcase}
          showBackToDashboard={false}
        />

        <footer className="p-4 text-center text-xs text-neutral-400 border-t border-neutral-200/60 bg-white">
          TechSpace Physical Cloud Storage System
        </footer>
      </div>
    );
  }

  // Password Protection required
  if (isPasswordProtected && !isUnlocked) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between">
        <nav className="p-4 border-b border-neutral-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900">TechSpace</span>
          </div>
          <span className="text-xs font-mono text-neutral-400">Protected Showcase</span>
        </nav>

        <PasswordProtectionModal
          title={workspaceData?.title}
          onSubmitPassword={handlePasswordSubmit}
        />

        <footer className="p-4 text-center text-xs text-neutral-400 border-t border-neutral-200/60 bg-white">
          Protected with TechSpace Private Key
        </footer>
      </div>
    );
  }

  if (!workspaceData) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-neutral-200 rounded-3xl p-8 shadow-xs">
          <h2 className="text-lg font-bold text-neutral-900">Showcase Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1 mb-4">
            This project showcase may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  const drive = drives.find((d) => d.uuid === workspaceData.drive_uuid);
  const driveLabel = drive?.label || drive?.name || 'TechSpace Physical SSD';

  const asWorkspaceObj: Workspace = {
    id: workspaceData.id,
    drive_uuid: workspaceData.drive_uuid,
    folder_path: workspaceData.folder_path,
    title: workspaceData.title,
    description: workspaceData.description,
    share_token: shareToken,
    access_type: workspaceData.access_type,
    enabled: workspaceData.enabled,
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col text-neutral-900 selection:bg-neutral-200">
      {/* Standalone Showcase Brand Bar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-2xs">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-neutral-900">TechSpace</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-600 font-semibold border border-neutral-200/60">
                  Showcase
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <ShowcaseHero
        title={workspaceData.title}
        description={workspaceData.description}
        content={content}
        driveName={driveLabel}
        onNavigateSection={(sec) => setActiveTab(sec as ShowcaseTab)}
        onOpenShare={() => setShareModalOpen(true)}
      />

      {/* Clean Horizontal Content Navigation Tabs */}
      <div className="sticky top-[57px] z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-neutral-900 text-white font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dynamic Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* ========================================================================= */}
        {/* TAB: OVERVIEW                                                             */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Content Cards Grid (Automatically displays cards based on backend detection) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  Project Highlights
                </h2>
                <span className="text-xs text-neutral-400 font-mono">
                  Auto-detected from physical drive
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* 1. Presentation Card */}
                {hasPresentation && (
                  <ContentCard
                    type="presentation"
                    title="Presentation"
                    subtitle={presentationItem?.name || 'Project Slide Deck'}
                    itemCount={Array.isArray(content.presentation) ? content.presentation.length : 1}
                    actionText="Open Presentation"
                    onClick={() => setActiveTab('presentation')}
                  />
                )}

                {/* 2. Documentation Card */}
                {hasDocs && (
                  <ContentCard
                    type="documentation"
                    title="Documentation"
                    subtitle="Technical specs, report and architecture"
                    itemCount={docsList.length}
                    actionText="Read Documentation"
                    onClick={() => setActiveTab('documentation')}
                  />
                )}

                {/* 3. Demo Card */}
                {hasVideos && (
                  <ContentCard
                    type="demo"
                    title="Demo"
                    subtitle="Interactive demonstration recordings"
                    itemCount={videosList.length}
                    actionText="Watch Demo"
                    onClick={() => setActiveTab('demo')}
                  />
                )}

                {/* 4. Gallery Card */}
                {hasImages && (
                  <ContentCard
                    type="gallery"
                    title="Gallery"
                    subtitle="Hardware prototypes, schematics and diagrams"
                    itemCount={imagesList.length}
                    actionText="View Gallery"
                    onClick={() => setActiveTab('gallery')}
                  />
                )}

                {/* 5. Project Files Card */}
                {hasFiles && (
                  <ContentCard
                    type="files"
                    title="Project Files"
                    subtitle="All project assets and source files"
                    itemCount={filesList.length}
                    actionText="Browse Files"
                    onClick={() => setActiveTab('files')}
                  />
                )}
              </div>
            </div>

            {/* Quick Preview Section if Presentation exists */}
            {hasPresentation && (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-amber-500" />
                    <span>Presentation Deck</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('presentation')}
                    className="text-xs font-semibold text-neutral-800 hover:text-neutral-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Presentation</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <PresentationViewer
                  shareToken={shareToken}
                  presentationFile={presentationItem}
                  onBack={() => setActiveTab('overview')}
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: PRESENTATION                                                         */}
        {/* ========================================================================= */}
        {activeTab === 'presentation' && hasPresentation && (
          <div className="animate-fade-in">
            <PresentationViewer
              shareToken={shareToken}
              presentationFile={presentationItem}
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DOCUMENTATION                                                        */}
        {/* ========================================================================= */}
        {activeTab === 'documentation' && hasDocs && (
          <div className="animate-fade-in">
            <DocumentViewer
              documents={docsList}
              driveUuid={workspaceData.drive_uuid}
              folderPath={workspaceData.folder_path}
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: DEMO                                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'demo' && hasVideos && (
          <div className="animate-fade-in">
            <VideoViewer
              videos={videosList}
              driveUuid={workspaceData.drive_uuid}
              folderPath={workspaceData.folder_path}
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: GALLERY                                                              */}
        {/* ========================================================================= */}
        {activeTab === 'gallery' && hasImages && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200/70">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  Project Gallery
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {imagesList.length} image{imagesList.length === 1 ? '' : 's'} • Click any image to view in fullscreen lightbox
                </p>
              </div>
            </div>

            <ImageGallery
              images={imagesList}
              driveUuid={workspaceData.drive_uuid}
              folderPath={workspaceData.folder_path}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: FILES                                                                */}
        {/* ========================================================================= */}
        {activeTab === 'files' && hasFiles && (
          <div className="animate-fade-in space-y-6">
            <ProjectFilesList
              files={filesList}
              driveUuid={workspaceData.drive_uuid}
              folderPath={workspaceData.folder_path}
              onPreviewItem={(item) => {
                const ext = (item.name.split('.').pop() || '').toLowerCase();
                if (['pptx', 'ppt'].includes(ext)) setActiveTab('presentation');
                else if (['pdf', 'docx', 'doc', 'txt'].includes(ext)) setActiveTab('documentation');
                else if (['mp4', 'webm', 'mov'].includes(ext)) setActiveTab('demo');
                else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) setActiveTab('gallery');
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200/80 bg-white py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-neutral-900 flex items-center justify-center text-white">
              <Cloud className="w-3 h-3" />
            </div>
            <span className="font-semibold text-neutral-800">TechSpace IoT Platform</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
              <HardDrive className="w-3 h-3" />
              {driveLabel}
            </span>
          </div>

          <p className="text-neutral-400 text-center sm:text-right">
            Stored and served directly from physical USB storage.
          </p>
        </div>
      </footer>

      {/* Share Modal */}
      {shareModalOpen && (
        <ShareWorkspaceModal
          isOpen={true}
          onClose={() => setShareModalOpen(false)}
          workspace={asWorkspaceObj}
        />
      )}
    </div>
  );
}

export default function ShowcasePage({
  params,
}: {
  params: Promise<{ share_token: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <ToastProvider>
      <ShowcaseInner shareToken={resolvedParams.share_token} />
    </ToastProvider>
  );
}
