import type { ReactNode } from "react";

/** Shared modal shell + action row used by every admin editor dialog. */
export function Modal({
  title, onClose, children, size = "lg",
}: { title: string; onClose: () => void; children: ReactNode; size?: "md" | "lg" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full ${size === "md" ? "max-w-md" : "max-w-lg"} space-y-3 overflow-auto rounded-3xl bg-card p-6 shadow-2xl`}
      >
        <h3 className="text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({
  onCancel, onSave, cancelLabel, saveLabel,
}: { onCancel: () => void; onSave: () => void; cancelLabel: string; saveLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm">{cancelLabel}</button>
      <button onClick={onSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{saveLabel}</button>
    </div>
  );
}
