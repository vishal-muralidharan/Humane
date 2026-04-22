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

function getTier(score) {
  if (score <= 15) return { label: 'Human',    ring: 'border-emerald-500/50', dot: 'bg-emerald-400', text: 'text-emerald-300' };
  if (score <= 40) return { label: 'Moderate', ring: 'border-amber-500/50',  dot: 'bg-amber-400',   text: 'text-amber-300'  };
  return                  { label: 'Detected', ring: 'border-red-500/50',    dot: 'bg-red-400',     text: 'text-red-300'    };
}

export default function DetectionBadge({ score = 4 }) {
  const { ring, dot, text } = getTier(score);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-900 text-xs font-semibold ${ring} ${text}`}
      title="Simulated AI detection score — wire up a real detector in Phase 2"
    >
      {/* Pulsing coloured dot */}
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
      <ShieldCheck size={13} strokeWidth={2.2} />
      AI Likelihood: {score}%
    </div>
  );
}
