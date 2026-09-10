'use client';

import React, { useState } from 'react';
import { FolderPlus, X, Loader2, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from './Toast';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onFolderCreated: () => void;
  driveUuid?: string;
}

export function NewFolderModal({
  isOpen,
  onClose,
  currentPath,
  onFolderCreated,
  driveUuid,
}: NewFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setFolderName('');
    setIsProtected(false);
    setPassword('');
    setShowPassword(false);
    setError(null);
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) {
      setError('Please enter a valid folder name.');
      return;
    }

    if (name.includes('/') || name.includes('\\')) {
      setError('Folder names cannot contain slashes.');
      return;
    }

    if (isProtected) {
      if (!password || password.trim().length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const fullPath = currentPath ? `${currentPath}/${name}` : name;

    try {
      await api.createFolder(fullPath, driveUuid);

      if (isProtected) {
        await api.setFolderProtected(fullPath, password.trim());
      }

      showToast(
        'success',
        isProtected ? 'Protected folder created' : 'Folder created',
        isProtected
          ? `Folder "${name}" was created with password protection.`
          : `Folder "${name}" was created successfully.`
      );
      onFolderCreated();
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create folder.';
      setError(msg);
      showToast('error', 'Failed to create folder', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">New Folder</h2>
              <p className="text-[11px] text-neutral-400">
                In: {currentPath ? `/${currentPath}` : 'Root storage'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="folderName" className="block text-xs font-medium text-neutral-700 mb-1.5">
                Folder name
              </label>
              <input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                placeholder="e.g. Projects, Photos, Invoices"
                className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white transition-all text-neutral-900"
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
                      Require password to open this folder
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
                  <label htmlFor="folderPasswordInput" className="text-xs font-medium text-neutral-700">
                    Folder Password
                  </label>
                  <div className="relative">
                    <input
                      id="folderPasswordInput"
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
                    This folder will be locked and cannot be opened without this password.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/40">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  {isProtected ? <Lock className="w-3.5 h-3.5" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  <span>{isProtected ? 'Create & Protect' : 'Create Folder'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
