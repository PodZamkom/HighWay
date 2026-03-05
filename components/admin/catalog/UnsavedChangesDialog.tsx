"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onDiscardAndContinue: () => void;
  onSaveAndContinue: () => void;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selectors = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ];

  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(","))).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

export function UnsavedChangesDialog({
  open,
  saving,
  onCancel,
  onDiscardAndContinue,
  onSaveAndContinue,
}: UnsavedChangesDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = getFocusable(dialog);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const currentFocusable = getFocusable(dialog);
      if (currentFocusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !dialog.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeElement === last || !dialog.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
        aria-describedby="unsaved-dialog-description"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-900 p-5 shadow-2xl shadow-black/60"
      >
        <h3 id="unsaved-dialog-title" className="text-lg font-bold text-white">
          Есть несохраненные изменения
        </h3>
        <p id="unsaved-dialog-description" className="mt-2 text-sm text-zinc-400">
          Перед переходом сохраните изменения или отбросьте их.
        </p>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold text-zinc-200 hover:border-white/35"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onDiscardAndContinue}
            className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-sm font-semibold text-rose-200 hover:border-rose-300/70"
          >
            Сбросить и перейти
          </button>
          <button
            type="button"
            onClick={onSaveAndContinue}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Сохранить и перейти
          </button>
        </div>
      </div>
    </div>
  );
}
