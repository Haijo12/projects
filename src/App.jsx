import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotes } from "./hooks/useNotes.js";
import { useTheme } from "./hooks/useTheme.js";
import HomeScreen from "./components/HomeScreen.jsx";
import Editor from "./components/Editor.jsx";
import Settings from "./components/Settings.jsx";
import Trash from "./components/Trash.jsx";
import CommandMenu, { buildPaletteCommands } from "./components/CommandMenu.jsx";
import { getNote } from "./storage/notesStore.js";
import { pushRecent } from "./storage/recentsStore.js";
import { generateId } from "./utils/format.js";
import { saveNote } from "./storage/notesStore.js";
import { extractTags } from "./utils/tags.js";

const ROUTES = ["home", "note", "settings", "trash"];

function routeFromLocation() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [name, param] = hash.split("/");
  if (ROUTES.includes(name)) return { name, param };
  return { name: "home", param: null };
}

export default function App() {
  const { settings, update } = useTheme();
  const notes = useNotes();
  const [route, setRoute] = useState(routeFromLocation);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [paletteFilter, setPaletteFilter] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null); // note object
  const [renameValue, setRenameValue] = useState("");

  // --- Routing via history so Android back works naturally ---
  function navigate(name, param = null, replace = false) {
    const hash = param ? `#/${name}/${encodeURIComponent(param)}` : `#/${name}`;
    if (replace) {
      window.history.replaceState({ name, param }, "", hash);
      setRoute({ name, param });
    } else {
      window.history.pushState({ name, param }, "", hash);
      setRoute({ name, param });
    }
  }

  useEffect(() => {
    const onPop = () => {
      setRoute(routeFromLocation());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const openNote = useCallback((note) => {
    pushRecent(note.id);
    navigate("note", note.id);
  }, []);

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
    notes.refresh();
    pushRecent(note.id);
    navigate("note", note.id);
    // Focus the textarea after navigation
    setTimeout(() => {
      const ta = document.querySelector(".editor-textarea");
      ta?.focus();
    }, 80);
  }, [notes]);

  const createNoteFor = useCallback(
    (title) => {
      const now = Date.now();
      const note = {
        id: generateId(),
        title,
        content: `# ${title}\n\n`,
        tags: extractTags(title),
        pinned: false,
        favorite: false,
        archived: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
        metadata: {},
      };
      saveNote(note);
      notes.refresh();
      pushRecent(note.id);
      navigate("note", note.id);
    },
    [notes]
  );

  const handleSave = useCallback(
    (id, partial) => {
      notes.updateNote(id, partial);
    },
    [notes]
  );

  const handleRename = useCallback((note) => {
    const current = getNote(note.id);
    setRenameTarget(current);
    setRenameValue(current?.title || "");
  }, []);

  const goHome = useCallback(() => navigate("home"), []);

  // Redirect stale note routes (note deleted elsewhere)
  const currentNote = useMemo(() => {
    if (route.name !== "note" || !route.param) return null;
    return getNote(route.param);
  }, [route]);

  const paletteItems = useMemo(
    () =>
      buildPaletteCommands({
        onCreate: createNote,
        onOpenSettings: () => navigate("settings"),
        onShowFavorites: () => setPaletteFilter("favorites"),
        onShowPinned: () => setPaletteFilter("pinned"),
        onOpenTrash: () => navigate("trash"),
        onOpenArchive: () => setPaletteFilter("archive"),
        onOpenNote: openNote,
        notes: notes.visibleNotes,
      }),
    [createNote, openNote, notes.visibleNotes]
  );

  // Filter requested from the command palette
  useEffect(() => {
    if (paletteFilter) {
      if (route.name !== "home") goHome();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("notes:set-filter", { detail: paletteFilter }));
      }, 50);
      setPaletteFilter(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteFilter]);

  function commitRename() {
    if (!renameTarget) return;
    notes.updateNote(renameTarget.id, { title: renameValue.trim() });
    setRenameTarget(null);
  }

  return (
    <div className="app-frame">
      {route.name === "home" && (
        <HomeScreen
          notes={notes}
          compact={settings.compactList}
          onOpenNote={openNote}
          onCreateNote={createNote}
          onTogglePin={(id) => notes.updateNote(id, { pinned: !getNote(id).pinned })}
          onToggleFavorite={(id) => notes.updateNote(id, { favorite: !getNote(id).favorite })}
          onArchive={(id) => notes.updateNote(id, { archived: true })}
          onTrash={(id) => notes.trashNote(id)}
          onDuplicate={notes.duplicateNote}
          onRename={handleRename}
          onRestore={(id) => notes.updateNote(id, { deletedAt: null, archived: false })}
          onDeletePermanent={(id) => {
            if (window.confirm("Permanently delete this note?")) {
              notes.permanentDelete(id);
            }
          }}
          onOpenSettings={() => navigate("settings")}
          onOpenCommandMenu={() => setPaletteOpen(true)}
          initialFilter={paletteFilter}
        />
      )}

      {route.name === "note" && currentNote && (
        <Editor
          key={currentNote.id}
          note={currentNote}
          allNotes={notes.notes}
          settings={settings}
          online={online}
          onBack={goHome}
          onSave={handleSave}
          onTogglePin={(id) => notes.updateNote(id, { pinned: !getNote(id).pinned })}
          onToggleFavorite={(id) => notes.updateNote(id, { favorite: !getNote(id).favorite })}
          onArchive={(id) => notes.updateNote(id, { archived: true })}
          onTrash={(id) => notes.trashNote(id)}
          getBacklinks={notes.getBacklinks}
          onOpenNote={openNote}
          onCreateNoteFor={createNoteFor}
          onTagClick={(tag) => {
            goHome();
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("notes:set-tag", { detail: tag }));
            }, 50);
          }}
        />
      )}

      {route.name === "note" && !currentNote && (
        <div className="screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Note not found.</p>
          <button type="button" className="btn btn-primary" onClick={goHome}>
            Go home
          </button>
        </div>
      )}

      {route.name === "settings" && (
        <Settings
          settings={settings}
          onSettingsChange={update}
          onBack={goHome}
          onOpenTrash={() => navigate("trash")}
        />
      )}

      {route.name === "trash" && (
        <Trash
          notes={notes.trashedNotes}
          onRestore={(id) => notes.restoreNote(id)}
          onDeletePermanent={notes.permanentDelete}
          onEmptyTrash={notes.emptyTrashNow}
          onBack={goHome}
        />
      )}

      <CommandMenu
        open={paletteOpen}
        mode="palette"
        items={paletteItems}
        onClose={() => setPaletteOpen(false)}
      />

      {/* Rename dialog */}
      {renameTarget && (
        <div className="dialog-backdrop" onClick={() => setRenameTarget(null)} role="presentation">
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Rename note"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Rename note</h2>
            <input
              className="sheet-input"
              style={{ marginBottom: 4 }}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitRename();
                } else if (e.key === "Escape") {
                  setRenameTarget(null);
                }
              }}
              placeholder="Note title"
              aria-label="New note title"
              autoFocus
            />
            <div className="dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setRenameTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={commitRename}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.storageError && (
        <div className="toast" role="alert" style={{ background: "var(--danger)", color: "#fff" }}>
          Storage error — your last edit may not be saved. Export a backup!
        </div>
      )}
    </div>
  );
}
