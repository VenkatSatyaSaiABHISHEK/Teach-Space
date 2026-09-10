'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SettingsModal } from '@/components/SettingsModal';
import { SystemStatusModal } from '@/components/SystemStatusModal';
import { ToastProvider } from '@/components/Toast';
import { api } from '@/lib/api';

interface TechStorageLayoutProps {
  children: React.ReactNode;
}

export function TechStorageLayout({ children }: TechStorageLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isPinging, setIsPinging] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | undefined>(undefined);
  const [driveCount, setDriveCount] = useState<number>(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemModalOpen, setSystemModalOpen] = useState(false);

  // Ping backend periodically and check drive count
  const pingBackend = async () => {
    setIsPinging(true);
    try {
      const [pingRes, drives] = await Promise.all([
        api.pingBackend(),
        api.getDrives().catch(() => []),
      ]);
      setIsOnline(pingRes.online);
      setPingLatency(pingRes.latencyMs);
      setDriveCount(drives.length);
    } catch {
      setIsOnline(false);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#fafafa] overflow-hidden">
        {/* TechSpace Sidebar */}
        <Sidebar
          currentTab="techstorage"
          onTabChange={() => {}}
          isOnline={isOnline}
          isPinging={isPinging}
          onRefreshStatus={pingBackend}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSystemModal={() => setSystemModalOpen(true)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>

        {/* Settings & System Modals */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSettingsSaved={() => pingBackend()}
        />

        <SystemStatusModal
          isOpen={systemModalOpen}
          onClose={() => setSystemModalOpen(false)}
          isOnline={isOnline}
          pingLatency={pingLatency}
          driveCount={driveCount}
          onOpenSettings={() => {
            setSystemModalOpen(false);
            setSettingsOpen(true);
          }}
        />
      </div>
    </ToastProvider>
  );
}
