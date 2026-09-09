// Tag helpers: @tag syntax

const TAG_RE = /(^|[\s(])@([a-zA-Z0-9_-]+)/g;

export function extractTags(content) {
  if (!content) return [];
  const tags = new Set();
  let match;
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(content)) !== null) {
    tags.add("@" + match[2].toLowerCase());
  }
  return [...tags];
}

export function normalizeTag(tag) {
  const t = String(tag).trim().toLowerCase();
  if (!t) return "";
  return t.startsWith("@") ? t : `@${t}`;
}

export function getAllTags(notes) {
  const counts = new Map();
  for (const note of notes) {
    for (const tag of note.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function filterByTag(notes, tag) {
  if (!tag) return notes;
  const t = normalizeTag(tag);
  return notes.filter((n) => (n.tags || []).includes(t));
}
