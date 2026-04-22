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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black">
          Input
        </h2>

        {inputText.length > 0 && (
          <button
            onClick={() => setInput('')}
            className="flex items-center gap-1 text-xs text-black border-b border-black"
            aria-label="Clear input"
          >
            Clear
          </button>
        )}
      </div>

      <textarea
        id="input-textarea"
        value={inputText}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste text here..."
        disabled={isLoading}
        className={[
          'flex-1 w-full resize-none bg-white border-2 border-black p-4',
          'text-black placeholder-gray-500 text-sm leading-relaxed',
          'focus:outline-none focus:ring-2 focus:ring-black',
          'disabled:opacity-50',
          'transition-colors duration-200 min-h-[240px]',
          isOverLimit ? 'border-red-600' : 'border-black',
        ].join(' ')}
      />

      <div className="flex items-center justify-between mt-3">
        <span
          className={[
            'text-xs font-bold tabular-nums',
            isOverLimit ? 'text-red-600' : 'text-black',
          ].join(' ')}
        >
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>

        <button
          id="humanize-btn"
          onClick={onHumanize}
          disabled={!canSubmit}
          className={[
            'flex items-center gap-2 px-6 py-2 border-2 border-black text-sm font-bold',
            'bg-black text-white hover:bg-gray-800 active:scale-95',
            'disabled:opacity-40 disabled:active:scale-100',
          ].join(' ')}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            null
          )}
          {isLoading ? 'Processing...' : 'Humanize'}
        </button>
      </div>
    </div>
  );
}
