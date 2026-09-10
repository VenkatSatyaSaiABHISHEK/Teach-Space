'use client';

import React, { useState } from 'react';
import { HardDrive, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ShowcaseOfflineProps {
  title?: string;
  onRetry?: () => void;
  showBackToDashboard?: boolean;
}

export function ShowcaseOffline({
  title,
  onRetry,
  showBackToDashboard = false,
}: ShowcaseOfflineProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setRetrying(false), 800);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
        {/* Physical Drive Offline Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-6 text-amber-600">
          <HardDrive className="w-8 h-8 stroke-[1.75]" />
        </div>

        {/* Offline Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Drive Offline</span>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          Project Temporarily Unavailable
        </h2>

        {/* Subtitle / Explanation */}
        <p className="text-sm text-neutral-600 mt-2.5 leading-relaxed">
          The physical storage drive containing{' '}
          <span className="font-semibold text-neutral-800">{title || 'this project'}</span> is
          currently disconnected.
        </p>

        <p className="text-xs text-neutral-400 mt-2">
          As soon as the physical drive is reconnected to the TechSpace unit, this showcase will
          automatically become available again.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-2xs transition-all cursor-pointer active:scale-98 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Checking Drive...' : 'Check Drive Status'}</span>
            </button>
          )}

          {showBackToDashboard && (
            <Link
              href="/workspaces"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workspaces</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
