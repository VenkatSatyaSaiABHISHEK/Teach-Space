'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Share2,
  Settings2,
  HardDrive,
  Presentation,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { Workspace, Drive } from '@/types';

interface WorkspaceCardProps {
  workspace: Workspace;
  drives: Drive[];
  onOpenShare: (workspace: Workspace) => void;
}

export function WorkspaceCard({ workspace, drives, onOpenShare }: WorkspaceCardProps) {
  // Check if the physical drive containing this project is online
  const drive = drives.find((d) => d.uuid === workspace.drive_uuid);
  const isDriveOnline = drive ? (drive.status || '').toLowerCase() === 'online' || (drive.status || '').toLowerCase() === 'online_readonly' : false;
  const isDriveKnown = drives.length > 0;
  // If drives are loaded and drive is missing or status is offline, mark offline
  const isOffline = isDriveKnown && (!drive || !isDriveOnline);

  const counts = workspace.content_counts || {};

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

  return (
    <div
      className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
        isOffline
          ? 'border-neutral-200/60 bg-neutral-50/40 opacity-95'
          : 'border-neutral-200/80 hover:border-neutral-300/90 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div>
        {/* Top Badges & Status Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {isOffline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Drive Offline</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse" />
                <span>Online</span>
              </span>
            )}

            <span className="text-[11px] font-mono text-neutral-400 bg-neutral-100/70 border border-neutral-200/50 px-2 py-0.5 rounded-md">
              /{workspace.folder_path}
            </span>
          </div>

          {workspace.created_at && (
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(workspace.created_at)}</span>
            </span>
          )}
        </div>

        {/* Project Title */}
        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-neutral-950 transition-colors">
          {workspace.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
          {workspace.description || 'Turn your project folder into an interactive showcase.'}
        </p>

        {/* Offline Disclaimer Banner if drive is disconnected */}
        {isOffline ? (
          <div className="mt-4 p-3 rounded-xl bg-neutral-100/80 border border-neutral-200/70 text-neutral-600 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-neutral-800">Drive Disconnected</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                This project is temporarily unavailable because the physical storage drive is disconnected.
              </p>
            </div>
          </div>
        ) : (
          /* Detected Content Pills */
          <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-1.5 text-[11px]">
            {counts.presentation !== undefined && counts.presentation > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-medium">
                <Presentation className="w-3 h-3 text-amber-600" />
                <span>Presentation</span>
              </span>
            )}

            {counts.documentation !== undefined && counts.documentation > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/60 font-medium">
                <FileText className="w-3 h-3 text-blue-600" />
                <span>{counts.documentation} Docs</span>
              </span>
            )}

            {counts.videos !== undefined && counts.videos > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/60 font-medium">
                <Video className="w-3 h-3 text-purple-600" />
                <span>{counts.videos} Video{counts.videos > 1 ? 's' : ''}</span>
              </span>
            )}

            {counts.images !== undefined && counts.images > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
                <ImageIcon className="w-3 h-3 text-emerald-600" />
                <span>{counts.images} Image{counts.images > 1 ? 's' : ''}</span>
              </span>
            )}

            {counts.other_files !== undefined && counts.other_files > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/60 font-medium">
                <File className="w-3 h-3 text-neutral-500" />
                <span>{counts.other_files} File{counts.other_files > 1 ? 's' : ''}</span>
              </span>
            )}

            {Object.values(counts).every((v) => !v) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-50 text-neutral-500 border border-neutral-200/50">
                <HardDrive className="w-3 h-3 text-neutral-400" />
                <span>Project Files Ready</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={() => onOpenShare(workspace)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            title="Share showcase link and QR"
          >
            <Share2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Share</span>
          </button>

          {/* Manage Button */}
          <Link
            href={`/workspaces/${workspace.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            title="Manage project details"
          >
            <Settings2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Manage</span>
          </Link>
        </div>

        {/* Open Showcase CTA Button */}
        {isOffline ? (
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-medium border border-neutral-200/60 cursor-not-allowed"
          >
            <span>Unavailable</span>
          </button>
        ) : (
          <Link
            href={`/showcase/${workspace.share_token}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
          >
            <span>Open</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
