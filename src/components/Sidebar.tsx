'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  { ssr: false }
);
import {
  LayoutDashboard,
  FolderClosed,
  Share2,
  HardDrive,
  Settings,
  Cloud,
  Cpu,
  RefreshCw,
  X,
  Briefcase,
} from 'lucide-react';
import { ActiveNavTab } from '@/types';

interface SidebarProps {
  currentTab: ActiveNavTab['tab'];
  onTabChange: (tab: ActiveNavTab['tab']) => void;
  isOnline: boolean;
  isPinging?: boolean;
  onRefreshStatus?: () => void;
  onOpenSettings?: () => void;
  onOpenSystemModal?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentTab,
  onTabChange,
  isOnline,
  isPinging = false,
  onRefreshStatus,
  onOpenSettings,
  onOpenSystemModal,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'My Files', icon: FolderClosed },
    { id: 'workspaces', label: 'Workspaces', icon: Briefcase },
    { id: 'shared', label: 'Shared', icon: Share2 },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-45 h-screen w-64 bg-white border-r border-neutral-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top brand header */}
        <div className="px-5 py-3.5 sm:py-4 min-h-[68px] sm:min-h-[72px] flex items-center border-b border-neutral-200/80">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-xs">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-neutral-900">
                    TechSpace
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                    v0.1
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-normal">
                  Your storage. Your cloud.
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <div className="px-3.5 py-3 flex-1 overflow-y-auto">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive =
                (item.id === 'workspaces' && pathname.startsWith('/workspaces')) ||
                (currentTab === item.id && (item.id !== 'workspaces' || pathname === '/'));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'settings' && onOpenSettings) {
                      onOpenSettings();
                    } else if (item.id === 'workspaces') {
                      router.push('/workspaces');
                      onTabChange('workspaces');
                    } else {
                      if (pathname !== '/') {
                        router.push('/');
                      }
                      onTabChange(item.id);
                    }
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer ${
                    isItemActive
                      ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      isItemActive ? 'text-neutral-900' : 'text-neutral-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lottie Mascot Animation */}
        <div className="px-4 py-1.5 flex items-center justify-center select-none pointer-events-none">
          <div className="w-36 h-28 max-h-[120px] flex items-center justify-center overflow-hidden">
            <DotLottieReact
              src="https://lottie.host/9e506062-5f1a-4fe1-a03a-df1822b1b1b9/taZABzSbck.lottie"
              loop
              autoplay
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Bottom Raspberry Pi status pill */}
        <div className="p-3 border-t border-neutral-100 bg-neutral-50/50">
          <div
            onClick={onOpenSystemModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onOpenSystemModal?.();
              }
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/60 bg-white hover:border-neutral-300 hover:shadow-2xs transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-neutral-800 truncate">
                    Raspberry Pi
                  </span>
                  {isOnline ? (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 bg-emerald-500 animate-status-pulse"
                      title="System Online"
                    />
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="w-2 h-2 rounded-full bg-rose-500"
                        title="Server Offline"
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                        title="Connection Warning"
                      />
                    </div>
                  )}
                </div>
                <p
                  className={`text-[10px] truncate ${
                    isOnline ? 'text-emerald-600 font-medium' : 'text-neutral-400'
                  }`}
                >
                  {isOnline ? 'Online • Local' : 'Offline'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRefreshStatus?.();
              }}
              title="Refresh connection status"
              className="text-neutral-300 hover:text-neutral-700 p-1 rounded-md transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-neutral-600' : ''}`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
