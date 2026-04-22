/**
 * Header.jsx
 * ──────────
 * Sticky top bar with brand identity.
 * Kept intentionally minimal so the split-panel gets maximum vertical space.
 */

import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      {/* ── Brand ── */}
      <div className="flex items-center gap-2">
        <Sparkles className="text-violet-400" size={22} strokeWidth={1.8} />
        <span className="text-lg font-semibold tracking-tight text-white">
          Humane
          <span className="text-violet-400">AI</span>
        </span>
      </div>

      {/* ── Tagline / Phase badge ── */}
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        MVP — Phase 1
      </span>
    </header>
  );
}
