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
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const showIdle    = !isLoading && !error && !outputText;
  const showResult  = !isLoading && !error &&  outputText;
  const showError   = !isLoading &&  error;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black">
          Output
        </h2>

        {showResult && (
          <button
            id="copy-btn"
            onClick={handleCopy}
            className={[
              'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border-2',
              'transition-all duration-200',
              copied
                ? 'text-black border-black bg-gray-200'
                : 'text-black border-black bg-white hover:bg-gray-100',
            ].join(' ')}
            aria-label="Copy humanized text to clipboard"
          >
            {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      <div
        className={[
          'flex-1 border-2 p-4 overflow-y-auto min-h-[240px]',
          'transition-colors duration-300',
          showError
            ? 'border-red-600 bg-white text-black'
            : 'border-black bg-white text-black',
        ].join(' ')}
      >
        {isLoading && <SkeletonLoader />}

        {showIdle && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-gray-500 select-none">
            <FileText size={40} strokeWidth={1.2} />
            <p className="text-sm leading-relaxed max-w-xs">
              Output will appear here.
            </p>
          </div>
        )}

        {showError && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-red-600">Error</p>
            <p className="text-xs text-black">{error}</p>
          </div>
        )}

        {showResult && (
          <p className="text-black text-sm leading-relaxed whitespace-pre-wrap select-text">
            {outputText}
          </p>
        )}
      </div>

      {showResult && (
        <div className="mt-3 flex items-center gap-2">
          <DetectionBadge score={4} />
        </div>
      )}
    </div>
  );
}
