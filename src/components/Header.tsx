'use client';

import React from 'react';
import {
  Search,
  Upload,
  FolderPlus,
  FilePlus,
  ChevronRight,
  Menu,
  Server,
  LayoutGrid,
  List,
  Home,
  X,
} from 'lucide-react';
import { BreadcrumbItem, ViewMode } from '@/types';

interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigateBreadcrumb: (path: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenUploadModal: () => void;
  onOpenNewFolderModal: () => void;
  onOpenNewFileModal?: () => void;
  onOpenSystemModal: () => void;
  onOpenMobileMenu: () => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  showFileActions?: boolean;
}

export function Header({
  breadcrumbs,
  onNavigateBreadcrumb,
  searchQuery,
  onSearchChange,
  onOpenUploadModal,
  onOpenNewFolderModal,
  onOpenNewFileModal,
  onOpenSystemModal,
  onOpenMobileMenu,
  viewMode,
  onToggleViewMode,
  showFileActions = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 min-h-[68px] sm:min-h-[72px] flex items-center shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        {/* Left: Mobile toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden w-10 h-10 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs cursor-pointer"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => onNavigateBreadcrumb('')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all shrink-0 cursor-pointer ${
                breadcrumbs.length === 0
                  ? 'bg-neutral-100/90 text-neutral-900 font-semibold border border-neutral-200/60 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
              }`}
              title="Root directory"
            >
              <Home className="w-4 h-4 text-neutral-500" />
              <span>Root</span>
            </button>

            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb.path} className="flex items-center gap-1.5 shrink-0">
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                  <button
                    type="button"
                    onClick={() => onNavigateBreadcrumb(crumb.path)}
                    disabled={isLast}
                    className={`text-sm max-w-[180px] truncate transition-all ${
                      isLast
                        ? 'px-3 py-1.5 rounded-xl text-neutral-900 font-semibold bg-neutral-100/90 border border-neutral-200/60 shadow-2xs cursor-default'
                        : 'px-2.5 py-1.5 rounded-xl font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 cursor-pointer'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Action Buttons + View Toggle + System Info */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64 md:w-72 lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-9 py-2 bg-neutral-50/90 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200/90 focus:border-neutral-900 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grid/List View Toggle */}
          {showFileActions && (
            <div className="flex items-center p-1 bg-neutral-100/90 rounded-xl border border-neutral-200/60 shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => onToggleViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggleViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons: New File, New Folder & Upload */}
          {showFileActions && (
            <div className="flex items-center gap-2">
              {onOpenNewFileModal && (
                <button
                  type="button"
                  onClick={onOpenNewFileModal}
                  className="h-10 px-3.5 sm:px-4 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 text-sm font-medium transition-all shadow-2xs hover:shadow-xs active:scale-98 flex items-center gap-2 cursor-pointer"
                  title="Create a new document or text file"
                >
                  <FilePlus className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="hidden sm:inline">New File</span>
                  <span className="sm:hidden">File</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenNewFolderModal}
                className="h-10 px-3.5 sm:px-4 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 text-sm font-medium transition-all shadow-2xs hover:shadow-xs active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-neutral-500 shrink-0" />
                <span className="hidden sm:inline">New Folder</span>
                <span className="sm:hidden">Folder</span>
              </button>

              <button
                type="button"
                onClick={onOpenUploadModal}
                className="h-10 px-4 sm:px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold transition-all shadow-xs hover:shadow-sm active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>Upload</span>
              </button>
            </div>
          )}

          {/* System status button (no login/auth) */}
          <button
            type="button"
            onClick={onOpenSystemModal}
            className="w-10 h-10 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-all shadow-2xs active:scale-98 cursor-pointer ml-0.5"
            title="TechSpace System Information"
            aria-label="System status"
          >
            <Server className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
