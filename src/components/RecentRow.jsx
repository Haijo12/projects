import { useMemo } from "react";
import { History, FileText } from "lucide-react";
import { getRecents } from "../storage/recentsStore.js";
import { formatRelativeTime } from "../utils/format.js";

// Horizontal row of recently opened notes — one-tap jump-back shortcuts.
// Reads raw { id, at } entries from recentsStore and resolves them against the
// live notes list, so deleted notes disappear automatically and titles/times
// always reflect the latest edits.
export default function RecentRow({ notes, onOpenNote }) {
  const recentNotes = useMemo(() => {
    const byId = new Map(notes.map((n) => [n.id, n]));
    return getRecents()
      .map((r) => byId.get(r.id))
      .filter((n) => n && !n.deletedAt);
  }, [notes]);

  if (recentNotes.length === 0) return null;

  return (
    <section className="recent-section" aria-label="Recently opened notes">
      <div className="recent-label">
        <History size={13} />
        Recent
      </div>
      <div className="recent-row">
        {recentNotes.map((note) => (
          <button
            key={note.id}
            type="button"
            className="recent-card"
            aria-label={`Open recent note ${note.title || "Untitled"}`}
            onClick={() => onOpenNote(note)}
          >
            <span className="recent-card-icon" aria-hidden="true">
              <FileText size={16} />
            </span>
            <span className="recent-card-title">{note.title || "Untitled Note"}</span>
            <span className="recent-card-time">{formatRelativeTime(note.updatedAt)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
