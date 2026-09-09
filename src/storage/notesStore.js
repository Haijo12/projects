// notesStore — isolated storage layer (swap for IndexedDB later without
// touching the rest of the app).

const STORAGE_KEY = "noteapp:notes:v1";
const DRAFT_KEY = "noteapp:draft:v1";

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

function loadNotes() {
  if (notesCache) return notesCache;
  const raw = safeGet(STORAGE_KEY);
  if (!raw) {
    notesCache = [];
    return notesCache;
  }
  try {
    const parsed = JSON.parse(raw);
    notesCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    notesCache = [];
  }
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

export function saveNote(note) {
  const notes = loadNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) {
    notes[idx] = note;
  } else {
    notes.push(note);
  }
  const result = persist();
  return result.ok ? note : null;
}

export function saveNotesBulk(list) {
  const notes = loadNotes();
  for (const incoming of list) {
    const idx = notes.findIndex((n) => n.id === incoming.id);
    if (idx >= 0) notes[idx] = incoming;
    else notes.push(incoming);
  }
  return persist();
}

export function deleteNotePermanently(id) {
  const notes = loadNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx >= 0) {
    notes.splice(idx, 1);
    persist();
    return true;
  }
  return false;
}

export function emptyTrash() {
  const notes = loadNotes();
  const kept = notes.filter((n) => !n.deletedAt);
  const removed = notes.length - kept.length;
  notesCache = kept;
  persist();
  return removed;
}

// ---- Draft recovery ----

export function saveDraft(noteId, content, title) {
  return safeSet(DRAFT_KEY, JSON.stringify({ noteId, content, title, at: Date.now() }));
}

export function loadDraft() {
  const raw = safeGet(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft() {
  return safeRemove(DRAFT_KEY);
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
  const r2 = safeRemove(DRAFT_KEY);
  notesCache = null;
  return r1.ok && r2.ok;
}
