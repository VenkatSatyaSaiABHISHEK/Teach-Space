'use client';

import React, { useState, useRef, DragEvent } from 'react';
import {
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  File,
} from 'lucide-react';
import { api, formatBytes, MAX_UPLOAD_BYTES } from '@/lib/api';
import { useToast } from './Toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onUploadSuccess: () => void;
  driveUuid?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  currentPath,
  onUploadSuccess,
  driveUuid,
}: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setProgress(0);
    setIsUploading(false);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const handleFile = (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('File is larger than the 50 MB upload limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);
    setUploadError(null);

    try {
      await api.uploadFile(
        selectedFile,
        currentPath,
        (percent) => {
          setProgress(percent);
        },
        driveUuid
      );

      setUploadSuccess(true);
      showToast('success', 'File uploaded', `${selectedFile.name} was successfully stored.`);

      // Automatically refresh the file list without full page reload
      setTimeout(() => {
        onUploadSuccess();
        handleClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
      showToast('error', 'Upload failed', msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Upload to Physical Storage</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">
              USB SSD{driveUuid ? ` (${driveUuid.slice(0, 8)}...)` : ''} → {currentPath ? `/${currentPath}` : 'Root'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Dropzone Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-neutral-900 bg-neutral-50/80 scale-[1.01]'
                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleInputChange}
              className="hidden"
              disabled={isUploading}
            />

            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-xs font-semibold text-neutral-800">
              Drag files here or browse
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Supports photos, videos, PDFs, and documents up to 50 MB
            </p>
          </div>

          {/* Error notice */}
          {uploadError && (
            <div className="flex items-start gap-2.5 p-3 mt-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-medium">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Selected File Details & Progress */}
          {selectedFile && !uploadError && (
            <div className="mt-4 p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-400">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Binary'}
                    </p>
                  </div>
                </div>

                {!isUploading && !uploadSuccess && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetState();
                    }}
                    className="text-neutral-400 hover:text-neutral-600 p-1 rounded"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {uploadSuccess && (
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Done</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Uploading to TechSpace...</span>
                    <span className="font-mono font-medium text-neutral-800">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 rounded-full transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/40">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartUpload}
            disabled={!selectedFile || isUploading || uploadSuccess || Boolean(uploadError)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload to Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
