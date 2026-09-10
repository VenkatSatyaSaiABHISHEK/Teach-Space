'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  HardDrive,
  FolderClosed,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Calendar,
  Presentation,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  AlertCircle,
  FolderOpen,
  Upload,
  Download,
  Eye,
  Plus,
} from 'lucide-react';
import { Workspace, Drive, ShowcaseContentResponse, StorageItem } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { UploadModal } from '@/components/UploadModal';

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.id;
  const router = useRouter();
  const { showToast } = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [content, setContent] = useState<ShowcaseContentResponse | null>(null);
  const [files, setFiles] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const fetchDetails = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [ws, fetchedDrives] = await Promise.all([
        api.getWorkspace(workspaceId),
        api.getDrives().catch(() => []),
      ]);
      setWorkspace(ws);
      setDrives(fetchedDrives);

      // Fetch showcase content & files from physical storage
      if (ws.share_token) {
        try {
          const [contentRes, filesRes] = await Promise.all([
            api.getShowcaseContent(ws.share_token).catch(() => null),
            api.getFiles(ws.folder_path, ws.drive_uuid).catch(() => []),
          ]);
          setContent(contentRes);
          setFiles(filesRes || []);
        } catch {
          // Non-blocking
        }
      }
    } catch (err) {
      showToast(
        'error',
        'Failed to load workspace',
        err instanceof Error ? err.message : 'Please check connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const drive = drives.find((d) => d.uuid === workspace?.drive_uuid);
  const isDriveOnline = drive
    ? (drive.status || '').toLowerCase().includes('online')
    : false;

  const showcaseUrl = workspace
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/showcase/${workspace.share_token}`
    : '';

  const handleCopyLink = () => {
    if (!showcaseUrl) return;
    navigator.clipboard.writeText(showcaseUrl);
    setCopied(true);
    showToast('success', 'Showcase link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!workspace) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${filePath.split('/').pop()}" from this project folder?`);
    if (!confirmDelete) return;

    setDeletingPath(filePath);
    try {
      await api.deleteItem(filePath, workspace.drive_uuid);
      showToast('success', 'File deleted', 'The file was removed from the physical drive.');
      await fetchDetails(true);
    } catch (err) {
      showToast(
        'error',
        'Failed to delete file',
        err instanceof Error ? err.message : 'Storage operation error.'
      );
    } finally {
      setDeletingPath(null);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (['pptx', 'ppt', 'key', 'odp'].includes(ext)) {
      return <Presentation className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    }
    if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) {
      return <Video className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto w-full animate-pulse space-y-6">
        <div className="h-6 w-32 bg-neutral-200 rounded" />
        <div className="h-40 bg-neutral-100 rounded-3xl" />
        <div className="h-60 bg-neutral-100 rounded-2xl" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-10 text-center max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-neutral-900">Workspace Not Found</h2>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          The requested workspace could not be found or has been removed.
        </p>
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </Link>
      </div>
    );
  }

  const c = content?.content || {};
  const pCount = c.presentation ? (Array.isArray(c.presentation) ? c.presentation.length : 1) : 0;
  const dCount = Array.isArray(c.documentation) ? c.documentation.length : 0;
  const vCount = Array.isArray(c.videos) ? c.videos.length : 0;
  const iCount = Array.isArray(c.images) ? c.images.length : 0;
  const oCount = Array.isArray(c.other_files) ? c.other_files.length : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Link
            href="/workspaces"
            className="hover:text-neutral-900 transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspaces</span>
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold truncate max-w-xs">{workspace.title}</span>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Files</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchDetails(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            title="Refresh files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Open Showcase CTA */}
          <Link
            href={`/showcase/${workspace.share_token}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-2xs transition-all active:scale-98"
          >
            <span>Open Public Showcase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Workspace Header Card */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isDriveOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDriveOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span>{isDriveOnline ? 'Physical Drive Online' : 'Drive Disconnected'}</span>
              </span>

              <span className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-md">
                /{workspace.folder_path}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              {workspace.title}
            </h1>

            <p className="text-sm text-neutral-600 max-w-2xl leading-relaxed">
              {workspace.description || 'Project files stored on physical TechSpace drive.'}
            </p>

            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Drive: {drive?.label || drive?.name || workspace.drive_uuid.slice(0, 12)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FolderClosed className="w-3.5 h-3.5" />
                <span>Folder: {workspace.folder_path}</span>
              </span>
            </div>
          </div>

          {/* Quick QR code card */}
          <div className="flex flex-col items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 shrink-0">
            <QRCodeSVG value={showcaseUrl} size={110} bgColor="#f9fafb" fgColor="#171717" level="M" />
            <span className="text-[10px] text-neutral-400 font-mono mt-2">Scan to open</span>
          </div>
        </div>

        {/* Share Link Row */}
        <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-1.5">
            <span className="text-xs text-neutral-400 shrink-0">Shareable URL:</span>
            <input
              type="text"
              readOnly
              value={showcaseUrl}
              className="bg-transparent text-xs font-mono text-neutral-800 w-full focus:outline-none select-all"
            />
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-medium shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Content Detection Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-900">Detected Content</h2>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="text-xs text-neutral-600 hover:text-neutral-950 font-medium flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More Files</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <Presentation className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono font-bold text-neutral-900">{pCount}</span>
            </div>
            <p className="text-xs font-medium text-neutral-700">Presentation</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-mono font-bold text-neutral-900">{dCount}</span>
            </div>
            <p className="text-xs font-medium text-neutral-700">Documentation</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-mono font-bold text-neutral-900">{vCount}</span>
            </div>
            <p className="text-xs font-medium text-neutral-700">Videos</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-mono font-bold text-neutral-900">{iCount}</span>
            </div>
            <p className="text-xs font-medium text-neutral-700">Images</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <File className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-mono font-bold text-neutral-900">{oCount}</span>
            </div>
            <p className="text-xs font-medium text-neutral-700">Other Files</p>
          </div>
        </div>
      </div>

      {/* Files List on Physical Storage with Direct Upload Integration */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-neutral-600" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Files in /{workspace.folder_path}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-400">
              {files.length} {files.length === 1 ? 'item' : 'items'}
            </span>

            {/* Direct Upload Button */}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs transition-all active:scale-98 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {files.length === 0 ? (
          /* Rich Empty State with Upload Action */
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-500 mb-3.5 border border-neutral-200/70">
              <Upload className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-900">No project files in this folder yet</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mb-5 leading-relaxed">
              Upload your presentation (.pptx), documentation (.pdf), demo video (.mp4), or images directly to this physical folder to build your interactive showcase.
            </p>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Project Files to /{workspace.folder_path}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {files.map((file, idx) => {
              const ext = (file.name.split('.').pop() || '').toUpperCase();
              const downloadUrl = api.getDownloadUrl(file.path, workspace.drive_uuid);
              const isDeleting = deletingPath === file.path;

              return (
                <div
                  key={file.path || idx}
                  className="p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50/70 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="font-mono uppercase font-semibold text-neutral-500">{ext || 'FILE'}</span>
                        <span>•</span>
                        <span>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : '--'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Download */}
                    <a
                      href={downloadUrl}
                      download={file.name}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.path)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete file from physical drive"
                    >
                      {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal connected to this workspace folder on physical drive */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        currentPath={workspace.folder_path}
        driveUuid={workspace.drive_uuid}
        onUploadSuccess={() => {
          setUploadModalOpen(false);
          fetchDetails(true);
          showToast('success', 'File uploaded successfully!', 'Showcase content has been updated.');
        }}
      />
    </div>
  );
}
