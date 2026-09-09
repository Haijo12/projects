// useNotes — central client-side state over notesStore

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllNotes, saveNote, deleteNotePermanently, emptyTrash } from "../storage/notesStore.js";
import { extractTags } from "../utils/tags.js";
import { generateId, deriveTitleFromContent } from "../utils/format.js";
import { searchNotes } from "../utils/search.js";
import { findBacklinks } from "../utils/links.js";
import { filterByTag } from "../utils/tags.js";
import { purgeExpiredTrash } from "../storage/backup.js";
import { getSettings } from "../storage/settingsStore.js";

function sortByRecency(notes) {
  return notes.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function useNotes() {
  const [notes, setNotes] = useState(getAllNotes);
  const [storageError, setStorageError] = useState(null);

  // Refresh from store when another tab writes (storage event) or on focus
  useEffect(() => {
    const onStorage = () => setNotes(getAllNotes());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, []);

  const refresh = useCallback(() => setNotes(getAllNotes()), []);

  // Trash retention
  useEffect(() => {
    const settings = getSettings();
    if (purgeExpiredTrash(settings.trashRetentionDays) > 0) {
      refresh();
    }
  }, [refresh]);

  const createNote = useCallback(() => {
    const now = Date.now();
    const note = {
      id: generateId(),
      title: "",
      content: "",
      tags: [],
      pinned: false,
      favorite: false,
      archived: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };
    saveNote(note);
    refresh();
    return note;
  }, [refresh]);

  const updateNote = useCallback(
    (id, partial) => {
      const current = getAllNotes().find((n) => n.id === id);
      if (!current) return null;
      const next = { ...current, ...partial };
      if (partial.content !== undefined) {
        next.tags = extractTags(partial.content);
        if (partial.title === undefined) {
          next.title = deriveTitleFromContent(partial.content);
        }
      }
      next.updatedAt = Date.now();
      const saved = saveNote(next);
      if (!saved) {
        setStorageError("Could not save note. Storage may be full.");
        return null;
      }
      refresh();
      return next;
    },
    [refresh]
  );

  const trashNote = useCallback(
    (id) => updateNote(id, { deletedAt: Date.now() }),
    [updateNote]
  );

  const restoreNote = useCallback(
    (id) => updateNote(id, { deletedAt: null }),
    [updateNote]
  );

  const duplicateNote = useCallback(
    (id) => {
      const source = getAllNotes().find((n) => n.id === id);
      if (!source) return null;
      const now = Date.now();
      const copy = {
        ...source,
        id: generateId(),
        title: source.title ? `${source.title} (copy)` : "",
        pinned: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      saveNote(copy);
      refresh();
      return copy;
    },
    [refresh]
  );

  const permanentDelete = useCallback(
    (id) => {
      deleteNotePermanently(id);
      refresh();
    },
    [refresh]
  );

  const emptyTrashNow = useCallback(() => {
    const removed = emptyTrash();
    refresh();
    return removed;
  }, [refresh]);

  const getBacklinks = useCallback(
    (note) => findBacklinks(note, notes),
    [notes]
  );

  const visibleNotes = useMemo(
    () => sortByRecency(notes.filter((n) => !n.deletedAt && !n.archived)),
    [notes]
  );

  const archivedNotes = useMemo(
    () => sortByRecency(notes.filter((n) => n.archived && !n.deletedAt)),
    [notes]
  );

  const trashedNotes = useMemo(
    () => sortByRecency(notes.filter((n) => n.deletedAt)),
    [notes]
  );

  const favoriteNotes = useMemo(
    () => visibleNotes.filter((n) => n.favorite),
    [visibleNotes]
  );

  const pinnedNotes = useMemo(
    () => visibleNotes.filter((n) => n.pinned),
    [visibleNotes]
  );

  const tagList = useMemo(() => getAllTagsFromNotes(notes), [notes]);

  const filterByTagFn = useCallback((list, tag) => filterByTag(list, tag), []);

  const search = useCallback((list, query) => searchNotes(list, query), []);

  return {
    notes,
    visibleNotes,
    archivedNotes,
    trashedNotes,
    favoriteNotes,
    pinnedNotes,
    tagList,
    storageError,
    createNote,
    updateNote,
    trashNote,
    restoreNote,
    duplicateNote,
    permanentDelete,
    emptyTrashNow,
    getBacklinks,
    filterByTag: filterByTagFn,
    search,
    refresh,
  };
}

function getAllTagsFromNotes(notes) {
  const counts = new Map();
  for (const note of notes) {
    for (const tag of note.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()].map(([tag, count]) => ({ tag, count }));
}
