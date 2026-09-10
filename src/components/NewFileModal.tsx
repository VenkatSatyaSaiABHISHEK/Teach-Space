'use client';

import React, { useState, useMemo } from 'react';
import {
  FilePlus,
  X,
  Loader2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  File as FileIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from './Toast';

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onFileCreated: () => void;
  driveUuid?: string;
}

export function NewFileModal({
  isOpen,
  onClose,
  currentPath,
  onFileCreated,
  driveUuid,
}: NewFileModalProps) {
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Dynamic icon based on file extension
  const fileExt = useMemo(() => {
    const trimmed = fileName.trim();
    if (!trimmed.includes('.')) return '';
    return trimmed.split('.').pop()?.toLowerCase() || '';
  }, [fileName]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setFileName('');
    setContent('');
    setIsProtected(false);
    setPassword('');
    setShowPassword(false);
    setError(null);
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let name = fileName.trim();
    if (!name) {
      setError('Please enter a valid file name.');
      return;
    }

    if (name.includes('/') || name.includes('\\')) {
      setError('File names cannot contain slashes.');
      return;
    }

    // Append default .txt extension if no extension was provided
    if (!name.includes('.')) {
      name = `${name}.txt`;
    }

    if (isProtected) {
      if (!password || password.trim().length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createFile(
        name,
        content,
        currentPath,
        isProtected ? password.trim() : undefined,
        driveUuid
      );

      showToast(
        'success',
        isProtected ? 'Protected file created' : 'File created',
        isProtected
          ? `File "${name}" created with password protection.`
          : `File "${name}" created successfully.`
      );

      onFileCreated();
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create file.';
      setError(msg);
      showToast('error', 'Failed to create file', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Create New File</h2>
              <p className="text-[11px] text-neutral-400">
                In: {currentPath ? `/${currentPath}` : 'Root storage'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreate}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* File Name Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="newFileName" className="text-xs font-medium text-neutral-700">
                  File name
                </label>
                {fileExt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                    {['js', 'ts', 'tsx', 'py', 'json', 'html', 'css'].includes(fileExt) ? (
                      <FileCode className="w-3 h-3 text-cyan-600" />
                    ) : ['txt', 'md', 'doc'].includes(fileExt) ? (
                      <FileText className="w-3 h-3 text-blue-600" />
                    ) : (
                      <FileIcon className="w-3 h-3 text-neutral-500" />
                    )}
                    <span>{fileExt}</span>
                  </span>
                )}
              </div>
              <input
                id="newFileName"
                type="text"
                value={fileName}
                onChange={(e) => {
                  setFileName(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                placeholder="e.g. notes.txt, readme.md, config.json"
                className="w-full px-3.5 py-2 text-xs font-mono bg-neutral-50 border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white transition-all text-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Tip: You can add an extension like <code className="text-neutral-600 font-mono">.md</code> or <code className="text-neutral-600 font-mono">.txt</code>
              </p>
            </div>

            {/* File Content Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="fileContent" className="text-xs font-medium text-neutral-700">
                  Content (Optional)
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {content.length} chars
                </span>
              </div>
              <textarea
                id="fileContent"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste file content here..."
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white transition-all text-neutral-900 resize-y"
              />
            </div>

            {/* Password Protection Toggle Card */}
            <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isProtected ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-500'}`}>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-neutral-800">
                      Protect with password
                    </span>
                    <p className="text-[11px] text-neutral-500">
                      Require password to view or download this file
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isProtected}
                    onChange={(e) => {
                      setIsProtected(e.target.checked);
                      if (!e.target.checked) setPassword('');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                </label>
              </div>

              {/* Password Input (if protected is toggled) */}
              {isProtected && (
                <div className="pt-2 border-t border-neutral-200/60 animate-in fade-in duration-150 space-y-1.5">
                  <label htmlFor="filePasswordInput" className="text-xs font-medium text-neutral-700">
                    File Password
                  </label>
                  <div className="relative">
                    <input
                      id="filePasswordInput"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Enter a secure password (min 4 chars)"
                      className="w-full px-3.5 py-2 pr-9 text-xs bg-white border border-neutral-200/90 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    This file will be locked and cannot be viewed without this password.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/40">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !fileName.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  {isProtected ? <Lock className="w-3.5 h-3.5" /> : <FilePlus className="w-3.5 h-3.5" />}
                  <span>{isProtected ? 'Create & Protect' : 'Create File'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}