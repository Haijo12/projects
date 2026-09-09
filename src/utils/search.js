// Fast local search over notes

export function searchNotes(notes, query) {
  if (!query || !query.trim()) return notes;
  const q = query.toLowerCase().trim();

  return notes
    .map((note) => {
      const titleMatch = note.title.toLowerCase().includes(q) ? 10 : 0;
      const tagMatch =
        note.tags.some((t) => t.toLowerCase().includes(q)) ? 5 : 0;
      const idx = note.content.toLowerCase().indexOf(q);
      const contentMatch = idx !== -1 ? 1 : 0;
      const score = titleMatch + tagMatch + contentMatch;
      return { note, score, idx };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.note.updatedAt - a.note.updatedAt)
    .map((r) => r.note);
}

export function countMatches(note, query) {
  if (!query || !query.trim()) return 0;
  const q = query.toLowerCase().trim();
  const haystack = (note.title + " " + note.content + " " + note.tags.join(" ")).toLowerCase();
  let count = 0;
  let pos = haystack.indexOf(q);
  while (pos !== -1) {
    count++;
    pos = haystack.indexOf(q, pos + q.length);
  }
  return count;
}

// Split text into highlight parts for display
export function highlightParts(text, query) {
  if (!query || !query.trim() || !text) return [{ text, match: false }];
  const q = query.toLowerCase().trim();
  const lower = text.toLowerCase();
  const parts = [];
  let i = 0;
  let pos = lower.indexOf(q);
  while (pos !== -1 && parts.length < 8) {
    if (pos > i) parts.push({ text: text.slice(i, pos), match: false });
    parts.push({ text: text.slice(pos, pos + q.length), match: true });
    i = pos + q.length;
    pos = lower.indexOf(q, i);
  }
  if (i < text.length) parts.push({ text: text.slice(i), match: false });
  return parts;
}
