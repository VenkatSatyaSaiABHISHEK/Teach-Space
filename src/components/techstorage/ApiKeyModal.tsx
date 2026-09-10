'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import { CreateTechStorageResponse } from '@/types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageData: CreateTechStorageResponse | null;
  onOpenDocs?: () => void;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  storageData,
  onOpenDocs,
}: ApiKeyModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(true);

  if (!isOpen || !storageData) return null;

  const apiKey = storageData.api_key || '';

  React.useEffect(() => {
    if (apiKey && storageData?.storage_id && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`ts_key_${storageData.storage_id}`, apiKey);
      } catch {}
    }
  }, [apiKey, storageData?.storage_id]);

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoToSpace = () => {
    onClose();
    router.push(`/techstorage/${storageData.storage_id}`);
  };

  const handleOpenDocs = () => {
    onClose();
    if (onOpenDocs) {
      onOpenDocs();
    } else {
      router.push(`/techstorage/${storageData.storage_id}?tab=api`);
    }
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 10)}${'*'.repeat(Math.max(16, apiKey.length - 14))}${apiKey.slice(-4)}`
    : 'ts_live_********************************';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative bg-white border border-neutral-200/90 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Success Icon & Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 stroke-[1.75]" />
          </div>

          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            API Key Created
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Storage Space <strong className="text-neutral-800">{storageData.name}</strong> was created successfully.
          </p>
        </div>

        {/* Warning Callout */}
        <div className="mt-5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-950">
              Your API key will not be shown again.
            </span>{' '}
            <span>
              Store this API key securely. Do not expose it in client-side JavaScript or public repositories.
            </span>
          </div>
        </div>

        {/* Key Display Container */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-neutral-500" />
              <span>Live API Key</span>
            </label>
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {revealed ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Mask</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Reveal</span>
                </>
              )}
            </button>
          </div>

          <div className="relative flex items-center">
            <div className="w-full pl-3.5 pr-24 py-3 bg-neutral-950 text-neutral-100 font-mono text-xs rounded-xl overflow-x-auto whitespace-nowrap select-all tracking-tight border border-neutral-800">
              {revealed ? apiKey : maskedKey}
            </div>

            <button
              type="button"
              onClick={copyToClipboard}
              className="absolute right-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Guidance Note */}
        <div className="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200/60 text-[11px] text-neutral-500 leading-relaxed">
          💡 <strong>Best Practice:</strong> Keep this API key in an environment variable (e.g.{' '}
          <code className="font-mono text-neutral-700 bg-neutral-200/70 px-1 py-0.5 rounded">
            TECHSTORAGE_API_KEY
          </code>
          ) inside your backend application or Node.js server.
        </div>

        {/* Action CTAs */}
        <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleOpenDocs}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>View API Docs</span>
          </button>

          <button
            type="button"
            onClick={handleGoToSpace}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <span>Open Storage Space</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
