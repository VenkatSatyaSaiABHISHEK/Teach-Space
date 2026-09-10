'use client';

import React from 'react';
import {
  Cpu,
  X,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  pingLatency?: number;
  driveCount: number;
  onOpenSettings: () => void;
}

export function SystemStatusModal({
  isOpen,
  onClose,
  isOnline,
  pingLatency,
  driveCount,
  onOpenSettings,
}: SystemStatusModalProps) {
  if (!isOpen) return null;

  const currentApi = getApiBaseUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Raspberry Pi Node</h2>
              <p className="text-[11px] text-neutral-400">
                Hardware & Storage Daemon Status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status highlight */}
          <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <div className="flex items-center gap-2.5">
              {isOnline ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-status-pulse" />
              ) : (
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                </div>
              )}
              <div>
                <p className="font-semibold text-neutral-900">
                  {isOnline ? 'System Online' : 'System Offline'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {isOnline ? 'Responding to API queries' : 'Check network connectivity'}
                </p>
              </div>
            </div>

            {pingLatency !== undefined && isOnline && (
              <span className="font-mono text-[11px] text-neutral-500 bg-white px-2 py-0.5 rounded-md border border-neutral-200/80">
                {pingLatency}ms
              </span>
            )}
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-100">
              <span className="text-[11px] text-neutral-400">Architecture</span>
              <p className="font-medium text-neutral-800 mt-0.5">ARM64 (RPi 4/5)</p>
            </div>
            <div className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-100">
              <span className="text-[11px] text-neutral-400">Backend Daemon</span>
              <p className="font-medium text-neutral-800 mt-0.5">FastAPI Python 3</p>
            </div>
            <div className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-100">
              <span className="text-[11px] text-neutral-400">Drives Mounted</span>
              <p className="font-medium text-neutral-800 mt-0.5">{driveCount} Drives</p>
            </div>
            <div className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-100">
              <span className="text-[11px] text-neutral-400">Authentication</span>
              <p className="font-medium text-neutral-800 mt-0.5">Disabled (V0)</p>
            </div>
          </div>

          {/* Connection URI */}
          <div className="p-3 rounded-xl border border-neutral-200/60 bg-white">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
              <span>Active Endpoint</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="text-neutral-700 hover:underline font-medium"
              >
                Change
              </button>
            </div>
            <p className="font-mono text-neutral-800 text-[11px] truncate">
              {currentApi}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
