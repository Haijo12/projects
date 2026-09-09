// notesStore — isolated storage layer (swap for IndexedDB later without
// touching the rest of the app).
//
// Data-safety rules:
// - Copy-on-write: every mutation REPLACES the cached array with a new one.
//   React subscribers always receive a fresh reference, so state updates are
//   reliable and stored data is never mutated in place.
// - Malformed stored data is sanitized into valid notes (and the raw payload
//   is preserved under a recovery key) instead of crashing or being wiped.
// - Drafts are stored per note, so one note's recovery net is never destroyed
//   by editing another note.
// - Nothing here clears data on init.

const STORAGE_KEY = "noteapp:notes:v1";
const CORRUPT_KEY = "noteapp:notes:corrupt:v1";
const DRAFTS_KEY = "noteapp:drafts:v1"; // { [noteId]: { noteId, content, title, at } }
const LEGACY_DRAFT_KEY = "noteapp:draft:v1"; // older single-slot draft
const MAX_DRAFTS = 10;

let notesCache = null;
const listeners = new Set();

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("Storage read failed:", e);
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (e) {
    console.warn("Storage write failed:", e);
    return { ok: false, error: e };
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Coerce an arbitrary stored object into a valid note, preserving unknown
// extra fields (forward compatibility).
function sanitizeNote(raw, seenIds) {
  const base = raw && typeof raw === "object" ? raw : {};
  let id = typeof base.id === "string" && base.id ? base.id : "";
  if (!id || seenIds.has(id)) id = generateId();
  seenIds.add(id);
  const now = Date.now();
  const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : now);
  return {
    ...base,
    id,
    title: typeof base.title === "string" ? base.title : "",
    content: typeof base.content === "string" ? base.content : "",
    tags: Array.isArray(base.tags) ? base.tags.filter((t) => typeof t === "string") : [],
    pinned: Boolean(base.pinned),
    favorite: Boolean(base.favorite),
    archived: Boolean(base.archived),
    deletedAt: typeof base.deletedAt === "number" ? base.deletedAt : null,
    createdAt: num(base.createdAt),
    updatedAt: num(base.updatedAt),
    metadata: base.metadata && typeof base.metadata === "object" ? base.metadata : {},
  };
}

function loadNotes() {
  if (notesCache) return notesCache;
  const raw = safeGet(STORAGE_KEY);
  if (!raw) {
    notesCache = [];
    return notesCache;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Keep the unreadable payload so nothing is silently destroyed.
    safeSet(CORRUPT_KEY, raw);
    console.warn("Stored notes were unreadable; raw payload kept under", CORRUPT_KEY);
    notesCache = [];
    return notesCache;
  }
  if (!Array.isArray(parsed)) {
    safeSet(CORRUPT_KEY, raw);
    notesCache = [];
    return notesCache;
  }
  const seen = new Set();
  notesCache = parsed.map((n) => sanitizeNote(n, seen));
  return notesCache;
}

function persist() {
  const result = safeSet(STORAGE_KEY, JSON.stringify(notesCache));
  if (!result.ok) {
    notify({ kind: "storage-error", error: result.error });
  }
  return result;
}

function notify(event) {
  for (const fn of listeners) {
    try {
      fn(event);
    } catch {
      // listener errors must not break storage
    }
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAllNotes() {
  return loadNotes();
}

export function getNote(id) {
  return loadNotes().find((n) => n.id === id) || null;
}

// Replace-or-insert one note. Returns the saved note, or null when the write
// failed (e.g. quota exceeded) so callers can surface the failure.
export function saveNote(note) {
  const notes = loadNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  const next = notes.slice(); // copy-on-write
  if (idx >= 0) next[idx] = note;
  else next.push(note);
  notesCache = next;
  const result = persist();
  if (result.ok) notify({ kind: "notes" });
  return result.ok ? note : null;
}

export function saveNotesBulk(list) {
  const notes = loadNotes();
  const next = notes.slice();
  for (const incoming of list) {
    const idx = next.findIndex((n) => n.id === incoming.id);
    if (idx >= 0) next[idx] = incoming;
    else next.push(incoming);
  }
  notesCache = next;
  const result = persist();
  if (result.ok) notify({ kind: "notes" });
  return result;
}

export function deleteNotePermanently(id) {
  const notes = loadNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx < 0) return false;
  notesCache = notes.filter((n) => n.id !== id); // copy-on-write
  persist();
  notify({ kind: "notes" });
  return true;
}

export function emptyTrash() {
  const notes = loadNotes();
  const kept = notes.filter((n) => !n.deletedAt);
  const removed = notes.length - kept.length;
  if (removed === 0) return 0;
  notesCache = kept;
  persist();
  notify({ kind: "notes" });
  return removed;
}

// ---- Draft recovery (per note) ----

let draftsCache;

function loadDrafts() {
  if (draftsCache) return draftsCache;
  let map = {};
  const raw = safeGet(DRAFTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) map = parsed;
    } catch {
      map = {};
    }
  }
  // Migrate the older single-slot draft so existing recovery nets survive.
  const legacy = safeGet(LEGACY_DRAFT_KEY);
  if (legacy) {
    try {
      const d = JSON.parse(legacy);
      if (d && typeof d.noteId === "string" && typeof d.content === "string") {
        if (!map[d.noteId] || (map[d.noteId].at || 0) < (d.at || 0)) {
          map[d.noteId] = { noteId: d.noteId, content: d.content, title: d.title ?? null, at: d.at || Date.now() };
        }
      }
    } catch {
      // ignore unreadable legacy draft
    }
    safeRemove(LEGACY_DRAFT_KEY);
  }
  draftsCache = map;
  return map;
}

function persistDrafts() {
  const map = draftsCache || {};
  // Keep only the most recent drafts so the key can't grow unbounded.
  const entries = Object.values(map).sort((a, b) => (b.at || 0) - (a.at || 0));
  const kept = {};
  for (const d of entries.slice(0, MAX_DRAFTS)) kept[d.noteId] = d;
  draftsCache = kept;
  safeSet(DRAFTS_KEY, JSON.stringify(kept));
}

export function saveDraft(noteId, content, title) {
  if (!noteId) return { ok: false };
  const drafts = loadDrafts();
  drafts[noteId] = { noteId, content, title: title ?? null, at: Date.now() };
  persistDrafts();
  return { ok: true };
}

// Returns the recovery draft for one note, or null.
export function loadDraft(noteId) {
  if (!noteId) return null;
  const d = loadDrafts()[noteId];
  if (!d || typeof d.content !== "string") return null;
  return d;
}

export function clearDraft(noteId) {
  if (!noteId) return { ok: true };
  const drafts = loadDrafts();
  if (!(noteId in drafts)) return { ok: true };
  delete drafts[noteId];
  persistDrafts();
  return { ok: true };
}

// ---- Storage info / danger zone ----

export function getStorageInfo() {
  let bytes = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    bytes = raw ? raw.length : 0;
  } catch {
    bytes = 0;
  }
  return { notes: loadNotes().length, bytes };
}

export function clearAllData() {
  const r1 = safeRemove(STORAGE_KEY);
  const r2 = safeRemove(DRAFTS_KEY);
  safeRemove(LEGACY_DRAFT_KEY);
  safeRemove(CORRUPT_KEY);
  notesCache = null;
  draftsCache = null;
  return r1.ok && r2.ok;
}
