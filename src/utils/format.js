// Relative time formatting + content helpers

export function formatRelativeTime(timestamp, now = Date.now()) {
  if (!timestamp) return "";
  const diff = Math.max(0, now - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "just now";
  if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return mins === 1 ? "1 minute ago" : `${mins} minutes ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (diff < 7 * day) {
    const days = Math.floor(diff / day);
    return days === 1 ? "yesterday" : `${days} days ago`;
  }
  return formatDate(timestamp);
}

export function formatDate(timestamp) {
  const d = new Date(timestamp);
  const options = { month: "short", day: "numeric" };
  if (d.getFullYear() !== new Date().getFullYear()) options.year = "numeric";
  return d.toLocaleDateString(undefined, options);
}

// Derive display title from content: first "# heading", else first meaningful line
export function deriveTitleFromContent(content) {
  if (!content) return "";
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      return trimmed.replace(/^#+\s*/, "").trim();
    }
    return trimmed;
  }
  return "";
}

// Short plain-text preview for the notes LIST (display only — stored note
// content is never modified). Skips the leading heading/title line and strips
// markdown syntax so "## Saving Test" previews as "Saving Test…".
export function derivePreview(content, title = "", maxLen = 120) {
  if (!content) return "";
  const lines = content.split("\n").map((l) => l.trim());
  let i = 0;
  // Skip a leading heading and a line identical to the title
  if (lines[i] && lines[i].startsWith("#")) i++;
  if (title && lines[i] === title.trim()) i++;
  let text = lines
    .slice(i)
    .filter(Boolean)
    .join(" ")
    .replace(/!\w+ /g, "") // callouts (!info etc.)
    .replace(/\[\[([^\[\]]+)\]\]/g, "$1") // wikilinks
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1") // links
    .replace(/^#+\s*/gm, "") // headings
    .replace(/^>\s?/gm, "") // quotes
    .replace(/^[-*+]\s+/gm, "") // list bullets
    .replace(/^\d+\.\s+/gm, "") // numbered lists
    .replace(/\[\s*[xX]?\s*\]\s?/g, "") // task boxes
    .replace(/\*\*|__|~~|==|`/g, "") // emphasis markers
    .trim();
  if (text.length > maxLen) text = text.slice(0, maxLen).trimEnd() + "…";
  return text;
}

export function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countCharacters(text) {
  return text ? text.length : 0;
}

export function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
