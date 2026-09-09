// recentsStore — tracks recently opened notes so the home screen can offer
// one-tap jump-back shortcuts.
//
// Same data-safety rules as notesStore: localStorage access is guarded,
// the cache is replaced (not mutated) on writes, and the stored payload is
// validated on load so a corrupt value can never crash the app.

export const RECENTS_KEY = "noteapp:recents:v1";
const MAX_RECENTS = 8;

let recentsCache = null;

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function load() {
  if (recentsCache) return recentsCache;
  const raw = safeGet(RECENTS_KEY);
  recentsCache = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        recentsCache = parsed
          .filter((r) => r && typeof r.id === "string")
          .map((r) => ({ id: r.id, at: typeof r.at === "number" ? r.at : 0 }));
      }
    } catch {
      recentsCache = [];
    }
  }
  return recentsCache;
}

// Newest-first list of { id, at }.
export function getRecents() {
  return load().slice();
}

// Mark a note as just-opened. De-dupes and caps the list so the row stays short.
export function pushRecent(id) {
  if (!id) return;
  const next = [{ id, at: Date.now() }, ...load().filter((r) => r.id !== id)].slice(0, MAX_RECENTS);
  recentsCache = next;
  safeSet(RECENTS_KEY, JSON.stringify(next));
}

// Drop a note from recents (e.g. after permanent deletion).
export function removeRecent(id) {
  const next = load().filter((r) => r.id !== id);
  if (next.length === recentsCache.length) return;
  recentsCache = next;
  safeSet(RECENTS_KEY, JSON.stringify(next));
}
