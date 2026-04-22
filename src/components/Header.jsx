/**
 * Header.jsx
 */

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md">
      {/* ── Brand ── */}
      <div className="flex items-center gap-2 group cursor-pointer transition-opacity hover:opacity-80">
        <span className="text-xl font-medium tracking-tight text-zinc-100">
          Humane
        </span>
      </div>
    </header>
  );
}

