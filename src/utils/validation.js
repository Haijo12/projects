// Validation for imports and note data

export function isValidNote(note) {
  return (
    note &&
    typeof note === "object" &&
    typeof note.id === "string" &&
    note.id.length > 0 &&
    typeof note.content === "string" &&
    (note.updatedAt === undefined || typeof note.updatedAt === "number")
  );
}

export function sanitizeNote(raw) {
  if (!isValidNote(raw)) return null;
  const now = Date.now();
  return {
    id: raw.id,
    title: typeof raw.title === "string" ? raw.title : "",
    content: raw.content,
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((t) => typeof t === "string").map(normalizeTag)
      : [],
    pinned: Boolean(raw.pinned),
    favorite: Boolean(raw.favorite),
    archived: Boolean(raw.archived),
    deletedAt: typeof raw.deletedAt === "number" ? raw.deletedAt : null,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

export function validateImportedNotes(data) {
  const result = { valid: [], invalid: 0 };
  let notes = [];

  if (Array.isArray(data)) {
    notes = data;
  } else if (data && Array.isArray(data.notes)) {
    notes = data.notes;
  } else {
    return { valid: [], invalid: 1 };
  }

  for (const raw of notes) {
    const clean = sanitizeNote(raw);
    if (clean) {
      result.valid.push(clean);
    } else {
      result.invalid++;
    }
  }
  return result;
}

function normalizeTag(tag) {
  const t = String(tag).trim();
  return t.startsWith("@") ? t : `@${t}`;
}
