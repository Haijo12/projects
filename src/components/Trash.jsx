import { useState } from "react";
import EmptyState from "./EmptyState.jsx";
import ConfirmDialog from "./Dialog.jsx";

export default function Trash({ notes, onRestore, onDeletePermanent, onEmptyTrash, onBack }) {
  const [confirmTarget, setConfirmTarget] = useState(null); // note id or "empty"

  if (notes.length === 0) {
    return (
      <div className="screen">
        <header className="sticky-header safe-top">
          <div className="app-header">
            <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
              ←
            </button>
            <h1>Trash</h1>
            <span style={{ width: 44 }} />
          </div>
        </header>
        <EmptyState icon="🗑" title="Trash is empty" hint="Deleted notes appear here first." />
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="sticky-header safe-top">
        <div className="app-header">
          <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
            ←
          </button>
          <h1>Trash</h1>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ minHeight: 44 }}
            onClick={() => setConfirmTarget("empty")}
          >
            Empty
          </button>
        </div>
      </header>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="note-list">
          {notes.map((note) => (
            <div key={note.id} className="note-card trash-note">
              <div className="note-card-title">
                <span>{note.title || "Untitled Note"}</span>
              </div>
              <div className="note-card-meta">
                <span>Deleted recently</span>
                <span style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    className="action-btn"
                    aria-label={`Restore ${note.title || "note"}`}
                    onClick={() => onRestore(note.id)}
                  >
                    ♻️
                  </button>
                  <button
                    type="button"
                    className="action-btn danger"
                    aria-label={`Permanently delete ${note.title || "note"}`}
                    onClick={() => setConfirmTarget(note.id)}
                  >
                    ✕
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget === "empty" ? "Empty trash?" : "Delete permanently?"}
        message={
          confirmTarget === "empty"
            ? "All notes in trash will be permanently deleted. This cannot be undone."
            : "This note will be permanently deleted. This cannot be undone."
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (confirmTarget === "empty") onEmptyTrash();
          else if (confirmTarget) onDeletePermanent(confirmTarget);
          setConfirmTarget(null);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
