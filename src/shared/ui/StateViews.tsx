import type { ReactNode } from "react";

/**
 * Standardised loading / empty / error / info surfaces.
 * Uses the exact dashed-border styling the app already had, so nothing
 * changes visually — it is just no longer duplicated in a dozen places.
 */
function Frame({ children, padding = "p-8", role }: { children: ReactNode; padding?: string; role?: string }) {
  return (
    <div
      className={`rounded-xl border border-dashed border-border ${padding} text-center text-sm text-muted-foreground`}
      role={role}
      aria-live={role === "status" ? "polite" : undefined}
    >
      {children}
    </div>
  );
}

export function LoadingState({ label, compact }: { label: string; compact?: boolean }) {
  return <Frame padding={compact ? "p-3" : "p-8"} role="status">{label}</Frame>;
}

export function EmptyState({ label, compact }: { label: string; compact?: boolean }) {
  return <Frame padding={compact ? "p-3" : "p-12"}>{label}</Frame>;
}

export function InfoState({ label, compact }: { label: string; compact?: boolean }) {
  return <Frame padding={compact ? "p-3" : "p-8"}>{label}</Frame>;
}

export function ErrorState({ label, onRetry, retryLabel }: { label: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-destructive/40 p-8 text-center text-sm text-destructive">
      <div>{label}</div>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary">
          {retryLabel || "↻"}
        </button>
      )}
    </div>
  );
}
