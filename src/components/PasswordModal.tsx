'use client';

import React, { useState } from 'react';
import { Lock, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from './Toast';

interface PasswordModalProps {
  folderPath: string;
  folderName: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function PasswordModal({
  folderPath,
  folderName,
  onSuccess,
  onBack,
}: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the folder password.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await api.checkFolderPassword(folderPath, password);
      if (isValid) {
        showToast('success', 'Folder unlocked', `Access granted to "${folderName}".`);
        onSuccess();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Incorrect password. Please try again.';
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-16 my-4">
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-8 sm:p-10 shadow-sm max-w-sm w-full text-center animate-in zoom-in-95 duration-150">
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-lg font-semibold text-neutral-900">Protected Folder</h2>
        <p className="text-xs text-neutral-500 mt-1">
          This folder requires a password to view its contents.
        </p>
        <p className="text-[11px] font-mono text-neutral-400 mt-0.5 max-w-[240px] truncate mx-auto">
          {folderName}
        </p>

        <form onSubmit={handleUnlock} className="mt-6 space-y-3.5 text-left">
          <div>
            <label htmlFor="unlockPassword" className="sr-only">
              Folder Password
            </label>
            <div className="relative">
              <input
                id="unlockPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                placeholder="Enter password"
                className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200/80 rounded-xl pr-9 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white text-neutral-900"
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
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="font-medium leading-tight">{error}</p>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-2xs disabled:opacity-40 cursor-pointer active:scale-98"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Unlock Folder</span>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
