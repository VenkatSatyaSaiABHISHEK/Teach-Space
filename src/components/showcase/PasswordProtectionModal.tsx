'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface PasswordProtectionModalProps {
  title?: string;
  onSubmitPassword: (password: string) => Promise<boolean> | boolean;
}

export function PasswordProtectionModal({
  title,
  onSubmitPassword,
}: PasswordProtectionModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the project password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const isValid = await onSubmitPassword(password);
      if (!isValid) {
        setError('Incorrect password. Please verify and try again.');
      }
    } catch {
      setError('Unable to verify password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-10 shadow-xs text-center">
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5 text-neutral-800 border border-neutral-200/60">
          <Lock className="w-6 h-6 stroke-[1.75]" />
        </div>

        {/* Small Tag */}
        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 font-mono">
          Project Showcase
        </span>

        {/* Title */}
        <h2 className="text-xl font-bold text-neutral-900 mt-1.5">
          {title ? `${title}` : 'Protected Showcase'}
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 leading-relaxed">
          This project showcase is password protected. Enter the password to access.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 text-left space-y-4">
          <div>
            <label
              htmlFor="showcase-password"
              className="block text-xs font-semibold text-neutral-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="showcase-password"
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <span>{submitting ? 'Verifying...' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-neutral-400 mt-5">
          No account or login required.
        </p>
      </div>
    </div>
  );
}
