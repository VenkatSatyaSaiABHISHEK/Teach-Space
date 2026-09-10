'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Globe,
  X,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StorageItem } from '@/types';
import { useToast } from './Toast';

interface PublicShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: StorageItem | null;
}

export function PublicShareModal({
  isOpen,
  onClose,
  folder,
}: PublicShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !folder) return null;

  // Format clean public share link as specified
  const shareId = encodeURIComponent(folder.path.replace(/\s+/g, '-'));
  const shareUrl = `https://cloud.vssa.site/share/${shareId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('success', 'Link copied', 'Share link copied to your clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Could not copy', 'Please manually select and copy the link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${folder.name} - TechSpace`,
          text: `Access folder "${folder.name}" on TechSpace`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Share Folder</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded-full">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Public Folder</span>
                </span>
                <span className="text-[11px] text-neutral-400 truncate max-w-[160px]">
                  {folder.name}
                </span>
              </div>
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-500">
            Anyone with this link can view and download files inside this folder.
          </p>

          {/* Share Link Field */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
              Public Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs font-mono text-neutral-700 truncate select-all">
                {shareUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <QrCode className="w-4 h-4 text-neutral-500" />
              <span>{showQr ? 'Hide QR code' : 'Show QR code for mobile scanning'}</span>
            </button>

            {showQr && (
              <div className="mt-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex flex-col items-center justify-center animate-in fade-in duration-150">
                <div className="p-3 bg-white rounded-xl shadow-2xs border border-neutral-200/60">
                  <QRCodeSVG value={shareUrl} size={160} level="M" />
                </div>
                <p className="text-[11px] text-neutral-500 mt-2.5">
                  Point your smartphone camera to quickly open this folder
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/40">
          <span className="text-[11px] text-neutral-400">
            Powered by TechSpace
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
