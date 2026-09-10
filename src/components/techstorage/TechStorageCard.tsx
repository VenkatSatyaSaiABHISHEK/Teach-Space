'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HardDrive,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  Code2,
  Settings2,
  AlertTriangle,
  Folder,
  Activity,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { TechStorageItem, Drive } from '@/types';
import { formatBytes } from '@/lib/api';

interface TechStorageCardProps {
  storage: TechStorageItem;
  drives: Drive[];
  onOpenApiDocs?: (storage: TechStorageItem) => void;
  onOpenSettings?: (storage: TechStorageItem) => void;
}

export function TechStorageCard({
  storage,
  drives,
  onOpenApiDocs,
  onOpenSettings,
}: TechStorageCardProps) {
  const [copiedId, setCopiedId] = useState(false);

  // Match the physical drive by uuid
  const drive = drives.find((d) => d.uuid === storage.drive_uuid);
  const isDriveKnown = drives.length > 0;
  const isDriveOnline = drive
    ? (drive.status || '').toLowerCase() === 'online' ||
      (drive.status || '').toLowerCase() === 'online_readonly'
    : false;

  // A storage space is offline if the drives are loaded and the drive is missing or not online
  const isOffline = isDriveKnown && (!drive || !isDriveOnline);

  const copyStorageId = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(storage.storage_id);
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

  const driveSize = drive?.size || (drive?.total_bytes ? formatBytes(drive.total_bytes) : '119.2 GB');

  return (
    <div
      className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
        isOffline
          ? 'border-neutral-200/70 bg-neutral-50/40 shadow-2xs'
          : 'border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div>
        {/* Top Status & Date Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isOffline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Storage Offline</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse" />
                <span>Storage Online</span>
              </span>
            )}

            {/* API Status Badge */}
            {storage.enabled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>API Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                <span>API Disabled</span>
              </span>
            )}
          </div>

          {storage.created_at && (
            <span className="text-[11px] text-neutral-400 flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(storage.created_at)}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-neutral-950 transition-colors">
          {storage.name}
        </h3>

        {/* Storage ID row with copy action */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Storage ID:</span>
          <button
            type="button"
            onClick={copyStorageId}
            title="Click to copy Storage ID"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100/90 hover:bg-neutral-200/80 text-neutral-700 font-mono text-xs transition-colors cursor-pointer"
          >
            <span>{storage.storage_id}</span>
            {copiedId ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-neutral-400 hover:text-neutral-600" />
            )}
          </button>
        </div>

        {/* Meta details grid */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">
              <span className="text-neutral-400">Drive:</span>{' '}
              <strong className="font-medium text-neutral-800">
                {drive?.name ? `${drive.name} (${driveSize})` : driveSize}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-600">
            <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">
              <span className="text-neutral-400">Folder:</span>{' '}
              <span className="font-mono text-neutral-800">
                {storage.folder_path ? `/${storage.folder_path}` : 'Root'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-600">
            <Activity className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">
              <span className="text-neutral-400">Rate Limit:</span>{' '}
              <span className="font-medium text-neutral-800">
                {storage.rate_limit || 100} / {storage.rate_window || 60}s
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-600">
            <span className="text-neutral-400 shrink-0">Permissions:</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              {storage.permissions?.read && (
                <span className="px-1 bg-neutral-100 rounded text-neutral-700" title="Read enabled">R</span>
              )}
              {storage.permissions?.upload && (
                <span className="px-1 bg-neutral-100 rounded text-neutral-700" title="Upload enabled">W</span>
              )}
              {storage.permissions?.create_folder && (
                <span className="px-1 bg-neutral-100 rounded text-neutral-700" title="Create folder enabled">M</span>
              )}
              {storage.permissions?.delete && (
                <span className="px-1 bg-rose-100 text-rose-700 rounded" title="Delete enabled">D</span>
              )}
            </div>
          </div>
        </div>

        {/* Offline Disclaimer Banner if drive is disconnected */}
        {isOffline && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Physical Storage Unavailable</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                The physical storage drive is currently unavailable. Your Storage Space configuration is preserved and will automatically become available when the drive is reconnected.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* API Docs Button */}
          <button
            type="button"
            onClick={() => onOpenApiDocs?.(storage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            title="View API integration docs"
          >
            <Code2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>API Docs</span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => onOpenSettings?.(storage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            title="Configure settings & permissions"
          >
            <Settings2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Settings</span>
          </button>
        </div>

        {/* Open Storage Space Button */}
        <Link
          href={`/techstorage/${storage.storage_id}`}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
        >
          <span>Open</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
