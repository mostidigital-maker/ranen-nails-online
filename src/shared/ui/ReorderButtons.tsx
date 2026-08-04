import { ArrowUp, ArrowDown } from "lucide-react";

export function ReorderButtons({
  onUp, onDown, disabledUp, disabledDown,
}: { onUp: () => void; onDown: () => void; disabledUp?: boolean; disabledDown?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <button onClick={onUp} disabled={disabledUp} aria-label="↑" className="rounded-md border border-border p-1 disabled:opacity-30 hover:border-primary">
        <ArrowUp className="h-3 w-3" />
      </button>
      <button onClick={onDown} disabled={disabledDown} aria-label="↓" className="rounded-md border border-border p-1 disabled:opacity-30 hover:border-primary">
        <ArrowDown className="h-3 w-3" />
      </button>
    </div>
  );
}
