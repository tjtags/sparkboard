export function Mark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#0B0E14" />
      <path
        d="M16 2.4 18.2 13.8 29.6 16 18.2 18.2 16 29.6 13.8 18.2 2.4 16 13.8 13.8Z"
        fill="#E8B86D"
      />
      <path
        d="M16 7.2 17.15 14.85 24.8 16 17.15 17.15 16 24.8 14.85 17.15 7.2 16 14.85 14.85Z"
        fill="#C4783A"
      />
      <path d="M16 13.4 18.6 16 16 18.6 13.4 16Z" fill="#0B0E14" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Mark className={compact ? "h-6 w-6" : "h-8 w-8"} />
      <span className="display text-[1.15rem] leading-none tracking-tight">
        Spark<span className="text-spark">board</span>
      </span>
    </span>
  );
}
