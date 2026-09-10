'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  X,
  FileCode,
  FileCheck,
} from 'lucide-react';
import { ShowcaseContentItem } from '@/types';

interface DocumentViewerProps {
  documents: ShowcaseContentItem[];
  driveUuid: string;
  onBack: () => void;
  folderPath: string;
}

export function DocumentViewer({
  documents,
  driveUuid,
  onBack,
  folderPath,
}: DocumentViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDoc = documents[selectedIndex] || documents[0];

  // Build stream URL for document
  const getDocStreamUrl = (doc: ShowcaseContentItem, inline = false) => {
    const cleanDocPath = doc.path.startsWith(folderPath)
      ? doc.path
      : `${folderPath.replace(/\/+$/, '')}/${doc.path.replace(/^\/+/, '')}`;
    const params = new URLSearchParams({ path: cleanDocPath });
    if (inline) {
      params.set('inline', 'true');
    }
    return `/api/backend/download/${encodeURIComponent(driveUuid)}?${params.toString()}`;
  };

  const currentPreviewUrl = selectedDoc ? getDocStreamUrl(selectedDoc, true) : '';
  const currentDownloadUrl = selectedDoc ? getDocStreamUrl(selectedDoc, false) : '';
  const fileExt = selectedDoc ? (selectedDoc.name.split('.').pop() || '').toLowerCase() : '';
  const isPdf = fileExt === 'pdf';
  const isText = ['txt', 'md', 'json', 'csv', 'log', 'rtf'].includes(fileExt);

  // If text or markdown, fetch text preview
  useEffect(() => {
    if (isText && currentPreviewUrl) {
      setLoadingText(true);
      fetch(currentPreviewUrl)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent('Unable to preview text content directly.');
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
      setLoadingText(false);
    }
  }, [currentPreviewUrl, isText]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!selectedDoc) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-md my-6 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' : 'w-full'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-neutral-50/80 border-b border-neutral-200/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200/80 text-neutral-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Showcase</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 min-w-0">
            <span>•</span>
            <span className="flex items-center gap-1.5 text-neutral-800 font-semibold truncate">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{selectedDoc.name}</span>
            </span>
          </div>
        </div>

        {/* Multi-document tabs if more than one doc */}
        {documents.length > 1 && (
          <div className="hidden md:flex items-center gap-1 bg-neutral-200/60 p-1 rounded-xl overflow-x-auto max-w-sm">
            {documents.map((doc, idx) => (
              <button
                key={doc.path || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all truncate max-w-[120px] cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title={doc.name}
              >
                {doc.name}
              </button>
            ))}
          </div>
        )}

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {isPdf && (
            <a
              href={currentPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200/80 text-neutral-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              title="Open document in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>
          )}

          <a
            href={currentDownloadUrl}
            download={selectedDoc.name}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            title="Download document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200/80 text-neutral-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-neutral-200/80 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            title="Close document viewer"
            aria-label="Close document viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Document Content Area */}
      <div className="relative flex-1 bg-neutral-100 flex items-center justify-center min-h-[600px] sm:min-h-[700px] lg:min-h-[800px]">
        {isPdf ? (
          <div className="w-full h-full min-h-[600px] sm:min-h-[700px] lg:min-h-[800px] flex flex-col bg-white">
            <iframe
              src={`${currentPreviewUrl}#toolbar=1&navpanes=1`}
              title={selectedDoc.name}
              className="w-full h-full min-h-[600px] sm:min-h-[700px] lg:min-h-[800px] border-0 bg-white"
            />
          </div>
        ) : isText ? (
          <div className="w-full h-full p-4 sm:p-8 overflow-y-auto max-w-4xl mx-auto bg-white my-4 sm:my-6 rounded-xl border border-neutral-200/80 shadow-xs">
            {loadingText ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                Loading document content...
              </div>
            ) : (
              <pre className="font-mono text-xs sm:text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                {textContent}
              </pre>
            )}
          </div>
        ) : (
          <div className="text-center p-8 max-w-md bg-white rounded-2xl border border-neutral-200/80 shadow-xs">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-neutral-900">{selectedDoc.name}</h4>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              This document format is ready for download and viewing in your preferred application.
            </p>
            <a
              href={currentDownloadUrl}
              download={selectedDoc.name}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
