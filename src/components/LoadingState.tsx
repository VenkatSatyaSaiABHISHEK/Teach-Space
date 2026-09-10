'use client';

import React from 'react';

export function StorageSkeleton() {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100" />
          <div className="space-y-2">
            <div className="w-24 h-3 bg-neutral-100 rounded" />
            <div className="w-44 h-6 bg-neutral-100 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="space-y-1.5">
            <div className="w-16 h-3 bg-neutral-100 rounded" />
            <div className="w-12 h-4 bg-neutral-100 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="w-16 h-3 bg-neutral-100 rounded" />
            <div className="w-12 h-4 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex justify-between">
          <div className="w-20 h-3 bg-neutral-100 rounded" />
          <div className="w-8 h-3 bg-neutral-100 rounded" />
        </div>
        <div className="w-full h-2.5 bg-neutral-100 rounded-full" />
      </div>
    </div>
  );
}

export function DriveSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs animate-pulse space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100" />
              <div className="space-y-1.5">
                <div className="w-14 h-2.5 bg-neutral-100 rounded" />
                <div className="w-24 h-4 bg-neutral-100 rounded" />
              </div>
            </div>
            <div className="w-14 h-5 rounded-full bg-neutral-100" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100">
            <div className="space-y-1">
              <div className="w-12 h-2.5 bg-neutral-100 rounded" />
              <div className="w-16 h-3.5 bg-neutral-100 rounded" />
            </div>
            <div className="space-y-1">
              <div className="w-12 h-2.5 bg-neutral-100 rounded" />
              <div className="w-16 h-3.5 bg-neutral-100 rounded" />
            </div>
          </div>

          <div className="w-full h-1.5 bg-neutral-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function FileListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Folder section skeleton */}
      <div>
        <div className="w-20 h-3 bg-neutral-200/80 rounded mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200/80 rounded-2xl p-4 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100" />
              <div className="w-20 h-3.5 bg-neutral-100 rounded" />
              <div className="w-12 h-2.5 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* File section skeleton */}
      <div>
        <div className="w-16 h-3 bg-neutral-200/80 rounded mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white border border-neutral-200/80 rounded-2xl p-4 space-y-3"
            >
              <div className="flex justify-between">
                <div className="w-10 h-10 rounded-xl bg-neutral-100" />
                <div className="w-10 h-4 rounded bg-neutral-100" />
              </div>
              <div className="w-24 h-3.5 bg-neutral-100 rounded" />
              <div className="w-14 h-2.5 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
