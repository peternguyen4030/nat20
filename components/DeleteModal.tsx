"use client";

import { useState } from "react";

interface DeleteModalProps {
  // What is being deleted — shown in the warning message
  label:       string;
  // The exact text the user must type to confirm (usually the name of the thing)
  confirmText: string;
  // Warning message shown below the label
  warning?:    string;
  onClose:     () => void;
  onConfirm:   () => Promise<void>;
}

export function DeleteModal({
  label, confirmText, warning, onClose, onConfirm,
}: DeleteModalProps) {
  const [input,    setInput]    = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const confirmed = input.trim() === confirmText.trim();

  async function handleDelete() {
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-sketch">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h2 className="font-display text-2xl text-ink">Delete {label}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:text-ink hover:border-blush transition-all flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Warning */}
          <div className="bg-blush/10 border border-blush/30 rounded-sketch px-4 py-3 space-y-1">
            <p className="font-sans text-sm font-semibold text-blush">
              This action cannot be undone.
            </p>
            {warning && (
              <p className="font-sans text-xs text-ink-soft leading-relaxed">{warning}</p>
            )}
          </div>

          {/* Typed confirmation */}
          <div>
            <label className="block font-sans text-xs text-ink-soft leading-relaxed mb-2">
              Type <strong className="font-bold text-ink font-mono">{confirmText}</strong> to confirm:
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && confirmed && handleDelete()}
              placeholder={confirmText}
              autoFocus
              className={`w-full font-sans text-base bg-parchment text-ink border-2 rounded-input px-3 py-2.5 outline-none transition-colors placeholder:text-ink-faded ${
                input.length > 0
                  ? confirmed
                    ? "border-blush focus:border-blush"
                    : "border-blush/40 focus:border-blush/60"
                  : "border-sketch focus:border-blush"
              }`}
            />
            {input.length > 0 && !confirmed && (
              <p className="font-sans text-xs text-ink-faded mt-1">
                Keep typing — doesn't match yet
              </p>
            )}
            {confirmed && (
              <p className="font-sans text-xs text-sage mt-1">✓ Confirmed</p>
            )}
          </div>

          {error && (
            <div className="bg-blush/10 border border-blush/30 rounded-input px-3 py-2">
              <p className="font-sans text-sm text-blush">✗ {error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch px-4 py-2 bg-parchment hover:bg-paper shadow-sketch transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className={`font-sans font-bold text-sm rounded-sketch px-5 py-2 border-2 transition-all flex items-center gap-2 ${
              confirmed && !deleting
                ? "bg-blush border-blush text-white shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
                : "bg-tan border-sketch text-ink-faded opacity-50 cursor-not-allowed"
            }`}
          >
            {deleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-ink-faded border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : `Delete ${label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
