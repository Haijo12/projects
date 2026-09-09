// Backup helpers: trash retention cleanup + full markdown bundle

import { getAllNotes, deleteNotePermanently } from "./notesStore.js";
import { exportNoteMarkdown } from "./importExport.js";

export function purgeExpiredTrash(retentionDays) {
  if (!retentionDays || retentionDays <= 0) return 0;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const notes = getAllNotes();
  let purged = 0;
  for (const note of notes) {
    if (note.deletedAt && note.deletedAt < cutoff) {
      deleteNotePermanently(note.id);
      purged++;
    }
  }
  return purged;
}

export function buildMarkdownBundle() {
  const notes = getAllNotes()
    .filter((n) => !n.deletedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return notes
    .map((n) => exportNoteMarkdown(n))
    .join("\n\n---\n\n");
}
