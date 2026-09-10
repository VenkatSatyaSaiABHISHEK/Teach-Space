'use client';

import React, { useState } from 'react';
import {
  Globe,
  Lock,
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { StorageItem } from '@/types';
import { api } from '@/lib/api';
import { useToast } from './Toast';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: StorageItem | null;
  onAccessUpdated: () => void;
}

export function AccessModal({
  isOpen,
  onClose,
  folder,
  onAccessUpdated,
}: AccessModalProps) {
  const [accessType, setAccessType] = useState<'public' | 'protected'>('public');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  if (!isOpen || !folder) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (accessType === 'protected') {
      if (!password) {
        setError('Please enter a password.');
        return;
      }
      if (password.length < 4) {
        setError('Password should be at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (accessType === 'public') {
        await api.setFolderPublic(folder.path);
        showToast('success', 'Folder is now Public', `Anyone with the link can access "${folder.name}".`);
      } else {
        await api.setFolderProtected(folder.path, password);
        showToast('success', 'Folder is now Protected', `Access to "${folder.name}" now requires a password.`);
      }

      onAccessUpdated();
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update access settings.';
      setError(msg);
      showToast('error', 'Update failed', msg);
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Folder Access Settings</h2>
              <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                {folder.name}
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

        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4">
            {/* Access Mode Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => {
                  setAccessType('public');
                  setError(null);
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  accessType === 'public'
                    ? 'border-neutral-900 bg-neutral-50/80 shadow-2xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 text-neutral-900 mb-1">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold">Public</span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Anyone with the link can access this folder.
                </p>
              </div>

              <div
                onClick={() => {
                  setAccessType('protected');
                  setError(null);
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  accessType === 'protected'
                    ? 'border-neutral-900 bg-neutral-50/80 shadow-2xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 text-neutral-900 mb-1">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold">Protected</span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Require a password before accessing this folder.
                </p>
              </div>
            </div>

            {/* Password input fields if Protected */}
            {accessType === 'protected' && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Folder Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200/80 rounded-xl pr-9 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white text-neutral-900"
                  />
                </div>

                <p className="text-[10px] text-neutral-400">
                  Password is encrypted and stored safely on your Raspberry Pi.
                </p>
              </div>
            )}

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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
