'use client';

import React from 'react';
import {
  Presentation,
  FileText,
  Video,
  Image as ImageIcon,
  FolderOpen,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';

export type ContentCardType = 'presentation' | 'documentation' | 'demo' | 'gallery' | 'files';

interface ContentCardProps {
  type: ContentCardType;
  title: string;
  subtitle: string;
  itemCount?: number;
  actionText: string;
  onClick: () => void;
}

const TYPE_CONFIG: Record<
  ContentCardType,
  {
    icon: LucideIcon;
    badgeBg: string;
    badgeColor: string;
    iconColor: string;
    borderColor: string;
  }
> = {
  presentation: {
    icon: Presentation,
    badgeBg: 'bg-amber-50',
    badgeColor: 'text-amber-800',
    iconColor: 'text-amber-600',
    borderColor: 'hover:border-amber-200/80',
  },
  documentation: {
    icon: FileText,
    badgeBg: 'bg-blue-50',
    badgeColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    borderColor: 'hover:border-blue-200/80',
  },
  demo: {
    icon: Video,
    badgeBg: 'bg-purple-50',
    badgeColor: 'text-purple-800',
    iconColor: 'text-purple-600',
    borderColor: 'hover:border-purple-200/80',
  },
  gallery: {
    icon: ImageIcon,
    badgeBg: 'bg-emerald-50',
    badgeColor: 'text-emerald-800',
    iconColor: 'text-emerald-600',
    borderColor: 'hover:border-emerald-200/80',
  },
  files: {
    icon: FolderOpen,
    badgeBg: 'bg-neutral-100',
    badgeColor: 'text-neutral-800',
    iconColor: 'text-neutral-700',
    borderColor: 'hover:border-neutral-300',
  },
};

export function ContentCard({
  type,
  title,
  subtitle,
  itemCount,
  actionText,
  onClick,
}: ContentCardProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer ${config.borderColor}`}
    >
      <div>
        {/* Card Header Icon & Count Badge */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${config.badgeBg}`}
          >
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          {itemCount !== undefined && itemCount > 0 && (
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border border-neutral-200/60 ${config.badgeBg} ${config.badgeColor}`}
            >
              {itemCount} {itemCount === 1 ? 'file' : 'files'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-neutral-950 transition-colors">
          {title}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-800 group-hover:text-neutral-950 flex items-center gap-1.5 transition-colors">
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 text-neutral-500 group-hover:text-neutral-900" />
        </span>
      </div>
    </div>
  );
}
