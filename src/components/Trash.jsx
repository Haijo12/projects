import { useState } from "react";
import { useEntryAnimation } from "../hooks/useEntryAnimation.js";
import EmptyState from "./EmptyState.jsx";
import ConfirmDialog from "./Dialog.jsx";
import { BackIcon, RestoreIcon, TrashIcon } from "./icons.jsx";
import { formatRelativeTime } from "../utils/format.js";

export default function Trash({ notes, onRestore, onDeletePermanent, onEmptyTrash, onBack }) {
  const [confirmTarget, setConfirmTarget] = useState(null); // note id or "empty"
  const entryAnim = useEntryAnimation();

  if (notes.length === 0) {
    return (
      <div className="screen">
        <header className="sticky-header safe-top">
          <div className="app-header">
            <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
              <BackIcon />
            </button>
            <h1>Trash</h1>
            <span className="header-spacer" />
          </div>
        </header>
        <EmptyState icon={<TrashIcon size={44} strokeWidth={1.5} />} title="Trash is empty" hint="Deleted notes appear here first." />
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="sticky-header safe-top">
        <div className="app-header">
          <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
            <BackIcon />
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
      <div className="screen-scroll">
        <div className={`note-list${entryAnim ? " list-enter" : ""}`}>
          {notes.map((note, idx) => (
            <div
              key={note.id}
              className="note-item trash-note"
              style={entryAnim ? { "--i": idx } : undefined}
            >
              <div className="note-item-title">
                <span className="note-item-title-text">{note.title || "Untitled Note"}</span>
              </div>
              <div className="note-item-meta">
                <span>Deleted {formatRelativeTime(note.deletedAt)}</span>
                <span className="trash-row-actions">
                  <button
                    type="button"
                    className="action-btn"
                    aria-label={`Restore ${note.title || "note"}`}
                    onClick={() => onRestore(note.id)}
                  >
                    <RestoreIcon />
                  </button>
                  <button
                    type="button"
                    className="action-btn danger"
                    aria-label={`Permanently delete ${note.title || "note"}`}
                    onClick={() => setConfirmTarget(note.id)}
                  >
                    <TrashIcon />
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
