'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Lock,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Workspace } from '@/types';

interface ShareWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
}

export function ShareWorkspaceModal({ isOpen, onClose, workspace }: ShareWorkspaceModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !workspace) return null;

  // Compute public showcase URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cloud.vssa.site';
  const showcaseUrl = `${origin}/showcase/${workspace.share_token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(showcaseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl border border-neutral-200/90 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Share Project Showcase</h2>
              <p className="text-[11px] text-neutral-400 truncate max-w-[240px]">
                {workspace.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/60 text-center">
            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <QRCodeSVG
                value={showcaseUrl}
                size={148}
                level="M"
                marginSize={0}
                className="w-full h-auto"
              />
            </div>
            <p className="text-xs font-semibold text-neutral-800 mt-3">
              Scan to view presentation on mobile
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Instant interactive showcase without app installs
            </p>
          </div>

          {/* Share Link Input Row */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Showcase URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={showcaseUrl}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-neutral-50 border border-neutral-200/80 text-neutral-800 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer shrink-0 active:scale-98"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Direct Link Action */}
          <div className="pt-2">
            <a
              href={showcaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Public Showcase</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
