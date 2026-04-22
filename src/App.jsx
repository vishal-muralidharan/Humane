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

import { useState } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import { humanizeText } from './api/humanize';



export default function App() {
  /* ── Application state ── */
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Header />

      <div className="text-center pt-10 pb-6 px-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black">
          Humanize Text
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
          AI to human rewrite.
        </p>
      </div>

      <main
        className="flex flex-col md:flex-row flex-1 gap-4 px-4 sm:px-6 lg:px-10 pb-10 max-w-7xl mx-auto w-full"
        role="main"
      >
        <section className="flex-1 flex flex-col" aria-label="Input section">
          <InputPanel
            inputText={inputText}
            setInput={setInputText}
            onHumanize={handleHumanize}
            isLoading={isLoading}
          />
        </section>

        <div className="hidden md:flex flex-col items-center gap-2 pt-10">
          <div className="w-px flex-1 bg-black" />
          <span className="text-[10px] font-bold text-black uppercase tracking-widest rotate-90 my-2">
            output
          </span>
          <div className="w-px flex-1 bg-black" />
        </div>

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
