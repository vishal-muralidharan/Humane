/**
 * InputPanel.jsx
 * ──────────────
 * Left half of the split-screen layout.
 *
 * Props:
 *   inputText   {string}   — controlled textarea value
 *   setInput    {fn}       — setter to update inputText in parent state
 *   onHumanize  {fn}       — callback fired when user clicks "Humanize Text"
 *   isLoading   {boolean}  — disables the button while a request is in-flight
 *   maxChars    {number}   — character limit (default 3000)
 */

import { Wand2, X } from 'lucide-react';

const MAX_CHARS = 3000;

export default function InputPanel({ inputText, setInput, onHumanize, isLoading }) {
  const charCount  = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty     = charCount === 0;
  const canSubmit   = !isLoading && !isEmpty && !isOverLimit;

  return (
    <div className="flex flex-col h-full">
      {/* ── Panel header ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          AI-Generated Text
        </h2>

        {/* Clear button — only visible when there is content */}
        {inputText.length > 0 && (
          <button
            onClick={() => setInput('')}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear input"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* ── Textarea ── */}
      <textarea
        id="input-textarea"
        value={inputText}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste your AI-generated text here…"
        disabled={isLoading}
        className={[
          'flex-1 w-full resize-none rounded-xl bg-slate-900 border px-4 py-4',
          'text-slate-200 placeholder-slate-600 text-sm leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/70',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200 min-h-[240px]',
          isOverLimit ? 'border-red-500/70' : 'border-slate-700/60',
        ].join(' ')}
      />

      {/* ── Footer row: character counter + CTA ── */}
      <div className="flex items-center justify-between mt-3">
        {/* Character counter */}
        <span
          className={[
            'text-xs tabular-nums',
            isOverLimit ? 'text-red-400 font-medium' : 'text-slate-500',
          ].join(' ')}
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>

        {/* Primary CTA */}
        <button
          id="humanize-btn"
          onClick={onHumanize}
          disabled={!canSubmit}
          className={[
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
            'bg-violet-600 hover:bg-violet-500 active:scale-95',
            'text-white transition-all duration-150 shadow-lg shadow-violet-900/40',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          ].join(' ')}
        >
          {/* Swap icon for spinner when loading */}
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={16} strokeWidth={2} />
          )}
          {isLoading ? 'Humanizing…' : 'Humanize Text'}
        </button>
      </div>
    </div>
  );
}
