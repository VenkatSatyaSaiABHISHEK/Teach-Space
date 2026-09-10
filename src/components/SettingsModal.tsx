'use client';

import React, { useState } from 'react';
import {
  Settings,
  X,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Radio,
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, normalizeApiUrl, DEFAULT_API_URL, api } from '@/lib/api';
import { useToast } from './Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
}: SettingsModalProps) {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const cleanUrl = normalizeApiUrl(apiUrl);
    setApiUrl(cleanUrl);

    try {
      const res = await api.pingBackend(cleanUrl);
      if (res.online) {
        setTestResult({
          success: true,
          message: `Connected successfully to ${cleanUrl}! Latency: ${res.latencyMs || 12}ms`,
        });
        showToast('success', 'Connected to Raspberry Pi', `Latency: ${res.latencyMs || 12}ms`);
      } else {
        setTestResult({
          success: false,
          message: res.message || 'Server did not respond to /drives ping.',
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Could not connect to this URL. Verify endpoint address.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = normalizeApiUrl(apiUrl);
    setApiBaseUrl(cleanUrl);
    setApiUrl(cleanUrl);
    showToast('success', 'Settings updated', `Backend endpoint set to: ${cleanUrl}`);
    onSettingsSaved();
    onClose();
  };

  const handlePreset = (url: string) => {
    setApiUrl(url);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">TechSpace Settings</h2>
              <p className="text-[11px] text-neutral-400">
                Backend connection & hardware configuration
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
        <div className="p-6 space-y-5">
          {/* API Endpoint Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="apiEndpoint" className="text-xs font-medium text-neutral-700">
                FastAPI Backend URL
              </label>
              <span className="text-[11px] font-mono text-neutral-400">
                NEXT_PUBLIC_API_URL
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="apiEndpoint"
                type="text"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://cloud.vssa.site"
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-neutral-50 border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white text-neutral-900"
              />

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !apiUrl.trim()}
                className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-40"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Radio className="w-3.5 h-3.5" />
                )}
                <span>Test</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[11px] text-neutral-400">Presets:</span>
              <button
                type="button"
                onClick={() => handlePreset('https://cloud.vssa.site')}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-900 text-white font-mono transition-colors shadow-2xs"
              >
                Cloudflare Tunnel (cloud.vssa.site)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('http://192.168.137.119:8000')}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono transition-colors"
              >
                Local (192.168.137.119)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('http://localhost:8000')}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-mono transition-colors"
              >
                Localhost:8000
              </button>
            </div>

            {/* Test result status */}
            {testResult && (
              <div
                className={`flex items-start gap-2 p-2.5 mt-2 rounded-xl text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <p className="font-medium leading-tight">{testResult.message}</p>
              </div>
            )}
          </div>

          {/* Architecture / Privacy Guarantee */}
          <div className="p-4 rounded-xl border border-neutral-200/70 bg-neutral-50/50 space-y-2">
            <h4 className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-neutral-600" />
              <span>TechSpace Architecture</span>
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              TechSpace connects directly to your Raspberry Pi storage daemon. No cloud relay, no third-party database, and strictly no user accounts or tracking.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/40">
          <button
            type="button"
            onClick={() => {
              setApiUrl(DEFAULT_API_URL);
              setTestResult(null);
            }}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
          >
            Reset to default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
