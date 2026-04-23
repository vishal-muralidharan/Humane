import { useRef, useEffect } from 'react';
import { Wand2, X } from 'lucide-react';

const MAX_WORDS = 1000;

export default function InputPanel({ inputText, setInput, onHumanize, isLoading }) {
  const textareaRef = useRef(null);
  const wordCount = inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length;
  const isOverLimit = wordCount > MAX_WORDS;
  const isEmpty     = wordCount === 0;
  const canSubmit   = !isLoading && !isEmpty && !isOverLimit;

  // Auto-resize up to 60vh on mobile, retaining 100% height flex flow on desktop
  useEffect(() => {
    const handleResize = () => {
      const el = textareaRef.current;
      if (!el) return;

      if (window.innerWidth < 768) {
        el.style.height = '150px'; // Base min height for evaluation
        const currentScrollHeight = el.scrollHeight;
        const maxAllowedHeight = window.innerHeight * 0.6; // Cap at 60% of viewport height
        
        if (currentScrollHeight > maxAllowedHeight) {
          el.style.height = `${maxAllowedHeight}px`;
          el.style.overflowY = 'auto';
        } else {
          el.style.height = `${Math.max(150, currentScrollHeight)}px`;
          el.style.overflowY = 'hidden';
        }
      } else {
        el.style.height = '100%';
        el.style.overflowY = 'auto'; // Will default to standard scrollbar when box overflows
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [inputText]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 h-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Input
        </h2>

        {inputText.length > 0 && (
          <button
            onClick={() => setInput('')}
            className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear input"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative flex-1 group mt-2 flex flex-col min-h-0">
        <textarea
          id="input-textarea"
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text here"
          disabled={isLoading}
          className={[
            'w-full resize-none p-5 rounded-xl md:flex-1 md:h-full',
            'overflow-x-hidden break-words',
            'bg-[#111113] border border-zinc-800',
            'text-zinc-200 placeholder-zinc-600 text-sm leading-relaxed font-normal',
            'focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600',
            'disabled:opacity-50 transition-all duration-300',
            isOverLimit ? 'border-red-900/50 focus:border-red-800 focus:ring-red-800' : '',
          ].join(' ')}
        />
        
        {/* Subtle gradient glow in dark mode */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-zinc-900 via-[#111113] to-[#111113] rounded-xl opacity-50 pointer-events-none" />
      </div>

      <div className="flex items-center justify-between mt-5 h-10 gap-2 sm:gap-4">
        <span
          className={[
            'text-[10px] sm:text-[11px] font-medium tracking-wide tabular-nums px-2 sm:px-3 py-1 rounded whitespace-nowrap',
            isOverLimit ? 'text-red-500 bg-red-950/40 border border-red-900/50' : 'text-zinc-500',
          ].join(' ')}
        >
          {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
        </span>

        <button
          id="humanize-btn"
          onClick={onHumanize}
          disabled={!canSubmit}
          className={[
            'flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium tracking-wide w-auto sm:w-36 flex-shrink-0',
            'bg-zinc-100 text-zinc-900 hover:bg-white active:scale-[0.98]',
            'transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.05)]',
            'disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:active:scale-100 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-[2px] border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
          ) : null}
          {isLoading ? 'Wait...' : 'Humanize'}
        </button>
      </div>
    </div>
  );
}
