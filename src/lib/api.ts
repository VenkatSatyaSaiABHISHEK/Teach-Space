import {
  Drive,
  StorageItem,
  StorageSummary,
  Workspace,
  ShowcaseResponse,
  ShowcaseContentResponse,
  ShowcaseFilesResponse,
  TechStorageItem,
  TechStoragePermissions,
  CreateTechStorageParams,
  CreateTechStorageResponse,
  UpdateTechStorageParams,
} from '@/types';

// Default to Cloudflare Tunnel production URL or configured env var
export const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cloud.vssa.site';
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Normalizes input URL (e.g. upgrades http://cloud.vssa.site to https://)
 */
export function normalizeApiUrl(rawUrl: string): string {
  let url = rawUrl.trim().replace(/\/+$/, '');
  if (!url) return DEFAULT_API_URL;

  // If user entered cloud.vssa.site without protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Cloudflare Tunnels only accept HTTPS (port 80 yields 502)
  if (url.startsWith('http://') && (url.includes('vssa.site') || (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.match(/^http:\/\/\d+\.\d+\.\d+\.\d+/)))) {
    url = url.replace(/^http:\/\//, 'https://');
  }

  return url;
}

// Allow dynamic client-side endpoint switching in Settings
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = window.localStorage.getItem('vssa_api_endpoint');
    if (custom && custom.trim()) {
      return normalizeApiUrl(custom);
    }
  }
  return normalizeApiUrl(DEFAULT_API_URL);
}

export function setApiBaseUrl(url: string | null): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      window.localStorage.setItem('vssa_api_endpoint', normalizeApiUrl(url));
    } else {
      window.localStorage.removeItem('vssa_api_endpoint');
    }
  }
}

/**
 * Public API Base URL dedicated for external TechStorage API callers.
 * Configured via NEXT_PUBLIC_TECHSTORAGE_API_URL.
 * Supports development (e.g. http://127.0.0.1:8000) and production (e.g. https://cloud.vssa.site).
 * Falls back to getApiBaseUrl() (or NEXT_PUBLIC_API_URL / DEFAULT_API_URL) for backward compatibility.
 */
export function getTechStoragePublicApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_TECHSTORAGE_API_URL;
  if (envUrl && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '').replace(/\/api\/storage$/, '');
    return normalizeApiUrl(clean);
  }
  return getApiBaseUrl();
}

/**
 * Constructs the public API endpoint for a given TechStorage space:
 * e.g. ${NEXT_PUBLIC_TECHSTORAGE_API_URL}/api/storage/${storageId}
 */
export function getTechStorageSpaceApiUrl(storageId: string): string {
  const base = getTechStoragePublicApiUrl();
  return `${base}/api/storage/${storageId}`;
}

const PROTECTED_PATHS_KEY = 'vssa_protected_paths';

export function getProtectedPaths(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(PROTECTED_PATHS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function saveProtectedPath(path: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = path.trim().replace(/^\/+/, '');
    const set = getProtectedPaths();
    set.add(clean);
    window.localStorage.setItem(PROTECTED_PATHS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function removeProtectedPath(path: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = path.trim().replace(/^\/+/, '');
    const set = getProtectedPaths();
    set.delete(clean);
    window.localStorage.setItem(PROTECTED_PATHS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

// Client-side in-memory + sessionStorage cache (Stale-While-Revalidate)
const memoryCache: Record<string, { data: unknown; timestamp: number }> = {};

export function getClientCache<T>(key: string, maxAgeMs = 300000): T | null {
  const mem = memoryCache[key];
  if (mem && Date.now() - mem.timestamp < maxAgeMs) {
    return mem.data as T;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(`techspace_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Date.now() - parsed.timestamp < maxAgeMs) {
          memoryCache[key] = parsed;
          return parsed.data as T;
        }
      }
    } catch {
      // ignore
    }
  }

  return mem ? (mem.data as T) : null;
}

export function setClientCache<T>(key: string, data: T): void {
  const entry = { data, timestamp: Date.now() };
  memoryCache[key] = entry;

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(`techspace_cache_${key}`, JSON.stringify(entry));
    } catch {
      // ignore
    }
  }
}

export function invalidateClientCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.startsWith('techspace_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
    return;
  }

  Object.keys(memoryCache).forEach((k) => {
    if (k.startsWith(keyPrefix)) delete memoryCache[k];
  });

  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(`techspace_cache_${keyPrefix}`)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch {
      // ignore
    }
  }
}

let activeDriveUuidCache: string | undefined = undefined;

export function setActiveDriveUuid(uuid?: string | null): void {
  activeDriveUuidCache = uuid || undefined;
}

export function getActiveDriveUuid(): string | undefined {
  return activeDriveUuidCache;
}

async function resolveDriveUuid(explicitUuid?: string): Promise<string | undefined> {
  if (explicitUuid) {
    activeDriveUuidCache = explicitUuid;
    return explicitUuid;
  }
  if (activeDriveUuidCache) {
    return activeDriveUuidCache;
  }
  const cachedDrives = getClientCache<Drive[]>('drives');
  if (cachedDrives && cachedDrives.length > 0) {
    const online = cachedDrives.find((d) => (d.status || '').toLowerCase() === 'online') || cachedDrives[0];
    if (online?.uuid) {
      activeDriveUuidCache = online.uuid;
      return online.uuid;
    }
  }
  try {
    const drives = await api.getDrives();
    const online = drives.find((d) => (d.status || '').toLowerCase() === 'online') || drives[0];
    if (online?.uuid) {
      activeDriveUuidCache = online.uuid;
      return online.uuid;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Helper to build proxy URL to bypass browser CORS policies cleanly
 */
function buildEndpointUrl(endpoint: string, queryParams = ''): string {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const query = queryParams ? (queryParams.startsWith('?') ? queryParams : `?${queryParams}`) : '';

  // In browser, use the same-origin Next.js proxy route to guarantee zero CORS blockage
  if (typeof window !== 'undefined') {
    return `/api/backend/${cleanEndpoint}${query}`;
  }

  // On server, call the target directly
  const base = getApiBaseUrl();
  return `${base}/${cleanEndpoint}${query}`;
}

function getRequestHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
  return {
    Accept: 'application/json',
    'x-vssa-target-url': getApiBaseUrl(),
    ...additionalHeaders,
  };
}

export interface ResilientFetchConfig {
  maxRetries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

/**
 * Resilient fetch wrapper that handles transient socket drops, Cloudflare tunnel
 * micro-disconnects, and Raspberry Pi drive wake-up 502/504 delays with exponential backoff.
 */
export async function resilientFetch(
  url: string,
  options: RequestInit = {},
  config: ResilientFetchConfig = {}
): Promise<Response> {
  const { maxRetries = 2, backoffMs = 600, timeoutMs = 35000 } = config;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Chain caller's abort signal if present
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw new DOMException('Aborted', 'AbortError');
      }
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // On 502/504/530 (drive waking up, gateway timeout, or tunnel reconnecting), wait and retry automatically
      if ((res.status === 502 || res.status === 504 || res.status === 530) && attempt <= maxRetries) {
        console.warn(
          `[Client API] ${url} returned HTTP ${res.status} (attempt ${attempt}/${maxRetries + 1}). Auto-retrying in ${attempt * backoffMs}ms...`
        );
        await new Promise((r) => setTimeout(r, attempt * backoffMs));
        continue;
      }

      return res;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;

      // Never retry if explicitly cancelled by user
      if (options.signal?.aborted) {
        throw err;
      }

      console.warn(
        `[Client API] Network attempt ${attempt}/${maxRetries + 1} failed for ${url}:`,
        err
      );
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * backoffMs));
      }
    }
  }

  throw lastError || new Error(`Network connection to ${url} failed after ${maxRetries + 1} attempts`);
}

let keepAliveInterval: NodeJS.Timeout | null = null;

/**
 * Starts a background heartbeat that keeps the Cloudflare Tunnel active and prevents
 * external physical USB hard drives from going into sleep mode while the dashboard is open.
 */
export function startTunnelKeepAlive(intervalMs = 90000): () => void {
  if (typeof window === 'undefined') return () => {};
  if (keepAliveInterval) return () => {};

  const heartbeat = async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      try {
        await api.pingBackend();
      } catch {
        // quiet background keep-alive
      }
    }
  };

  keepAliveInterval = setInterval(heartbeat, intervalMs);

  return () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };
}

/**
 * Format bytes into human readable size string
 */
export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1));
  return `${val} ${sizes[i]}`;
}

/**
 * Clean user-facing error message from FastAPI responses
 */
export function parseApiError(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (!error) return defaultMessage;
  if (typeof error === 'string') {
    if (error.toLowerCase().includes('failed to fetch') || error.toLowerCase().includes('networkerror')) {
      return 'Cannot connect to Raspberry Pi server. Please check the network connection.';
    }
    return error;
  }

  const err = error as { message?: string; status?: number; detail?: string | { msg?: string }[] };

  if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
    return 'Cannot connect to Raspberry Pi server. Please verify your connection.';
  }

  if (err.detail) {
    if (typeof err.detail === 'string') {
      const d = err.detail.toLowerCase();
      if (d.includes('already exists') || d.includes('exists')) {
        return 'A file or folder with this name already exists.';
      }
      if (d.includes('storage space not found') || d.includes('storage not found')) {
        return 'This Storage Space could not be found.';
      }
      if (d.includes('not found')) {
        return 'The requested item could not be found.';
      }
      if (d.includes('password') && (d.includes('incorrect') || d.includes('wrong') || d.includes('invalid'))) {
        return 'Incorrect password. Please try again.';
      }
      if (d.includes('large') || d.includes('size') || d.includes('limit')) {
        return 'File is larger than the 50 MB upload limit.';
      }
      if (d.includes('offline') || d.includes('unavailable')) {
        return 'This storage drive is currently unavailable.';
      }
      return err.detail;
    }
    if (Array.isArray(err.detail) && err.detail.length > 0 && err.detail[0]?.msg) {
      return err.detail[0].msg;
    }
    if (typeof err.detail === 'object' && err.detail !== null && !Array.isArray(err.detail)) {
      const detailObj = err.detail as { error?: string; message?: string };
      if (detailObj.error === 'INVALID_API_KEY') return detailObj.message || 'Invalid or missing API key.';
      if (detailObj.error === 'PERMISSION_DENIED') return detailObj.message || 'Permission denied for this operation.';
      if (detailObj.error === 'STORAGE_OFFLINE') return 'The physical storage drive is currently disconnected.';
      if (detailObj.error === 'RATE_LIMITED') return 'Rate limit exceeded. Please wait before making more requests.';
      if (detailObj.message) return detailObj.message;
    }
  }

  if (err.status === 401) return 'Invalid or missing API key.';
  if (err.status === 403) return 'Permission denied for this action.';
  if (err.status === 404) return 'The requested resource, storage space, or file was not found.';
  if (err.status === 409) return 'A resource, file, or folder with this name already exists.';
  if (err.status === 413) return 'File is larger than the 50 MB upload limit.';
  if (err.status === 429) return 'Rate limit exceeded. Please wait before retrying.';
  if (err.status === 503) return 'The physical storage drive is currently disconnected.';
  if (err.status === 502 || err.status === 504) {
    return 'The storage server is busy or waking up (HTTP 502). Please retry in a few moments.';
  }
  if (err.status === 530) {
    return 'Raspberry Pi Cloudflare Tunnel is reconnecting (Error 1033). Please verify the device is powered on.';
  }

  return err.message || defaultMessage;
}

/**
 * Central API Client for TechSpace Cloud FastAPI Backend
 */
export const api = {
  setActiveDriveUuid,
  getActiveDriveUuid,

  /**
   * Fast SWR cache helpers for instant tab navigation with zero waiting time
   */
  getCachedDrives(): Drive[] | null {
    return getClientCache<Drive[]>('drives', 300000);
  },

  setCachedDrives(drives: Drive[]): void {
    setClientCache('drives', drives);
  },

  getCachedWorkspaces(): Workspace[] | null {
    return getClientCache<Workspace[]>('workspaces', 300000);
  },

  setCachedWorkspaces(workspaces: Workspace[]): void {
    setClientCache('workspaces', workspaces);
  },

  getCachedTechStorages(): TechStorageItem[] | null {
    return getClientCache<TechStorageItem[]>('techstorages', 300000);
  },

  setCachedTechStorages(storages: TechStorageItem[]): void {
    setClientCache('techstorages', storages);
  },

  getCachedFiles(driveUuid: string, path = ''): StorageItem[] | null {
    const clean = path.trim().replace(/^\/+/, '');
    return getClientCache<StorageItem[]>(`files_${driveUuid}_${clean}`, 180000);
  },

  setCachedFiles(driveUuid: string, path: string, items: StorageItem[]): void {
    const clean = path.trim().replace(/^\/+/, '');
    setClientCache(`files_${driveUuid}_${clean}`, items);
  },

  invalidateCache(keyPrefix?: string): void {
    invalidateClientCache(keyPrefix);
  },

  /**
   * Check connection status & health of the Raspberry Pi
   */
  async pingBackend(customUrl?: string): Promise<{ online: boolean; latencyMs?: number; message?: string }> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const target = customUrl ? normalizeApiUrl(customUrl) : getApiBaseUrl();
      const url = buildEndpointUrl('drives');

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'x-vssa-target-url': target,
        },
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { online: true, latencyMs };
      }
      return { online: false, message: `Server returned HTTP ${res.status}` };
    } catch {
      return { online: false, message: 'Server unreachable' };
    }
  },

  /**
   * GET /drives
   * Retrieves all attached storage drives
   */
  async getDrives(): Promise<Drive[]> {
    try {
      const url = buildEndpointUrl('drives');
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to load storage drives (${res.status})`));
      }

      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : (raw.drives || raw.data || []);

      const mapped = list.map((item: Partial<Drive> & Record<string, unknown>, idx: number) => {
        // Total usable storage
        let totalBytes = typeof item.total_bytes === 'number' ? item.total_bytes : undefined;
        let capacityBytes = typeof item.capacity_bytes === 'number' ? item.capacity_bytes : totalBytes;

        if (!capacityBytes && item.size) {
          const s = String(item.size).toUpperCase().trim();
          if (s.includes('G')) {
            capacityBytes = parseFloat(s) * 1024 * 1024 * 1024;
          } else if (s.includes('T')) {
            capacityBytes = parseFloat(s) * 1024 * 1024 * 1024 * 1024;
          } else if (s.includes('M')) {
            capacityBytes = parseFloat(s) * 1024 * 1024;
          }
        }

        if (!totalBytes && capacityBytes) {
          totalBytes = capacityBytes;
        }

        const freeBytes = typeof item.free_bytes === 'number'
          ? item.free_bytes
          : (typeof item.free === 'number' ? item.free : undefined);

        let usedBytes = typeof item.used_bytes === 'number'
          ? item.used_bytes
          : (typeof item.used === 'number' ? item.used : undefined);

        if (usedBytes === undefined && totalBytes !== undefined && freeBytes !== undefined) {
          usedBytes = Math.max(0, totalBytes - freeBytes);
        }

        const capacityFormatted = item.capacity
          ? String(item.capacity)
          : (totalBytes ? formatBytes(totalBytes) : (item.size ? String(item.size) : '0 B'));

        const freeFormatted = freeBytes !== undefined ? formatBytes(freeBytes) : undefined;
        const usedFormatted = usedBytes !== undefined ? formatBytes(usedBytes) : undefined;

        const isUsageKnown = freeBytes !== undefined || (typeof item.used_bytes === 'number' || typeof item.used === 'number');

        // Extract status and mount_mode accurately from physical backend
        const rawStatus = item.status ? String(item.status).toLowerCase().trim() : 'online';
        let status: 'online' | 'offline' | 'online_readonly' = 'online';
        if (rawStatus === 'offline') {
          status = 'offline';
        } else if (rawStatus === 'online_readonly' || rawStatus.includes('read') || rawStatus === 'ro') {
          status = 'online_readonly';
        } else {
          status = 'online';
        }

        const mountMode = item.mount_mode
          ? String(item.mount_mode).toLowerCase().trim()
          : (status === 'online_readonly' ? 'ro' : 'rw');

        const usagePercent = typeof item.usage_percent === 'number'
          ? item.usage_percent
          : (totalBytes && usedBytes !== undefined && totalBytes > 0
            ? parseFloat(((usedBytes / totalBytes) * 100).toFixed(1))
            : undefined);

        return {
          id: item.id || (item.uuid ? String(item.uuid) : `drive-${idx}`),
          name: item.name ? String(item.name) : `Drive ${String(idx + 1).padStart(2, '0')}`,
          label: item.label ? String(item.label) : null,
          filesystem: (item.filesystem ? String(item.filesystem) : 'NTFS').toUpperCase(),
          size: item.size ? String(item.size) : undefined,
          status,
          mount_mode: mountMode,
          usage_percent: usagePercent,
          total_bytes: totalBytes,
          free_bytes: freeBytes,
          used_bytes: usedBytes,
          capacity_bytes: capacityBytes,
          capacity: capacityFormatted,
          free: freeFormatted,
          used: usedFormatted,
          uuid: item.uuid ? String(item.uuid) : undefined,
          path: item.path ? String(item.path) : undefined,
          mountpoint: (item.mountpoint ?? item.mount_point) as string | null,
          mount_point: (item.mountpoint ?? item.mount_point) as string | null,
          is_system: item.is_system as boolean | undefined,
          is_usage_known: isUsageKnown,
        };
      });

      const onlineDrive = mapped.find((d: Drive) => {
        const s = (d.status || '').toLowerCase();
        return s === 'online' || s === 'online_readonly';
      }) || mapped[0];
      if (onlineDrive?.uuid && !activeDriveUuidCache) {
        activeDriveUuidCache = String(onlineDrive.uuid);
      }

      api.setCachedDrives(mapped);
      return mapped;
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to fetch storage drives'));
    }
  },

  /**
   * GET /drives/{drive_uuid}/files?path= or GET /files?path=
   * Lists files and folders inside a given path on the selected drive
   */
  async getFiles(path = '', driveUuid?: string): Promise<StorageItem[]> {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const targetUuid = await resolveDriveUuid(driveUuid);
    if (!targetUuid) {
      return [];
    }

    const searchParams = new URLSearchParams();
    searchParams.set('path', cleanPath);

    const endpoint = `drives/${encodeURIComponent(targetUuid)}/files`;
    const url = buildEndpointUrl(endpoint, searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to load files (${res.status})`));
      }

      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : (raw.files || raw.items || []);
      const protectedSet = getProtectedPaths();

      const mappedFiles: StorageItem[] = list.map((item: Partial<StorageItem> & { type?: string; is_dir?: boolean }) => {
        const isDir = Boolean(
          item.type === 'folder' ||
          item.type === 'dir' ||
          item.is_dir === true ||
          (!item.type && item.item_count !== undefined)
        );
        const name = item.name || '';
        const itemFullPath = cleanPath ? `${cleanPath}/${name}` : name;
        const ext = !isDir && name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined;

        const isMarkedProtected = protectedSet.has(itemFullPath);

        // Identify NTFS / system items (e.g. $RECYCLE.BIN, System Volume Information)
        const isSystem = Boolean(
          name.startsWith('$') ||
          name === 'System Volume Information' ||
          name.toLowerCase() === 'lost+found'
        );

        let accessStatus: 'public' | 'protected' | 'private' = 'private';
        if (item.access_status) {
          accessStatus = item.access_status;
        } else if (item.is_public) {
          accessStatus = 'public';
        } else if (item.is_protected || isMarkedProtected) {
          accessStatus = 'protected';
        }

        return {
          name,
          path: itemFullPath,
          is_dir: isDir,
          size: typeof item.size === 'number' ? item.size : undefined,
          size_formatted: formatBytes(item.size),
          modified: item.modified,
          item_count: item.item_count,
          access_status: accessStatus,
          is_public: accessStatus === 'public',
          is_protected: accessStatus === 'protected' || isMarkedProtected,
          mime_type: item.mime_type,
          extension: ext,
          is_system: isSystem,
        };
      });

      if (targetUuid) {
        api.setCachedFiles(targetUuid, cleanPath, mappedFiles);
      }
      return mappedFiles;
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to fetch files'));
    }
  },

  /**
   * POST /folders?drive_uuid=&path=
   * Creates a new folder at specified path on selected drive
   */
  async createFolder(path: string, driveUuid?: string): Promise<void> {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const targetUuid = await resolveDriveUuid(driveUuid);
    if (!targetUuid) {
      throw new Error('No storage drive connected. Please connect a USB storage drive.');
    }

    const searchParams = new URLSearchParams();
    searchParams.set('drive_uuid', targetUuid);
    searchParams.set('path', cleanPath);
    const url = buildEndpointUrl('folders', searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, 'Failed to create folder'));
      }

      api.invalidateCache('files_');
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to create folder'));
    }
  },

  /**
   * POST /folders/public?path=
   * Sets folder access to Public
   */
  async setFolderPublic(path: string): Promise<void> {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const searchParams = new URLSearchParams();
    searchParams.set('path', cleanPath);
    const url = buildEndpointUrl('folders/public', searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, 'Failed to make folder public'));
      }

      removeProtectedPath(cleanPath);
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to make folder public'));
    }
  },

  /**
   * POST /folders/protected?path=&password=
   * Sets folder or file access to Password Protected
   */
  async setFolderProtected(path: string, password: string): Promise<void> {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const searchParams = new URLSearchParams();
    searchParams.set('path', cleanPath);
    searchParams.set('password', password);
    const url = buildEndpointUrl('folders/protected', searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, 'Failed to protect folder'));
      }

      saveProtectedPath(cleanPath);
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to protect folder'));
    }
  },

  /**
   * Creates a new file with text content and optional password protection
   */
  async createFile(
    name: string,
    content: string,
    path = '',
    password?: string,
    driveUuid?: string
  ): Promise<void> {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const cleanName = name.trim();
    const fullPath = cleanPath ? `${cleanPath}/${cleanName}` : cleanName;

    const file = new File([content], cleanName, { type: 'text/plain;charset=utf-8' });
    await this.uploadFile(file, cleanPath, undefined, driveUuid);

    if (password && password.trim()) {
      await this.setFolderProtected(fullPath, password.trim());
      saveProtectedPath(fullPath);
    }
  },

  /**
   * POST /folders/check-password?path=&password=
   * Verifies password for a protected folder
   */
  async checkFolderPassword(path: string, password: string): Promise<boolean> {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const searchParams = new URLSearchParams();
    searchParams.set('path', cleanPath);
    searchParams.set('password', password);
    const url = buildEndpointUrl('folders/check-password', searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({ success: true }));
        if (typeof json.success === 'boolean') return json.success;
        if (typeof json.valid === 'boolean') return json.valid;
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        return false;
      }

      const errJson = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errJson, 'Incorrect password. Please try again.'));
    } catch (err) {
      throw new Error(parseApiError(err, 'Incorrect password. Please try again.'));
    }
  },

  /**
   * POST /upload?drive_uuid=&path=
   * Uploads file with 50 MB limit guard, connection resilience, and real-time progress
   */
  uploadFile(
    file: File,
    folderPath = '',
    onProgress?: (percent: number) => void,
    driveUuid?: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (file.size > MAX_UPLOAD_BYTES) {
        reject(new Error('File is larger than the 50 MB upload limit.'));
        return;
      }

      const targetUuid = await resolveDriveUuid(driveUuid);
      if (!targetUuid) {
        reject(new Error('No storage drive connected. Please connect a USB storage drive.'));
        return;
      }

      const cleanPath = folderPath.trim().replace(/^\/+/, '');
      const fullFilePath = cleanPath ? `${cleanPath}/${file.name}` : file.name;

      const searchParams = new URLSearchParams();
      searchParams.set('drive_uuid', targetUuid);
      searchParams.set('path', fullFilePath);

      const uploadUrl = buildEndpointUrl('upload', searchParams.toString());

      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.timeout = 180000; // 3-minute timeout for large files
      xhr.setRequestHeader('x-vssa-target-url', getApiBaseUrl());

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          api.invalidateCache('files_');
          onProgress?.(100);
          resolve();
        } else {
          let msg = `Upload failed with status ${xhr.status}`;
          try {
            const parsed = JSON.parse(xhr.responseText);
            msg = parseApiError(parsed, msg);
          } catch {
            if (xhr.status === 413) {
              msg = 'File is larger than the 50 MB upload limit.';
            } else if (xhr.status === 409) {
              msg = 'A file with this name already exists.';
            } else if (xhr.status === 502 || xhr.status === 504) {
              msg = 'Upload interrupted: storage drive is waking up. Please try again.';
            }
          }
          reject(new Error(msg));
        }
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload timed out after 3 minutes. The connection may have stalled.'));
      };

      xhr.onerror = () => {
        reject(new Error('Network connection was interrupted during upload. Please try again.'));
      };

      xhr.send(formData);
    });
  },

  /**
   * GET /download/{drive_uuid}?path=
   * Returns direct download URL
   */
  getDownloadUrl(path: string, driveUuid?: string): string {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const targetUuid = driveUuid || activeDriveUuidCache;
    const searchParams = new URLSearchParams();
    searchParams.set('path', cleanPath);

    const endpoint = targetUuid
      ? `download/${encodeURIComponent(targetUuid)}`
      : 'download';

    return buildEndpointUrl(endpoint, searchParams.toString());
  },

  /**
   * Triggers browser download of file
   */
  async downloadFile(path: string, filename: string, driveUuid?: string): Promise<void> {
    const url = this.getDownloadUrl(path, driveUuid);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * DELETE /items/{drive_uuid}?path=
   * Deletes a file or folder from the drive
   */
  async deleteItem(path: string, driveUuid?: string): Promise<void> {
    const cleanPath = path.trim().replace(/^\/+/, '');
    const targetUuid = await resolveDriveUuid(driveUuid);
    if (!targetUuid) {
      throw new Error('No storage drive connected. Please connect a USB storage drive.');
    }

    const searchParams = new URLSearchParams();
    searchParams.set('path', cleanPath);

    const endpoint = `items/${encodeURIComponent(targetUuid)}`;
    const url = buildEndpointUrl(endpoint, searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'DELETE',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, 'Failed to delete item'));
      }

      removeProtectedPath(cleanPath);
      api.invalidateCache('files_');
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to delete item'));
    }
  },

  /**
   * Helper to calculate aggregate storage summary from drives
   */
  calculateSummary(drives: Drive[]): StorageSummary {
    let totalBytes = 0;
    let usedBytes = 0;
    let freeBytes = 0;

    // Online and online_readonly drives contribute to active storage pool
    const onlineDrives = drives.filter((d) => {
      const s = (d.status || 'online').toLowerCase();
      return s === 'online' || s === 'online_readonly';
    });
    const isUsageKnown = onlineDrives.length > 0 && onlineDrives.some((d) => d.is_usage_known === true || d.free_bytes !== undefined);

    onlineDrives.forEach((d) => {
      const driveTotal = d.total_bytes ?? d.capacity_bytes ?? 0;
      const driveFree = d.free_bytes !== undefined ? d.free_bytes : (d.used_bytes !== undefined ? Math.max(0, driveTotal - d.used_bytes) : driveTotal);
      const driveUsed = d.used_bytes !== undefined ? d.used_bytes : Math.max(0, driveTotal - driveFree);

      totalBytes += driveTotal;
      freeBytes += driveFree;
      usedBytes += driveUsed;
    });

    if (totalBytes === 0 && drives.length > 0) {
      drives.forEach((d) => {
        const driveTotal = d.total_bytes ?? d.capacity_bytes ?? 0;
        totalBytes += driveTotal;
      });
      freeBytes = totalBytes;
      usedBytes = 0;
    }

    if (freeBytes === 0 && totalBytes > usedBytes) {
      freeBytes = totalBytes - usedBytes;
    }

    const usedPercentage = totalBytes > 0 && usedBytes > 0 && isUsageKnown
      ? Math.min(100, Math.round((usedBytes / totalBytes) * 100))
      : 0;

    return {
      total_bytes: totalBytes,
      used_bytes: usedBytes,
      free_bytes: freeBytes,
      total_formatted: formatBytes(totalBytes),
      used_formatted: isUsageKnown ? formatBytes(usedBytes) : '--',
      free_formatted: isUsageKnown ? formatBytes(freeBytes) : formatBytes(totalBytes),
      used_percentage: usedPercentage,
      is_usage_known: isUsageKnown,
    };
  },

  /**
   * GET /workspaces
   * Returns list of all project workspaces
   */
  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const url = buildEndpointUrl('workspaces');
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to fetch workspaces (${res.status})`));
      }

      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : (raw.workspaces || raw.data || []);
      const existing = api.getCachedWorkspaces();
      const merged = list.map((w: Partial<Workspace> & Record<string, unknown>) => {
        const item: Workspace = {
          id: Number(w.id),
          drive_uuid: String(w.drive_uuid || ''),
          folder_path: String(w.folder_path || ''),
          title: String(w.title || 'Untitled Workspace'),
          description: w.description ? String(w.description) : null,
          share_token: String(w.share_token || ''),
          access_type: String(w.access_type || 'public'),
          password_hash: w.password_hash ? String(w.password_hash) : null,
          enabled: Boolean(w.enabled ?? true),
          created_at: w.created_at ? String(w.created_at) : undefined,
          drive_status: w.drive_status ? String(w.drive_status) : undefined,
        };
        const found = existing?.find((e) => e.id === item.id);
        if (found?.content_counts) {
          item.content_counts = found.content_counts;
        }
        return item;
      });
      api.setCachedWorkspaces(merged);
      return merged;
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to load project workspaces'));
    }
  },

  /**
   * GET /workspaces/{id}
   * Returns details for a specific workspace
   */
  async getWorkspace(id: number | string): Promise<Workspace> {
    try {
      const url = buildEndpointUrl(`workspaces/${encodeURIComponent(String(id))}`);
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, 'Workspace not found'));
      }

      const raw = await res.json();
      const w = raw.workspace || raw;
      return {
        id: Number(w.id),
        drive_uuid: String(w.drive_uuid || ''),
        folder_path: String(w.folder_path || ''),
        title: String(w.title || 'Untitled Workspace'),
        description: w.description ? String(w.description) : null,
        share_token: String(w.share_token || ''),
        access_type: String(w.access_type || 'public'),
        password_hash: w.password_hash ? String(w.password_hash) : null,
        enabled: Boolean(w.enabled ?? true),
        created_at: w.created_at ? String(w.created_at) : undefined,
      };
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to load workspace details'));
    }
  },

  /**
   * POST /workspaces?drive_uuid=...&folder_path=...&title=...&description=...
   * Creates a new project showcase workspace
   */
  async createWorkspace(params: {
    drive_uuid: string;
    folder_path: string;
    title: string;
    description?: string;
  }): Promise<Workspace & { message?: string }> {
    const searchParams = new URLSearchParams();
    searchParams.set('drive_uuid', params.drive_uuid);
    searchParams.set('folder_path', params.folder_path.trim().replace(/^\/+/, ''));
    searchParams.set('title', params.title.trim());
    if (params.description && params.description.trim()) {
      searchParams.set('description', params.description.trim());
    }

    const url = buildEndpointUrl('workspaces', searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, 'Failed to create workspace'));
      }

      const raw = await res.json();
      api.invalidateCache('workspaces');
      return {
        id: Number(raw.workspace_id || raw.id),
        drive_uuid: String(raw.drive_uuid || params.drive_uuid),
        folder_path: String(raw.folder_path || params.folder_path),
        title: String(raw.title || params.title),
        description: raw.description ? String(raw.description) : params.description || null,
        share_token: String(raw.share_token || ''),
        access_type: String(raw.access_type || 'public'),
        enabled: Boolean(raw.enabled ?? true),
        message: raw.message,
      };
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to create project showcase'));
    }
  },

  /**
   * GET /showcase/{share_token}
   * Returns public showcase workspace metadata
   */
  async getShowcase(shareToken: string): Promise<ShowcaseResponse> {
    try {
      const url = buildEndpointUrl(`showcase/${encodeURIComponent(shareToken)}`);
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Showcase not found (${res.status})`));
      }

      return await res.json();
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to load showcase'));
    }
  },

  /**
   * GET /showcase/{share_token}/content
   * Returns categorized content ({ presentation, documentation, videos, images, other_files, folders })
   */
  async getShowcaseContent(shareToken: string): Promise<ShowcaseContentResponse> {
    try {
      const url = buildEndpointUrl(`showcase/${encodeURIComponent(shareToken)}/content`);
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to load showcase content (${res.status})`));
      }

      return await res.json();
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to load showcase content'));
    }
  },

  /**
   * GET /showcase/{share_token}/files?path=...
   * Lists files in showcase folder
   */
  async getShowcaseFiles(shareToken: string, path = ''): Promise<ShowcaseFilesResponse> {
    const searchParams = new URLSearchParams();
    if (path) {
      searchParams.set('path', path.trim().replace(/^\/+/, ''));
    }
    const url = buildEndpointUrl(
      `showcase/${encodeURIComponent(shareToken)}/files`,
      searchParams.toString()
    );

    try {
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to load showcase files (${res.status})`));
      }

      return await res.json();
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to load showcase files'));
    }
  },

  /**
   * Returns URL to converted presentation PDF preview
   */
  getShowcasePresentationUrl(shareToken: string): string {
    return buildEndpointUrl(`showcase/${encodeURIComponent(shareToken)}/presentation`);
  },

  /**
   * Returns URL to stream or download a file from physical drive
   */
  getShowcaseFileUrl(driveUuid: string, fullPath: string): string {
    const searchParams = new URLSearchParams();
    searchParams.set('path', fullPath.trim().replace(/^\/+/, ''));
    return buildEndpointUrl(`download/${encodeURIComponent(driveUuid)}`, searchParams.toString());
  },

  /**
   * GET /techstorage
   * Retrieves list of all registered TechStorage spaces
   */
  async getTechStorages(): Promise<TechStorageItem[]> {
    try {
      const url = buildEndpointUrl('techstorage');
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to load TechStorage spaces (${res.status})`));
      }

      const raw = await res.json();
      const list: TechStorageItem[] = Array.isArray(raw) ? raw : (raw.storages || []);
      api.setCachedTechStorages(list);
      return list;
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to fetch TechStorage spaces'));
    }
  },

  /**
   * GET /techstorage/{storage_id}
   * Retrieves specific TechStorage space details
   */
  async getTechStorage(storageId: string): Promise<TechStorageItem> {
    try {
      const url = buildEndpointUrl(`techstorage/${encodeURIComponent(storageId)}`);
      const res = await resilientFetch(url, {
        method: 'GET',
        headers: getRequestHeaders(),
      });

      if (res.ok) {
        return await res.json();
      }

      // If single item endpoint returns 404 (such as revoked / disabled spaces), check storages list
      if (res.status === 404) {
        const allStorages = await api.getTechStorages().catch(() => []);
        const found = allStorages.find((s) => s.storage_id === storageId);
        if (found) {
          return found;
        }
      }

      const errJson = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errJson, `Storage Space not found (${res.status})`));
    } catch (err) {
      // Check cached list fallback on network or 404 error
      const cached = api.getCachedTechStorages();
      const found = cached?.find((s) => s.storage_id === storageId);
      if (found) return found;

      throw new Error(parseApiError(err, 'Storage Space not found'));
    }
  },

  /**
   * POST /techstorage
   * Creates a new TechStorage space and returns single-use API key
   */
  async createTechStorage(params: CreateTechStorageParams): Promise<CreateTechStorageResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('name', params.name.trim());
    searchParams.set('drive_uuid', params.drive_uuid);
    if (params.folder_path !== undefined) {
      searchParams.set('folder_path', params.folder_path.trim().replace(/^\/+/, ''));
    }
    if (params.read_enabled !== undefined) searchParams.set('read_enabled', String(params.read_enabled));
    if (params.upload_enabled !== undefined) searchParams.set('upload_enabled', String(params.upload_enabled));
    if (params.create_folder_enabled !== undefined) searchParams.set('create_folder_enabled', String(params.create_folder_enabled));
    if (params.delete_enabled !== undefined) searchParams.set('delete_enabled', String(params.delete_enabled));
    if (params.rate_limit !== undefined) searchParams.set('rate_limit', String(params.rate_limit));
    if (params.rate_window !== undefined) searchParams.set('rate_window', String(params.rate_window));

    const url = buildEndpointUrl('techstorage', searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to create TechStorage space (${res.status})`));
      }

      api.invalidateCache('techstorages');
      return await res.json();
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to create TechStorage space'));
    }
  },

  /**
   * PATCH /techstorage/{storage_id}
   * Updates permissions, name, or rate limits of a TechStorage space
   */
  async updateTechStorage(storageId: string, params: UpdateTechStorageParams): Promise<TechStorageItem> {
    const searchParams = new URLSearchParams();
    if (params.name !== undefined) searchParams.set('name', params.name.trim());
    if (params.read_enabled !== undefined) searchParams.set('read_enabled', String(params.read_enabled));
    if (params.upload_enabled !== undefined) searchParams.set('upload_enabled', String(params.upload_enabled));
    if (params.create_folder_enabled !== undefined) searchParams.set('create_folder_enabled', String(params.create_folder_enabled));
    if (params.delete_enabled !== undefined) searchParams.set('delete_enabled', String(params.delete_enabled));
    if (params.rate_limit !== undefined) searchParams.set('rate_limit', String(params.rate_limit));
    if (params.rate_window !== undefined) searchParams.set('rate_window', String(params.rate_window));

    const url = buildEndpointUrl(`techstorage/${encodeURIComponent(storageId)}`, searchParams.toString());

    try {
      const res = await resilientFetch(url, {
        method: 'PATCH',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to update TechStorage space (${res.status})`));
      }

      api.invalidateCache('techstorages');
      return await res.json();
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to update TechStorage space'));
    }
  },

  /**
   * POST /techstorage/{storage_id}/revoke
   * Revokes / disables a TechStorage space API access
   */
  async revokeTechStorage(storageId: string): Promise<void> {
    const url = buildEndpointUrl(`techstorage/${encodeURIComponent(storageId)}/revoke`);
    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to revoke TechStorage space (${res.status})`));
      }

      api.invalidateCache('techstorages');
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to revoke TechStorage space'));
    }
  },

  /**
   * POST /techstorage/{storage_id}/restore
   * Restores / re-enables a revoked TechStorage space API access
   */
  async restoreTechStorage(storageId: string): Promise<void> {
    const url = buildEndpointUrl(`techstorage/${encodeURIComponent(storageId)}/restore`);
    try {
      const res = await resilientFetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(parseApiError(errJson, `Failed to restore TechStorage space (${res.status})`));
      }

      api.invalidateCache('techstorages');
    } catch (err) {
      throw new Error(parseApiError(err, 'Failed to restore TechStorage space'));
    }
  },
};

/**
 * Categorize files into Presentation, Documentation, Videos, Images, Other Files, and Folders
 */
export function categorizeItems(items: StorageItem[]) {
  const presentation: StorageItem[] = [];
  const documentation: StorageItem[] = [];
  const videos: StorageItem[] = [];
  const images: StorageItem[] = [];
  const other_files: StorageItem[] = [];
  const folders: StorageItem[] = [];

  items.forEach((item) => {
    if (item.is_dir) {
      folders.push(item);
      return;
    }
    const ext = (item.extension || item.name.split('.').pop() || '').toLowerCase();
    if (['pptx', 'ppt', 'odp', 'key'].includes(ext)) {
      presentation.push(item);
    } else if (['pdf', 'docx', 'doc', 'odt', 'txt', 'md', 'rtf'].includes(ext)) {
      documentation.push(item);
    } else if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
      videos.push(item);
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
      images.push(item);
    } else {
      other_files.push(item);
    }
  });

  return { presentation, documentation, videos, images, other_files, folders };
}
