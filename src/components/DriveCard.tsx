'use client';

import React, { useState } from 'react';
import {
  HardDrive,
  FolderOpen,
  AlertCircle,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { Drive } from '@/types';
import { formatBytes } from '@/lib/api';

interface DriveCardProps {
  drive: Drive;
  index?: number;
  onOpenDrive?: (drive: Drive) => void;
}

export function DriveCard({ drive, index = 0, onOpenDrive }: DriveCardProps) {
  const [copiedUuid, setCopiedUuid] = useState(false);

  const rawStatus = (drive.status || 'online').toLowerCase();
  const isOffline = rawStatus === 'offline';
  const isReadOnly = rawStatus === 'online_readonly' || drive.mount_mode === 'ro';
  const isOnlineRW = !isOffline && !isReadOnly && (rawStatus === 'online' || drive.mount_mode === 'rw');

  // Display name: prefer drive label (e.g. "SSD"), fallback to name (e.g. "sdb2")
  const displayName = drive.label || drive.name || `Drive ${String(index + 1).padStart(2, '0')}`;

  // Usable storage calculation from total_bytes & free_bytes
  const totalBytes = drive.total_bytes ?? drive.capacity_bytes;
  const freeBytes = drive.free_bytes;
  const isUsageKnown = drive.is_usage_known !== false && (freeBytes !== undefined || drive.used_bytes !== undefined);
  const usedBytes = drive.used_bytes ?? (totalBytes && freeBytes !== undefined ? Math.max(0, totalBytes - freeBytes) : undefined);

  const totalFormatted = drive.capacity || (totalBytes ? formatBytes(totalBytes) : (drive.size ? String(drive.size) : '0 B'));
  const freeFormatted = freeBytes !== undefined ? formatBytes(freeBytes) : undefined;
  const usedFormatted = usedBytes !== undefined ? formatBytes(usedBytes) : undefined;

  // Percentage used calculation
  let percentUsed = 0;
  if (typeof drive.usage_percent === 'number') {
    percentUsed = drive.usage_percent;
  } else if (totalBytes && totalBytes > 0 && usedBytes !== undefined && isUsageKnown) {
    percentUsed = Math.min(100, Math.max(0, Math.round((usedBytes / totalBytes) * 100)));
  }

  const handleCopyUuid = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!drive.uuid) return;
    navigator.clipboard.writeText(drive.uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 1500);
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-5 transition-all duration-150 flex flex-col justify-between relative overflow-hidden ${
        !isOffline
          ? 'border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
          : 'border-neutral-200/60 bg-neutral-50/50 opacity-90'
      }`}
    >
      <div className="space-y-4">
        {/* Drive Title & Type Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isOnlineRW
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                  : isReadOnly
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                  : 'bg-neutral-200/70 text-neutral-400'
              }`}
            >
              <HardDrive className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-neutral-900 truncate">
                {displayName}
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                {drive.name ? `Partition: ${drive.name}` : 'Physical Storage'}
              </p>
            </div>
          </div>

          {/* Mount Mode Pill */}
          {drive.mount_mode && (
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase border ${
                drive.mount_mode === 'rw'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : 'bg-amber-50 text-amber-700 border-amber-200/60'
              }`}
            >
              {drive.mount_mode.toUpperCase()}
            </span>
          )}
        </div>

        {/* Status Badge & Filesystem Row */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status: Online / Read-Write */}
          {isOnlineRW && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse" />
              <span>Online / Read-Write</span>
            </span>
          )}

          {/* Status: Online / Read-Only */}
          {isReadOnly && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Online / Read-Only</span>
            </span>
          )}

          {/* Status: Offline */}
          {isOffline && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Offline</span>
            </span>
          )}

          {drive.filesystem && (
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 uppercase border border-neutral-200/50">
              {drive.filesystem.toLowerCase() === 'ntfs' ? 'NTFS (ntfs3)' : drive.filesystem}
            </span>
          )}
        </div>

        {/* UUID Badge with Click to Copy */}
        {drive.uuid && (
          <div className="flex items-center justify-between text-[11px] bg-neutral-50 border border-neutral-200/60 rounded-lg px-2.5 py-1.5">
            <span className="text-neutral-500 font-mono truncate mr-2">
              UUID: <span className="font-semibold text-neutral-800">{drive.uuid}</span>
            </span>
            <button
              type="button"
              onClick={handleCopyUuid}
              className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
              title="Copy Drive UUID"
            >
              {copiedUuid ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}

        {/* Online State: Storage Metrics & Progress */}
        {!isOffline ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">
                  {totalFormatted} Total
                </span>
                {usedFormatted && (
                  <span className="text-neutral-500 font-mono text-[11px]">
                    {usedFormatted} used
                  </span>
                )}
              </div>

              {freeFormatted ? (
                <p className="text-neutral-500">
                  {freeFormatted} Available
                </p>
              ) : (
                <p className="text-neutral-400 text-[11px]">
                  Physical USB drive attached and mounted
                </p>
              )}
            </div>

            {/* Storage Usage Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <span>{isUsageKnown ? `${percentUsed}% Used` : 'Ready'}</span>
                {!isUsageKnown && (
                  <span className="text-neutral-400 text-[10px]">Stats live</span>
                )}
              </div>

              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentUsed > 90
                      ? 'bg-rose-500'
                      : percentUsed > 75
                      ? 'bg-amber-500'
                      : 'bg-neutral-900'
                  }`}
                  style={{ width: isUsageKnown ? `${Math.max(percentUsed, 2)}%` : '100%' }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Offline State: Disconnected Message */
          <div className="py-4 space-y-1 text-xs text-neutral-500">
            <p className="font-medium text-neutral-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
              <span>Storage device disconnected</span>
            </p>
            <p className="text-[11px] text-neutral-400">
              Plug in USB storage to Raspberry Pi to restore access.
            </p>
          </div>
        )}
      </div>

      {/* Action Button: Open Drive or Drive Unavailable */}
      <div className="mt-5 pt-3 border-t border-neutral-100">
        {!isOffline ? (
          <button
            type="button"
            onClick={() => onOpenDrive?.(drive)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open in Cloud Drive</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2 px-3 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-medium border border-neutral-200/60 flex items-center justify-center gap-1.5 cursor-not-allowed"
          >
            <span>Drive unavailable</span>
          </button>
        )}
      </div>
    </div>
  );
}
