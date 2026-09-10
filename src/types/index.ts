export type AccessStatus = 'public' | 'protected' | 'private';

export interface StorageItem {
  name: string;
  path: string; // Relative to storage root, e.g. "Projects/Website" or "Resume.pdf"
  is_dir: boolean;
  size?: number;
  size_formatted?: string;
  modified?: string | number;
  item_count?: number;
  access_status?: AccessStatus;
  is_public?: boolean;
  is_protected?: boolean;
  mime_type?: string;
  extension?: string;
  is_system?: boolean;
}

export type DriveStatus = 'online' | 'offline' | 'online_readonly' | string;
export type MountMode = 'rw' | 'ro' | string;

export interface Drive {
  id?: string;
  name: string; // partition name, e.g. "sdb2"
  label?: string | null; // drive label if available, e.g. "SSD"
  filesystem?: string; // NTFS/exFAT/ext4/etc.
  size?: string; // human-readable device size, e.g. "119.2G"
  status: DriveStatus;
  mount_mode?: MountMode;
  usage_percent?: number;
  total_bytes?: number; // total usable storage
  free_bytes?: number; // currently free storage
  used_bytes?: number; // calculated used storage
  capacity_bytes?: number;
  capacity?: string;
  used?: string;
  free?: string;
  path?: string; // Linux device path (internal only)
  uuid?: string; // unique physical drive identifier (e.g. "8EC6CDD3C6CDBBA9")
  mountpoint?: string | null; // TechSpace-managed mount location (e.g. "/storage/mounts/8EC6CDD3C6CDBBA9")
  mount_point?: string | null;
  is_system?: boolean;
  is_usage_known?: boolean;
}

export interface StorageSummary {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  total_formatted: string;
  used_formatted: string;
  free_formatted: string;
  used_percentage: number;
  is_usage_known?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'date';
export type SortOrder = 'asc' | 'desc';

export interface ActiveNavTab {
  tab: 'dashboard' | 'files' | 'shared' | 'storage' | 'workspaces' | 'settings';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface Workspace {
  id: number;
  drive_uuid: string;
  folder_path: string;
  title: string;
  description?: string | null;
  share_token: string;
  access_type?: 'public' | 'protected' | string;
  password_hash?: string | null;
  enabled?: boolean | number;
  created_at?: string;
  drive_status?: 'online' | 'offline' | string;
  content_counts?: {
    presentation?: number;
    documentation?: number;
    videos?: number;
    images?: number;
    other_files?: number;
  };
}

export interface ShowcaseContentItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number | null;
  mime_type?: string;
}

export interface ShowcaseContent {
  presentation?: ShowcaseContentItem | ShowcaseContentItem[] | null;
  documentation?: ShowcaseContentItem[];
  videos?: ShowcaseContentItem[];
  images?: ShowcaseContentItem[];
  other_files?: ShowcaseContentItem[];
  folders?: ShowcaseContentItem[];
}

export interface ShowcaseResponse {
  workspace: {
    id: number;
    title: string;
    description?: string | null;
    drive_uuid: string;
    folder_path: string;
    access_type?: string;
    enabled?: boolean;
  };
}

export interface ShowcaseContentResponse {
  workspace_id: number;
  title: string;
  description?: string | null;
  content: ShowcaseContent;
}

export interface ShowcaseFilesResponse {
  title: string;
  description?: string | null;
  path: string;
  items: ShowcaseContentItem[];
}
