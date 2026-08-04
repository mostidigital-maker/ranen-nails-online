import type { AppointmentStatus } from "@/shared/types/common";

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export function StatusBadge({ status, label }: { status: AppointmentStatus; label: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[status]}`}>{label}</span>;
}

export function ActiveBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  if (active) return <span className="text-xs text-muted-foreground">{activeLabel}</span>;
  return <span className="text-xs text-destructive">{inactiveLabel}</span>;
}

export function ToggleButton({ active, onToggle, enableLabel, disableLabel, className = "" }: {
  active: boolean; onToggle: () => void; enableLabel: string; disableLabel: string; className?: string;
}) {
  return (
    <button onClick={onToggle} className={`rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary ${className}`}>
      {active ? disableLabel : enableLabel}
    </button>
  );
}
