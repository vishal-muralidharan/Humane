/**
 * OutputPanel.jsx
 * ───────────────
 * Right half of the split-screen layout.
 *
 * Possible states:
 *   1. idle      — friendly empty state (no text yet)
 *   2. loading   — SkeletonLoader shown while mock API runs
 *   3. error     — red error banner
 *   4. result    — humanized text + DetectionBadge + copy button
 *
 * Props:
 *   outputText  {string}
 *   isLoading   {boolean}
 *   error       {string|null}
 */

import { useState } from 'react';
import { Copy, CheckCheck, FileText } from 'lucide-react';
import SkeletonLoader  from './SkeletonLoader';
import DetectionBadge  from './DetectionBadge';

export default function OutputPanel({ outputText, isLoading, error }) {
  // Local state: did the user just copy? Used for the ✓ feedback flash.
  const [copied, setCopied] = useState(false);

  /** Copies outputText to clipboard and shows a brief confirmation tick. */
  async function handleCopy() {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset after 2 s
    } catch {
      // Fallback for browsers without Clipboard API
      const el = document.createElement('textarea');
      el.value = outputText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  /* ── Derive which content to render ── */
  const showIdle    = !isLoading && !error && !outputText;
  const showResult  = !isLoading && !error &&  outputText;
  const showError   = !isLoading &&  error;

  return (
    <div className="flex flex-col h-full">
      {/* ── Panel header ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Humanized Output
        </h2>

        {/* ── Copy button — only visible when result is ready ── */}
        {showResult && (
          <button
            id="copy-btn"
            onClick={handleCopy}
            className={[
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg',
              'border transition-all duration-200',
              copied
                ? 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20'
                : 'text-slate-400 border-slate-700 bg-slate-800 hover:text-white hover:border-slate-500',
            ].join(' ')}
            aria-label="Copy humanized text to clipboard"
          >
            {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* ── Content box ── */}
      <div
        className={[
          'flex-1 rounded-xl border px-4 py-4 overflow-y-auto min-h-[240px]',
          'transition-colors duration-300',
          showError
            ? 'border-red-500/40 bg-red-950/30'
            : 'border-slate-700/60 bg-slate-900',
        ].join(' ')}
      >
        {/* 1️⃣  Skeleton loader */}
        {isLoading && <SkeletonLoader />}

        {/* 2️⃣  Idle / empty state */}
        {showIdle && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-slate-600 select-none">
            <FileText size={40} strokeWidth={1.2} />
            <p className="text-sm leading-relaxed max-w-xs">
              Your humanized text will appear here.<br />
              Paste some AI text on the left and hit&nbsp;
              <span className="text-violet-400 font-medium">Humanize Text</span>.
            </p>
          </div>
        )}

        {/* 3️⃣  Error state */}
        {showError && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-red-400">Something went wrong</p>
            <p className="text-xs text-red-300/70">{error}</p>
          </div>
        )}

        {/* 4️⃣  Result */}
        {showResult && (
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap select-text">
            {outputText}
          </p>
        )}
      </div>

      {/* ── Detection badge — only when result is ready ── */}
      {showResult && (
        <div className="mt-3 flex items-center gap-2">
          {/* Simulated score — swap with real API value in Phase 2 */}
          <DetectionBadge score={4} />
          <span className="text-xs text-slate-600 italic">simulated score</span>
        </div>
      )}
    </div>
  );
}
