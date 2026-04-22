/**
 * DetectionBadge.jsx
 * ──────────────────
 * Displays a simulated "AI Likelihood" bypass score as a coloured pill.
 * The colour tier is derived from the score value:
 *   ≤ 15%  → green  (great — very human-like)
 *   ≤ 40%  → amber  (moderate)
 *   > 40%  → red    (still detectable)
 *
 * Props:
 *   score {number} — percentage as an integer (e.g. 4)
 */

import { ShieldCheck } from 'lucide-react';

export default function DetectionBadge({ score = 4 }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-[#111113] text-zinc-400 text-[11px] uppercase tracking-widest font-medium"
      title="Simulated AI detection score"
    >
      <ShieldCheck size={14} strokeWidth={2} className="text-zinc-500" />
      Score {score}%
    </div>
  );
}
