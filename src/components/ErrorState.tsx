'use client';

import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, HardDrive } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isDriveError?: boolean;
}

export function ErrorState({
  title = 'Unable to complete request',
  message,
  onRetry,
  isDriveError = false,
}: ErrorStateProps) {
  const isNetwork = message.toLowerCase().includes('connect') || message.toLowerCase().includes('network');

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-neutral-200/80 rounded-2xl shadow-2xs">
      <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 mb-3.5">
        {isDriveError ? (
          <HardDrive className="w-6 h-6 text-neutral-600" />
        ) : isNetwork ? (
          <WifiOff className="w-6 h-6 text-neutral-600" />
        ) : (
          <AlertCircle className="w-6 h-6 text-neutral-600" />
        )}
      </div>

      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <p className="text-xs text-neutral-500 mt-1 max-w-md leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
