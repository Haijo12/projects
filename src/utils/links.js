// Internal [[wiki links]] and backlinks

const WIKILINK_RE = /\[\[([^\[\]]+)\]\]/g;

export function extractLinkTitles(content) {
  if (!content) return [];
  const titles = new Set();
  let m;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(content)) !== null) {
    const t = m[1].trim();
    if (t) titles.add(t);
  }
  return [...titles];
}

// Map of normalized title -> note
export function buildTitleIndex(notes) {
  const index = new Map();
  for (const note of notes) {
    const key = note.title.trim().toLowerCase();
    if (key) index.set(key, note);
  }
  return index;
}

// Find notes whose content links to the given note title
export function findBacklinks(note, allNotes) {
  if (!note || !note.title) return [];
  const target = note.title.trim().toLowerCase();
  return allNotes.filter((other) => {
    if (other.id === note.id) return false;
    if (other.deletedAt) return false;
    const titles = extractLinkTitles(other.content);
    return titles.some((t) => t.toLowerCase() === target);
  });
}
