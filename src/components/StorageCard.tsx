'use client';

import React from 'react';
import { Sparkles, ShieldCheck, Database } from 'lucide-react';
import { StorageSummary } from '@/types';

interface StorageCardProps {
  summary: StorageSummary;
  isOnline: boolean;
  driveCount: number;
}

export function StorageCard({ summary, isOnline, driveCount }: StorageCardProps) {
  // Determine greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
              {getGreeting()}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Raspberry Pi Node</span>
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Your personal cloud is ready.
          </p>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white border border-neutral-200/80 px-3.5 py-1.5 rounded-xl shadow-2xs self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
          <span>Local Storage</span>
          <span className="text-neutral-300">•</span>
          <span className="font-medium text-neutral-700">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Main Storage Metric Card */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-neutral-300/90 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total Storage Pool</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                {summary.is_usage_known !== false ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                      {summary.used_formatted}
                    </span>
                    <span className="text-sm text-neutral-400 font-normal">
                      used of {summary.total_formatted}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                      {summary.total_formatted}
                    </span>
                    <span className="text-xs text-neutral-400 font-normal">
                      Capacity (Usage stats pending from Pi)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-left md:text-right">
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                Available
              </p>
              <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                {summary.is_usage_known !== false ? summary.free_formatted : `~${summary.total_formatted}`}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                Capacity
              </p>
              <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                {summary.total_formatted}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                Drives
              </p>
              <p className="text-sm font-semibold text-neutral-800 mt-0.5">
                {driveCount} Connected
              </p>
            </div>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-700">Storage Usage</span>
            <span className="font-mono text-neutral-500">
              {summary.is_usage_known !== false ? `${summary.used_percentage}%` : 'Ready'}
            </span>
          </div>

          <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                summary.is_usage_known !== false ? 'bg-neutral-900' : 'bg-neutral-300'
              }`}
              style={{
                width: summary.is_usage_known !== false ? `${Math.max(summary.used_percentage, 2)}%` : '100%',
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
            <span>{summary.is_usage_known !== false ? `${summary.used_formatted} Used` : 'Mounted & Online'}</span>
            <span>{summary.is_usage_known !== false ? `${summary.free_formatted} Available` : `${summary.total_formatted} Capacity`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
