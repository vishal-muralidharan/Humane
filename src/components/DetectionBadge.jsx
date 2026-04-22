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
      className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-white text-black text-xs font-bold"
      title="Simulated AI detection score"
    >
      <ShieldCheck size={13} strokeWidth={2.2} />
      AI Likelihood: {score}%
    </div>
  );
}
