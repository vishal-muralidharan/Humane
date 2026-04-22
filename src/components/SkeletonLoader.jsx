/**
 * SkeletonLoader.jsx
 * ──────────────────
 * Pulsing skeleton shown in the OutputPanel while the mock API is running.
 * Uses the .skeleton-shimmer CSS class defined in index.css for the animated
 * gradient sweep — no extra library needed.
 *
 * The varying widths (w-full / w-4/5 / w-3/5) mimic realistic text lines
 * so the UI doesn't feel like a generic "loading…" message.
 */
export default function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-3 w-full mt-1" aria-label="Loading result…" role="status">
      {/* Simulate ~7 text lines of varying length */}
      {[100, 90, 100, 75, 100, 85, 60].map((widthPct, i) => (
        <div
          key={i}
          className="h-4 skeleton-shimmer"
          style={{ width: `${widthPct}%` }}
        />
      ))}

      {/* A slightly taller block to simulate a paragraph break */}
      <div className="h-4 skeleton-shimmer mt-2" style={{ width: '95%' }} />
      <div className="h-4 skeleton-shimmer" style={{ width: '80%' }} />
      <div className="h-4 skeleton-shimmer" style={{ width: '65%' }} />
    </div>
  );
}
