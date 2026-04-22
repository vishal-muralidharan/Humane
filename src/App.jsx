/**
 * App.jsx — AI Text Humanizer (Phase 1 MVP)
 * ==========================================
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
 * API contract (Phase 1 — MOCK):
 *   handleHumanize simulates a 3-second network delay and then sets a
 *   fixed dummy string as the output. Replace the setTimeout block with
 *   a real fetch() call to your Node.js backend in Phase 2.
 */

import { useState } from 'react';
import Header      from './components/Header';
import InputPanel  from './components/InputPanel';
import OutputPanel from './components/OutputPanel';

/* ── Dummy response shown while the real backend is not yet wired up ── */
const MOCK_RESPONSE = `You know, when I first started thinking about this, I wasn't entirely sure \
where I'd land. But the more I turned it over in my mind, the clearer it became: the way \
artificial intelligence is evolving isn't just a technical story — it's fundamentally a human one.

There's something almost paradoxical about it. We build these systems to think on our behalf, \
and then we find ourselves working overtime to make them sound less like systems. The irony \
isn't lost on me.

Still, I think that tension is worth sitting with rather than rushing past. It tells us \
something important about what we actually value in communication — not just the transfer of \
information, but the sense of a person on the other end. Warmth. Doubt. A little imperfection. \
The feeling that someone genuinely thought about what they were saying, rather than generating \
it at speed.

That's what good writing has always done. And perhaps that's exactly what we should keep in mind \
as these tools become more capable: the goal isn't to hide the machine, but to remember why \
the human touch mattered in the first place.`;

export default function App() {
  /* ── Application state ── */
  const [inputText,  setInputText]  = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState(null);

  /**
   * handleHumanize
   * ──────────────
   * Phase 1: simulates a backend call with a 3-second setTimeout.
   *
   * Phase 2 replacement — swap the setTimeout block for:
   *
   *   const response = await fetch('/api/humanize', {
   *     method:  'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body:    JSON.stringify({ text: inputText }),
   *   });
   *   if (!response.ok) throw new Error('Server error: ' + response.status);
   *   const data = await response.json();
   *   setOutputText(data.humanizedText);
   */
  async function handleHumanize() {
    if (!inputText.trim()) return;

    // Reset previous output / error and enter loading state
    setIsLoading(true);
    setOutputText('');
    setError(null);

    try {
      // ── MOCK: replace this block with a real fetch() in Phase 2 ──
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setOutputText(MOCK_RESPONSE);
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
