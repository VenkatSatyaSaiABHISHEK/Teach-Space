'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  HardDrive,
  FolderClosed,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Presentation,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  Loader2,
  Sparkles,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Drive, StorageItem, Workspace } from '@/types';
import { api, categorizeItems } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Step 1: Form states
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [selectedDriveUuid, setSelectedDriveUuid] = useState<string>('');

  const [folders, setFolders] = useState<StorageItem[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Step 2: Content detection preview
  const [folderItems, setFolderItems] = useState<StorageItem[]>([]);
  const [detectingContent, setDetectingContent] = useState(false);
  const [detectedCategories, setDetectedCategories] = useState<{
    presentation: StorageItem[];
    documentation: StorageItem[];
    videos: StorageItem[];
    images: StorageItem[];
    other_files: StorageItem[];
    folders: StorageItem[];
  } | null>(null);

  // Step 3: Submission & Success
  const [submitting, setSubmitting] = useState(false);
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null);
  const [copied, setCopied] = useState(false);

  // Load drives on mount
  useEffect(() => {
    async function loadDrives() {
      setLoadingDrives(true);
      try {
        const fetchedDrives = await api.getDrives();
        setDrives(fetchedDrives);
        // Default to first online drive
        const firstOnline = fetchedDrives.find(
          (d) => (d.status || '').toLowerCase() === 'online' || (d.status || '').toLowerCase() === 'online_readonly'
        );
        if (firstOnline?.uuid) {
          setSelectedDriveUuid(firstOnline.uuid);
        } else if (fetchedDrives.length > 0 && fetchedDrives[0]?.uuid) {
          setSelectedDriveUuid(fetchedDrives[0].uuid);
        }
      } catch (err) {
        showToast(
          'error',
          'Failed to load drives',
          err instanceof Error ? err.message : 'Please check connection.'
        );
      } finally {
        setLoadingDrives(false);
      }
    }
    loadDrives();
  }, [showToast]);

  // Load root folders when drive is selected
  useEffect(() => {
    if (!selectedDriveUuid) return;

    async function loadFolders() {
      setLoadingFolders(true);
      setSelectedFolder('');
      setDetectedCategories(null);
      try {
        const items = await api.getFiles('', selectedDriveUuid);
        const dirList = items.filter((item: StorageItem) => item.is_dir);
        setFolders(dirList);

        if (dirList.length > 0) {
          // Pre-select first folder
          setSelectedFolder(dirList[0].name);
          setTitle(dirList[0].name.replace(/[-_]/g, ' '));
        }
      } catch (err) {
        showToast(
          'error',
          'Failed to load folders on drive',
          err instanceof Error ? err.message : 'Storage access error.'
        );
      } finally {
        setLoadingFolders(false);
      }
    }
    loadFolders();
  }, [selectedDriveUuid, showToast]);

  // Live content detection preview when folder is selected
  useEffect(() => {
    if (!selectedDriveUuid || !selectedFolder) {
      setDetectedCategories(null);
      return;
    }

    async function detectFolderContent() {
      setDetectingContent(true);
      try {
        const items = await api.getFiles(selectedFolder, selectedDriveUuid);
        setFolderItems(items);
        const categories = categorizeItems(items);
        setDetectedCategories(categories);
      } catch (err) {
        console.error('Content detection error:', err);
        setDetectedCategories(null);
      } finally {
        setDetectingContent(false);
      }
    }

    detectFolderContent();
  }, [selectedDriveUuid, selectedFolder]);

  // Handle folder change
  const handleFolderChange = (folderName: string) => {
    setSelectedFolder(folderName);
    if (!title || folders.some((f) => f.name.replace(/[-_]/g, ' ') === title)) {
      setTitle(folderName.replace(/[-_]/g, ' '));
    }
  };

  // Submit creation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriveUuid) {
      showToast('error', 'Drive required', 'Please select a storage drive.');
      return;
    }
    if (!selectedFolder) {
      showToast('error', 'Folder required', 'Please select a project folder.');
      return;
    }
    if (!title.trim()) {
      showToast('error', 'Title required', 'Please enter a project title.');
      return;
    }

    setSubmitting(true);
    try {
      const newWs = await api.createWorkspace({
        drive_uuid: selectedDriveUuid,
        folder_path: selectedFolder,
        title: title.trim(),
        description: description.trim() || undefined,
      });

      setCreatedWorkspace(newWs);
      showToast(
        'success',
        'Project Showcase Created!',
        'Your project showcase is live and ready to share.'
      );
    } catch (err) {
      showToast(
        'error',
        'Failed to create showcase',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Get full showcase link
  const showcaseUrl = createdWorkspace
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/showcase/${createdWorkspace.share_token}`
    : '';

  const handleCopyLink = () => {
    if (!showcaseUrl) return;
    navigator.clipboard.writeText(showcaseUrl);
    setCopied(true);
    showToast('success', 'Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Top Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <Link
          href="/workspaces"
          className="hover:text-neutral-900 transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Workspaces</span>
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-semibold">Create Showcase</span>
      </div>

      {createdWorkspace ? (
        /* ========================================================================= */
        /* SUCCESS SCREEN                                                            */
        /* ========================================================================= */
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-12 shadow-sm text-center animate-fade-in max-w-2xl mx-auto">
          {/* Celebration icon */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center mx-auto mb-6 text-emerald-600">
            <CheckCircle2 className="w-8 h-8 stroke-[1.75]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Showcase Ready</span>
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Your project showcase is ready!
          </h2>

          <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
            <span className="font-semibold text-neutral-800">{createdWorkspace.title}</span> has been converted into an interactive showcase from your physical TechSpace drive.
          </p>

          {/* QR Code */}
          <div className="mt-8 flex justify-center">
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs inline-block">
              <QRCodeSVG
                value={showcaseUrl}
                size={160}
                bgColor="#ffffff"
                fgColor="#171717"
                level="M"
              />
            </div>
          </div>

          {/* Shareable URL bar */}
          <div className="mt-6 max-w-lg mx-auto">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 text-left">
              Public Showcase URL
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-neutral-50 border border-neutral-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={showcaseUrl}
                className="w-full bg-transparent px-3 py-1 text-xs sm:text-sm font-mono text-neutral-800 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shrink-0 cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/showcase/${createdWorkspace.share_token}`}
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <span>Open Showcase</span>
              <ExternalLink className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/workspaces')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Workspaces</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CREATION FORM                                                             */
        /* ========================================================================= */
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-10 shadow-xs">
          {/* Header */}
          <div className="pb-6 border-b border-neutral-100">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Create Project Showcase
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 leading-relaxed">
              Turn your project folder on physical storage into a beautiful interactive presentation showcase.
            </p>
          </div>

          <form onSubmit={handleCreate} className="mt-8 space-y-6">
            {/* 1. Drive Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5 flex items-center justify-between">
                <span>1. Select Physical Drive</span>
                {loadingDrives && <span className="text-neutral-400 font-normal">Detecting drives...</span>}
              </label>

              {loadingDrives ? (
                <div className="h-11 bg-neutral-100 rounded-xl animate-pulse" />
              ) : drives.length === 0 ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No storage drives connected to TechSpace. Please plug in a USB drive.</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedDriveUuid}
                    onChange={(e) => setSelectedDriveUuid(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 appearance-none shadow-2xs"
                  >
                    {drives.map((d) => (
                      <option key={d.uuid || d.id} value={d.uuid || ''}>
                        {d.label || d.name || 'Physical Drive'} ({d.size || 'Storage'}) — {d.status}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                    ▼
                  </div>
                </div>
              )}
            </div>

            {/* 2. Folder Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5 flex items-center justify-between">
                <span>2. Select Project Folder</span>
                {loadingFolders && <span className="text-neutral-400 font-normal">Scanning folders...</span>}
              </label>

              {loadingFolders ? (
                <div className="h-11 bg-neutral-100 rounded-xl animate-pulse" />
              ) : folders.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No folders found in drive root. Create a folder in My Files first.</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedFolder}
                    onChange={(e) => handleFolderChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 appearance-none shadow-2xs"
                  >
                    {folders.map((f) => (
                      <option key={f.path || f.name} value={f.name}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                    ▼
                  </div>
                </div>
              )}
            </div>

            {/* 3. Project Title */}
            <div>
              <label
                htmlFor="project-title"
                className="block text-xs font-semibold text-neutral-800 mb-1.5"
              >
                3. Project Title
              </label>
              <input
                id="project-title"
                type="text"
                placeholder="e.g. Smart Agriculture System"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 shadow-2xs"
              />
            </div>

            {/* 4. Project Description */}
            <div>
              <label
                htmlFor="project-desc"
                className="block text-xs font-semibold text-neutral-800 mb-1.5"
              >
                4. Project Description (Optional)
              </label>
              <textarea
                id="project-desc"
                rows={3}
                placeholder="Brief summary of what this project accomplishes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 shadow-2xs resize-none"
              />
            </div>

            {/* 5. Detected Content Preview */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-neutral-800">
                  5. Detected Content Preview
                </span>
                {detectingContent && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing folder...</span>
                  </span>
                )}
              </div>

              {detectingContent ? (
                <div className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />
              ) : detectedCategories ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Presentation */}
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Presentation</span>
                      </div>
                      <span className="font-bold text-neutral-900 font-mono">
                        {detectedCategories.presentation.length}
                      </span>
                    </div>

                    {/* Documentation */}
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Documentation</span>
                      </div>
                      <span className="font-bold text-neutral-900 font-mono">
                        {detectedCategories.documentation.length}
                      </span>
                    </div>

                    {/* Videos */}
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Videos</span>
                      </div>
                      <span className="font-bold text-neutral-900 font-mono">
                        {detectedCategories.videos.length}
                      </span>
                    </div>

                    {/* Images */}
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Images</span>
                      </div>
                      <span className="font-bold text-neutral-900 font-mono">
                        {detectedCategories.images.length}
                      </span>
                    </div>

                    {/* Other Files */}
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Other Files</span>
                      </div>
                      <span className="font-bold text-neutral-900 font-mono">
                        {detectedCategories.other_files.length}
                      </span>
                    </div>

                    {/* Folders */}
                    <div className="p-3 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-neutral-500 shrink-0" />
                        <span className="font-medium text-neutral-700">Subfolders</span>
                      </div>
                      <span className="font-bold text-neutral-900 font-mono">
                        {detectedCategories.folders.length}
                      </span>
                    </div>
                  </div>

                  {folderItems.length === 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60 mt-2">
                      This folder is currently empty. You can still create the showcase and upload files into it anytime!
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-center text-xs text-neutral-400">
                  Select a drive and folder above to preview detected content.
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-neutral-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/workspaces')}
                className="px-5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !selectedDriveUuid || !selectedFolder || !title.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Showcase...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Create Showcase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
