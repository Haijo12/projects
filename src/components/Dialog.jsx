import { useEffect } from "react";
import { useDelayedUnmount } from "../hooks/useDelayedUnmount.js";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  const overlay = useDelayedUnmount(open, 160);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!overlay.mounted) return null;

  return (
    <div
      className={`dialog-backdrop${overlay.closing ? " backdrop--out" : ""}`}
      onClick={onCancel}
      role="presentation"
    >
      <div
        className={`dialog${overlay.closing ? " dialog--out" : ""}`}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
