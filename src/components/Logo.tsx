export function Mark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" fill="#07090c" />
      <path d="M16 3 18 14 29 16 18 18 16 29 14 18 3 16 14 14Z" fill="#7CFFCB" />
      <rect x="14.2" y="14.2" width="3.6" height="3.6" transform="rotate(45 16 16)" fill="#07090c" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Mark className={compact ? "h-5 w-5" : "h-6 w-6"} />
      <span className="text-[13px] tracking-[0.28em] text-spark">
        SPARK<span className="text-paper">BOARD</span>
      </span>
    </span>
  );
}
