/**
 * Header.jsx
 */

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-black bg-white">
      {/* ── Brand ── */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-black">
          Humane
        </span>
      </div>
    </header>
  );
}

