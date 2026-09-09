// Import/export utilities: JSON backup, per-note markdown, and import with validation

import { getAllNotes, saveNotesBulk } from "./notesStore.js";
import { validateImportedNotes, sanitizeNote } from "../utils/validation.js";
import { extractTags } from "../utils/tags.js";
import { generateId } from "../utils/format.js";

export function exportAllNotesJson() {
  const notes = getAllNotes();
  const payload = {
    app: "personal-note-app",
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJsonBackup() {
  const json = exportAllNotesJson();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportNoteMarkdown(note) {
  const tags = (note.tags || []).join(" ");
  const lines = [];
  if (note.title) lines.push(`# ${note.title}`, "");
  lines.push(note.content);
  if (tags) lines.push("", tags);
  return lines.join("\n");
}

export function exportNotePlainText(note) {
  return note.content;
}

export function downloadTextFile(text, filename, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Parse uploaded file content into notes (JSON, or markdown/text)
export function parseImportFile(text, filename) {
  const trimmed = text.trim();
  if (!trimmed) return { notes: [], invalid: 1 };

  if (filename.endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const data = JSON.parse(trimmed);
      const { valid, invalid } = validateImportedNotes(data);
      return { notes: valid, invalid };
    } catch {
      return { notes: [], invalid: 1 };
    }
  }

  // Markdown/text: split into notes on `# ` top-level headings, or one note per file
  const notes = [];
  const now = Date.now();
  const sections = trimmed.split(/^# /m).filter((s) => s.trim());

  if (sections.length > 1) {
    for (const section of sections) {
      const nl = section.indexOf("\n");
      const title = (nl === -1 ? section : section.slice(0, nl)).trim().slice(0, 120);
      const content = nl === -1 ? "" : section.slice(nl + 1).trim();
      if (!content && !title) continue;
      notes.push(
        sanitizeNote({
          id: generateId(),
          title: title || "Untitled Note",
          content: `# ${title}\n\n${content}`,
          tags: extractTags(content),
          createdAt: now,
          updatedAt: now,
        }) || {
          id: generateId(),
          title: title || "Untitled Note",
          content: `# ${title}\n\n${content}`,
          tags: extractTags(content),
          createdAt: now,
          updatedAt: now,
        }
      );
    }
  } else {
    const title = filename.replace(/\.(md|markdown|txt)$/i, "").slice(0, 120) || "Imported Note";
    notes.push(
      sanitizeNote({
        id: generateId(),
        title,
        content: trimmed,
        tags: extractTags(trimmed),
        createdAt: now,
        updatedAt: now,
      }) || {
        id: generateId(),
        title,
        content: trimmed,
        tags: extractTags(trimmed),
        createdAt: now,
        updatedAt: now,
      }
    );
  }

  return { notes: notes.filter(Boolean), invalid: 0 };
}

// Merge imported notes without overwriting existing ones.
// Same id: keep newer updatedAt. Returns { imported, skipped }.
export function mergeImportedNotes(incoming) {
  const existing = getAllNotes();
  const byId = new Map(existing.map((n) => [n.id, n]));
  let imported = 0;
  let skipped = 0;

  const toAdd = [];
  for (const note of incoming) {
    const current = byId.get(note.id);
    if (!current) {
      toAdd.push(note);
      imported++;
    } else if (note.updatedAt > current.updatedAt) {
      toAdd.push(note);
      imported++;
    } else {
      skipped++;
    }
  }

  if (toAdd.length > 0) {
    const result = saveNotesBulk(toAdd);
    if (!result.ok) {
      return { imported: 0, skipped: incoming.length, error: result.error };
    }
  }

  return { imported, skipped };
}
