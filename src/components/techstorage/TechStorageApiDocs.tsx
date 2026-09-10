'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Key,
  Globe,
  Terminal,
  ShieldAlert,
  Layers,
  FileCode2,
  ChevronDown,
  Play,
  Send,
  Loader2,
  ExternalLink,
  Sparkles,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { TechStorageItem } from '@/types';
import { getApiBaseUrl, getTechStoragePublicApiUrl, getTechStorageSpaceApiUrl } from '@/lib/api';

interface TechStorageApiDocsProps {
  storage: TechStorageItem;
}

export function TechStorageApiDocs({ storage }: TechStorageApiDocsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'js' | 'python' | 'node'>('js');

  // Interactive user API key input for dynamic documentation
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [keyRevealed, setKeyRevealed] = useState<boolean>(true);

  // Auto-fill API key from sessionStorage if created recently
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(`ts_key_${storage.storage_id}`);
        if (cached) {
          setUserApiKey(cached);
        }
      } catch {}
    }
  }, [storage.storage_id]);

  const handleApiKeyChange = (val: string) => {
    setUserApiKey(val);
    if (typeof window !== 'undefined') {
      try {
        if (val.trim()) {
          sessionStorage.setItem(`ts_key_${storage.storage_id}`, val.trim());
        } else {
          sessionStorage.removeItem(`ts_key_${storage.storage_id}`);
        }
      } catch {}
    }
  };

  // Live API Tester states
  const [testEndpoint, setTestEndpoint] = useState<'info' | 'list_files' | 'create_folder'>('list_files');
  const [testSubpath, setTestSubpath] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponseStatus, setTestResponseStatus] = useState<number | null>(null);
  const [testResponseData, setTestResponseData] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const publicApiBase = getTechStoragePublicApiUrl();
  const apiBaseUrl = getTechStorageSpaceApiUrl(storage.storage_id);

  const effectiveKey = userApiKey.trim() || 'YOUR_API_KEY';

  const copyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const executeApiTest = async () => {
    setTestLoading(true);
    setTestResponseStatus(null);
    setTestResponseData(null);
    const start = Date.now();

    try {
      let subUrl = '';
      let method = 'GET';

      if (testEndpoint === 'info') {
        subUrl = `/api/backend/api/storage/${storage.storage_id}`;
      } else if (testEndpoint === 'list_files') {
        const query = testSubpath ? `?path=${encodeURIComponent(testSubpath)}` : '';
        subUrl = `/api/backend/api/storage/${storage.storage_id}/files${query}`;
      } else if (testEndpoint === 'create_folder') {
        method = 'POST';
        const query = testSubpath ? `?path=${encodeURIComponent(testSubpath)}` : '?path=NewFolder';
        subUrl = `/api/backend/api/storage/${storage.storage_id}/folders${query}`;
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (userApiKey.trim()) {
        headers['Authorization'] = `Bearer ${userApiKey.trim()}`;
      }

      const res = await fetch(subUrl, { method, headers });
      const elapsed = Date.now() - start;
      setTestLatency(elapsed);
      setTestResponseStatus(res.status);

      const json = await res.json().catch(() => ({}));
      setTestResponseData(JSON.stringify(json, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to API';
      setTestResponseStatus(500);
      setTestResponseData(JSON.stringify({ error: msg }, null, 2));
    } finally {
      setTestLoading(false);
    }
  };

  const jsCode = `// 1. List files in your Storage Space
async function listFiles(subpath = "") {
  const url = "${apiBaseUrl}/files" + (subpath ? \`?path=\${encodeURIComponent(subpath)}\` : "");
  const res = await fetch(url, {
    headers: {
      "Authorization": "Bearer ${effectiveKey}"
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail?.message || "Failed to list files");
  }

  const data = await res.json();
  console.log("Files:", data.files);
  return data.files;
}

// 2. Upload a file to your Storage Space
async function uploadFile(fileBlob, filename, subpath = "") {
  const formData = new FormData();
  formData.append("file", fileBlob, filename);

  const url = "${apiBaseUrl}/files" + (subpath ? \`?path=\${encodeURIComponent(subpath)}\` : "");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer ${effectiveKey}"
    },
    body: formData
  });

  return await res.json();
}`;

  const pythonCode = `import requests

API_KEY = "${effectiveKey}"
BASE_URL = "${apiBaseUrl}"

headers = {
    "Authorization": f"Bearer {API_KEY}"
}

# 1. Get Storage Space Information & Online Status
info_res = requests.get(BASE_URL, headers=headers)
print("Storage Status:", info_res.json())

# 2. List files
files_res = requests.get(f"{BASE_URL}/files", headers=headers)
print("Files:", files_res.json())

# 3. Upload a file
with open("dataset.csv", "rb") as f:
    upload_res = requests.post(
        f"{BASE_URL}/files",
        headers=headers,
        files={"file": ("dataset.csv", f, "text/csv")}
    )
    print("Upload Result:", upload_res.json())

# 4. Download a file
download_res = requests.get(f"{BASE_URL}/files/dataset.csv", headers=headers)
with open("downloaded_dataset.csv", "wb") as f:
    f.write(download_res.content)
print("Downloaded dataset.csv successfully!")`;

  const nodeCode = `// Server-Side Node.js / Next.js Server Action
// (IMPORTANT: Always keep API keys in server environment variables)
import axios from 'axios';

const TECHSTORAGE_API_KEY = process.env.TECHSTORAGE_API_KEY || "${effectiveKey}";
const TECHSTORAGE_BASE = "${apiBaseUrl}";

const client = axios.create({
  baseURL: TECHSTORAGE_BASE,
  headers: {
    Authorization: \`Bearer \${TECHSTORAGE_API_KEY}\`,
  },
  timeout: 30000,
});

// Example: Fetch list of uploaded project assets
export async function getProjectFiles(path = '') {
  try {
    const res = await client.get('/files', { params: { path } });
    return res.data.files;
  } catch (err) {
    if (err.response?.status === 503) {
      throw new Error("Physical storage drive is currently offline.");
    }
    throw new Error(err.response?.data?.detail?.message || "Storage API error");
  }
}`;

  const curlExample = `curl -H "Authorization: Bearer ${effectiveKey}" \\
  "${apiBaseUrl}/files"`;

  return (
    <div className="space-y-6">
      {/* API Endpoint & Auth Credentials Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-neutral-700" />
              <span>TechStorage API</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Dedicated public REST API endpoints to integrate external apps with this storage space.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`${getApiBaseUrl()}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
            >
              <span>Swagger Interactive Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] font-medium text-neutral-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  storage.enabled ? 'bg-emerald-500 animate-status-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{storage.enabled ? '🟢 Active' : '🔴 Revoked'}</span>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base URL */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-600">API Base URL</span>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs text-neutral-800">
              <span className="truncate pr-2 font-medium">{apiBaseUrl}</span>
              <button
                type="button"
                onClick={() => copyText(apiBaseUrl, 'url')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
                title="Copy API Base URL"
              >
                {copiedKey === 'url' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600">Authentication</span>
              {userApiKey && (
                <button
                  type="button"
                  onClick={() => setKeyRevealed(!keyRevealed)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer font-medium"
                >
                  {keyRevealed ? (
                    <>
                      <EyeOff className="w-3 h-3 text-neutral-500" />
                      <span>Mask Key</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-neutral-500" />
                      <span>Show Full Key</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-xs text-neutral-800">
              <span className="truncate pr-2 font-medium select-all" title={effectiveKey}>
                Authorization: Bearer {userApiKey ? (keyRevealed ? userApiKey : `${userApiKey.slice(0, 10)}••••••••••••`) : 'YOUR_API_KEY'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {userApiKey && (
                  <button
                    type="button"
                    onClick={() => copyText(userApiKey, 'rawkey')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    title="Copy API key token only"
                  >
                    {copiedKey === 'rawkey' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Key Copied</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => copyText(`Authorization: Bearer ${effectiveKey}`, 'auth')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
                  title="Copy Full Authorization Header"
                >
                  {copiedKey === 'auth' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Header Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Header</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Rate Limit */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-600">Rate Limit</span>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 font-medium flex items-center justify-between">
              <span>{storage.rate_limit || 100} requests / {storage.rate_window || 60} seconds</span>
              <span className="text-[11px] text-neutral-400">Bearer Token Quota</span>
            </div>
          </div>

          {/* API Status */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-600">API Status</span>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    storage.enabled ? 'bg-emerald-500 animate-status-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="font-bold text-neutral-900">
                  {storage.enabled ? '🟢 Active' : '🔴 Revoked / Disabled'}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                /{storage.folder_path || 'root'}
              </span>
            </div>
          </div>
        </div>

        {/* API Key Input & Status Section */}
        <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-neutral-600" />
              <span>Storage API Key (Bearer Token)</span>
            </label>
            {userApiKey ? (
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Active in code samples & tester
              </span>
            ) : (
              <span className="text-[11px] text-amber-700 font-medium">
                Not entered yet (showing placeholder)
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type={keyRevealed ? 'text' : 'password'}
                placeholder="Paste your secret API key here (e.g. ts_live_...)"
                value={userApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="w-full pl-3.5 pr-20 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm font-mono text-neutral-900 placeholder:text-neutral-400 placeholder:font-sans focus:outline-none focus:border-neutral-900 transition-colors shadow-2xs"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setKeyRevealed(!keyRevealed)}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  title={keyRevealed ? 'Mask key' : 'Reveal key'}
                >
                  {keyRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {userApiKey && (
                  <button
                    type="button"
                    onClick={() => copyText(userApiKey, 'apikey')}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    title="Copy API Key"
                  >
                    {copiedKey === 'apikey' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {userApiKey && (
              <button
                type="button"
                onClick={() => handleApiKeyChange('')}
                className="px-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-800 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-[11px] text-neutral-500 leading-relaxed flex items-start gap-1.5 pt-0.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-neutral-400 mt-0.5" />
            <span>
              Secret API keys are generated once during space creation. Paste your key here to auto-fill code snippets and enable 1-click live testing. If you lost your key, create a new space or manage access under the <strong>Settings</strong> tab.
            </span>
          </p>
        </div>

        {/* Rate Limit & Quota */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between">
            <span className="font-semibold text-neutral-600">Rate Limit Quota</span>
            <span className="font-bold text-neutral-900">{storage.rate_limit || 100} requests / {storage.rate_window || 60}s</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between">
            <span className="font-semibold text-neutral-600">Storage Location</span>
            <span className="font-mono text-neutral-800">/{storage.folder_path || 'root'}</span>
          </div>
        </div>

        {/* Quick cURL example */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-neutral-600 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-neutral-500" />
              <span>Quick cURL Command</span>
            </span>
            <button
              type="button"
              onClick={() => copyText(curlExample, 'curl')}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'curl' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy cURL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-neutral-950 text-neutral-100 rounded-xl font-mono text-xs overflow-x-auto select-all">
            {curlExample}
          </pre>
        </div>
      </div>

      {/* Security Warning Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-amber-950">Security Notice: Keep API Keys Protected</p>
          <p className="text-xs text-amber-800/90 mt-0.5">
            <strong>Never expose your TechStorage API key in client-side code or public repositories.</strong> Your API key grants direct access to physical storage on the Raspberry Pi. Always proxy calls through your backend server or environment variables.
          </p>
        </div>
      </div>

      {/* Live Interactive API Tester Console */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>Interactive API Playground</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Send live HTTP requests to test this Storage Space right from your browser.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Endpoint selector */}
          <select
            value={testEndpoint}
            onChange={(e) => setTestEndpoint(e.target.value as any)}
            className="px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm font-semibold text-neutral-800 cursor-pointer focus:outline-none focus:border-neutral-900"
          >
            <option value="list_files">GET /files (List Files)</option>
            <option value="info">GET / (Storage Status & Info)</option>
            <option value="create_folder">POST /folders (Create Folder)</option>
          </select>

          {/* Subpath input */}
          <input
            type="text"
            placeholder={
              testEndpoint === 'create_folder'
                ? 'Folder name (e.g. MyTestFolder)'
                : 'Subpath query (optional, e.g. images)'
            }
            value={testSubpath}
            onChange={(e) => setTestSubpath(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={executeApiTest}
            disabled={testLoading}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-98 shrink-0"
          >
            {testLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Request</span>
              </>
            )}
          </button>
        </div>

        {/* Live Response Output Display */}
        {testResponseData !== null && (
          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-700">Response Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                    testResponseStatus === 200
                      ? 'bg-emerald-100 text-emerald-800'
                      : testResponseStatus === 401
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  HTTP {testResponseStatus}
                </span>
                {testLatency !== null && (
                  <span className="text-neutral-400 font-mono text-[11px]">({testLatency}ms)</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => copyText(testResponseData || '', 'resp')}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'resp' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-neutral-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 bg-neutral-950 text-neutral-100 rounded-xl font-mono text-xs overflow-x-auto select-all max-h-72">
              {testResponseData}
            </pre>
          </div>
        )}
      </div>

      {/* Code Examples Section */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {/* Language Tabs */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200/80">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveLang('js')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeLang === 'js'
                  ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              JavaScript (Fetch)
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeLang === 'python'
                  ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Python (Requests)
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('node')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeLang === 'node'
                  ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Node.js / React (Server)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const code =
                activeLang === 'js' ? jsCode : activeLang === 'python' ? pythonCode : nodeCode;
              copyText(code, 'code');
            }}
            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedKey === 'code' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied Snippet</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        {/* Code View */}
        <pre className="p-5 bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto leading-relaxed">
          {activeLang === 'js' ? jsCode : activeLang === 'python' ? pythonCode : nodeCode}
        </pre>
      </div>

      {/* Endpoints Reference Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-neutral-900">API Endpoints Reference</h3>

        <div className="border border-neutral-200/80 rounded-xl overflow-hidden divide-y divide-neutral-100 text-xs">
          {/* GET / */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                GET
              </span>
              <span className="font-mono text-neutral-800">/api/storage/{storage.storage_id}</span>
            </div>
            <span className="text-neutral-500">Get Storage Space configuration & physical online status</span>
          </div>

          {/* GET /files */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                GET
              </span>
              <span className="font-mono text-neutral-800">/api/storage/{storage.storage_id}/files?path=</span>
            </div>
            <span className="text-neutral-500">List files and folders in a directory</span>
          </div>

          {/* GET /files/{file_path} */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                GET
              </span>
              <span className="font-mono text-neutral-800">/api/storage/{storage.storage_id}/files/&#123;file_path&#125;</span>
            </div>
            <span className="text-neutral-500">Read / stream / download a file directly from storage</span>
          </div>

          {/* POST /files */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-[11px]">
                POST
              </span>
              <span className="font-mono text-neutral-800">/api/storage/{storage.storage_id}/files?path=</span>
            </div>
            <span className="text-neutral-500">Upload a new file (multipart/form-data with `file` field)</span>
          </div>

          {/* POST /folders */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-[11px]">
                POST
              </span>
              <span className="font-mono text-neutral-800">/api/storage/{storage.storage_id}/folders?path=</span>
            </div>
            <span className="text-neutral-500">Create a new folder directory on the physical drive</span>
          </div>

          {/* DELETE /files/{file_path} */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono font-bold text-[11px]">
                DELETE
              </span>
              <span className="font-mono text-neutral-800">/api/storage/{storage.storage_id}/files/&#123;file_path&#125;</span>
            </div>
            <span className="text-neutral-500">Delete a file (requires Delete permission to be enabled)</span>
          </div>
        </div>
      </div>

      {/* HTTP Error Codes Cheat Sheet */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-neutral-900">HTTP Response & Error Codes</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="font-mono font-bold text-neutral-900">401 INVALID_API_KEY</span>
            <p className="text-neutral-500 mt-1">Bearer API key is missing, malformed, or inactive.</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="font-mono font-bold text-neutral-900">403 PERMISSION_DENIED</span>
            <p className="text-neutral-500 mt-1">The requested action (e.g. Delete) is not permitted on this space.</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="font-mono font-bold text-neutral-900">404 STORAGE_NOT_FOUND</span>
            <p className="text-neutral-500 mt-1">The storage_id or file_path requested does not exist.</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="font-mono font-bold text-neutral-900">409 FILE_EXISTS</span>
            <p className="text-neutral-500 mt-1">A file or folder already exists at the requested path.</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
            <span className="font-mono font-bold text-neutral-900">429 RATE_LIMITED</span>
            <p className="text-neutral-500 mt-1">The request exceeded the configured rate limit quota.</p>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70">
            <span className="font-mono font-bold text-rose-900">503 STORAGE_OFFLINE</span>
            <p className="text-rose-700 mt-1">The physical USB storage drive is disconnected from Raspberry Pi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
