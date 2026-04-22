/**
 * App.jsx — AI Text Humanizer (Phase 2)
 * =======================================
 * Root component. Owns all application-level state and orchestrates
 * the split-screen layout:
 *
 *   ┌──────────────────────┬──────────────────────┐
 *   │     InputPanel       │     OutputPanel      │
 *   │  (AI text in)        │  (humanized text out)│
 *   └──────────────────────┴──────────────────────┘
 *
 * On mobile the columns collapse into a vertical stack (top / bottom).
 *
 * State:
 *   inputText  — the raw AI-generated text the user pastes
 *   outputText — the humanized result returned from the API
 *   isLoading  — true while the API request is in-flight
 *   error      — error message string, or null if no error
 *
 * API contract (Phase 2 — LIVE):
 *   handleHumanize calls POST /api/humanize via the humanizeText() helper.
 *   The serverless function sends inputText to Claude 3.5 Sonnet and logs
 *   the pair to Supabase before returning the rewritten text.
 */

import { useState }       from 'react';
import Header             from './components/Header';
import InputPanel         from './components/InputPanel';
import OutputPanel        from './components/OutputPanel';
import { humanizeText }   from './api/humanize';



export default function App() {
  /* ── Application state ── */
  const [inputText,  setInputText]  = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState(null);

  /**
   * handleHumanize
   * ──────────────
   * Phase 2: calls POST /api/humanize via the humanizeText() helper.
   * The serverless function sends the text to Claude 3.5 Sonnet and
   * logs the original + result pair to Supabase before responding.
   */
  async function handleHumanize() {
    if (!inputText.trim()) return;

    // Reset previous output / error and enter loading state
    setIsLoading(true);
    setOutputText('');
    setError(null);

    try {
      // ── LIVE: real call to /api/humanize serverless function ──────
      const result = await humanizeText(inputText);
      setOutputText(result);
      // ──────────────────────────────────────────────────────────────
    } catch (err) {
      // Surface any network / server errors to the user
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      // Always exit loading state regardless of success / failure
      setIsLoading(false);
    }
  }

  /* ── Render ── */
  return (
    /*
     * Full-viewport dark background.
     * On md+ screens: flex-row (side by side).
     * On mobile:      flex-col (stacked, input on top).
     */
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Sticky top bar ── */}
      <Header />

      {/* ── Hero sub-header ── */}
      <div className="text-center pt-10 pb-6 px-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Make AI Text Sound{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Human
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Paste AI-generated content and get a natural, bypass-ready rewrite in seconds.
        </p>
      </div>

      {/* ── Split-screen panels ── */}
      <main
        className="flex flex-col md:flex-row flex-1 gap-4 px-4 sm:px-6 lg:px-10 pb-10 max-w-7xl mx-auto w-full"
        role="main"
      >
        {/* Left: Input */}
        <section className="flex-1 flex flex-col" aria-label="Input section">
          <InputPanel
            inputText={inputText}
            setInput={setInputText}
            onHumanize={handleHumanize}
            isLoading={isLoading}
          />
        </section>

        {/* ── Vertical divider (desktop only) ── */}
        <div className="hidden md:flex flex-col items-center gap-2 pt-10">
          <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest rotate-90 my-2 whitespace-nowrap">
            output
          </span>
          <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
        </div>

        {/* Right: Output */}
        <section className="flex-1 flex flex-col" aria-label="Output section">
          <OutputPanel
            outputText={outputText}
            isLoading={isLoading}
            error={error}
          />
        </section>
      </main>
    </div>
  );
}
