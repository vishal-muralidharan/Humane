import { useState } from 'react';
import { Copy, CheckCheck, FileText } from 'lucide-react';
import SkeletonLoader  from './SkeletonLoader';

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
      <div className="flex items-center justify-between mb-4 h-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Output
        </h2>

        {showResult && (
          <button
            id="copy-btn"
            onClick={handleCopy}
            className={[
              'flex items-center gap-1.5 text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-lg font-medium',
              'transition-all duration-200 border border-zinc-800',
              copied
                ? 'text-zinc-100 bg-zinc-800'
                : 'text-zinc-400 bg-[#111113] hover:text-zinc-200 hover:bg-zinc-800/80',
            ].join(' ')}
            aria-label="Copy humanized text to clipboard"
          >
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      <div className="relative flex-1 group mt-2 flex flex-col min-h-0">
        <div
          className={[
            'w-full p-5 rounded-xl border border-zinc-800 bg-[#111113]',
            'overflow-y-auto overflow-x-hidden transition-all duration-300',
            'min-h-[150px] h-auto max-h-[60vh] md:max-h-none md:flex-1 md:h-full',
            showError ? 'border-red-900/40 bg-red-950/10' : '',
          ].join(' ')}
        >
          {isLoading && <SkeletonLoader />}

          {showIdle && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center text-zinc-600 select-none">
              <FileText size={32} strokeWidth={1} />
              <p className="text-sm font-light leading-relaxed max-w-xs tracking-wide">
                Refined output will appear here.
              </p>
            </div>
          )}

          {showError && (
            <div className="flex flex-col gap-2 h-full items-center justify-center text-center">
              <p className="text-[13px] uppercase tracking-widest font-semibold text-red-500/80">Fault</p>
              <p className="text-sm font-light text-zinc-400 max-w-sm">{error}</p>
            </div>
          )}

          {showResult && (
            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap select-text font-normal break-words">
              {outputText}
            </p>
          )}
        </div>
        
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-zinc-900 via-[#111113] to-[#111113] rounded-xl opacity-50 pointer-events-none" />
      </div>

      <div className="mt-5 flex items-center justify-start h-10">
        {showResult && (
          <span className="text-[11px] font-medium tracking-wide tabular-nums px-3 py-1 rounded bg-zinc-900/40 border border-zinc-800/80 text-zinc-400">
            {outputText.trim() === '' ? 0 : outputText.trim().split(/\s+/).length} words
          </span>
        )}
      </div>
    </div>
  );
}
