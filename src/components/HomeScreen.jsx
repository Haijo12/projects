import { useEffect, useMemo, useState } from "react";
import NoteCard from "./NoteCard.jsx";
import SearchBar from "./SearchBar.jsx";
import TagFilter from "./TagFilter.jsx";
import EmptyState from "./EmptyState.jsx";
import { searchNotes } from "../utils/search.js";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pinned", label: "Pinned" },
  { key: "favorites", label: "Favorites" },
  { key: "archive", label: "Archive" },
  { key: "trash", label: "Trash" },
];

export default function HomeScreen({
  notes, // { visibleNotes, pinnedNotes, favoriteNotes, archivedNotes, trashedNotes, tagList }
  onOpenNote,
  onCreateNote,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onTrash,
  onDuplicate,
  onRename,
  onRestore,
  onDeletePermanent,
  onOpenSettings,
  onOpenCommandMenu,
  initialFilter = null,
}) {
  const [filter, setFilter] = useState(initialFilter || "all");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  const isTrash = filter === "trash";
  const isArchive = filter === "archive";

  const base = useMemo(() => {
    switch (filter) {
      case "pinned":
        return notes.pinnedNotes;
      case "favorites":
        return notes.favoriteNotes;
      case "archive":
        return notes.archivedNotes;
      case "trash":
        return notes.trashedNotes;
      default:
        return notes.visibleNotes;
    }
  }, [filter, notes]);

  const filtered = useMemo(() => {
    let list = base;
    if (activeTag) {
      list = list.filter((n) => (n.tags || []).includes(activeTag));
    }
    if (query.trim()) {
      list = searchNotes(list, query);
    }
    return list;
  }, [base, activeTag, query]);

  const pinnedSection = useMemo(
    () =>
      filter === "all" && !query && !activeTag
        ? filtered.filter((n) => n.pinned)
        : [],
    [filter, query, activeTag, filtered]
  );

  const recentSection = useMemo(
    () =>
      filter === "all" && !query && !activeTag
        ? filtered.filter((n) => !n.pinned)
        : filtered,
    [filter, query, activeTag, filtered]
  );

  const resultCount = query.trim() ? `${filtered.length} note${filtered.length === 1 ? "" : "s"} found` : null;

  // Listen for filter/tag requests coming from the command palette or editor
  useEffect(() => {
    const onFilter = (e) => {
      setFilter(e.detail);
      setQuery("");
      setActiveTag(null);
    };
    const onTag = (e) => {
      setFilter("all");
      setQuery("");
      setActiveTag(e.detail);
    };
    window.addEventListener("notes:set-filter", onFilter);
    window.addEventListener("notes:set-tag", onTag);
    return () => {
      window.removeEventListener("notes:set-filter", onFilter);
      window.removeEventListener("notes:set-tag", onTag);
    };
  }, []);

  function handleTagClick(tag) {
    setFilter("all");
    setQuery("");
    setActiveTag(tag === activeTag ? null : tag);
  }

  const cardProps = {
    onOpen: onOpenNote,
    onTogglePin,
    onToggleFavorite,
    onArchive,
    onTrash,
    onDuplicate,
    onRename,
    onTagClick: handleTagClick,
    trashMode: isTrash,
    onRestore,
    onDeletePermanent,
  };

  return (
    <div className="screen">
      <header className="sticky-header safe-top">
        <div className="app-header">
          <h1>Notes</h1>
          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Open search"
              onClick={() => {
                const input = document.querySelector(".search-bar input");
                input?.focus();
              }}
            >
              🔍
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Command menu"
              onClick={onOpenCommandMenu}
            >
              ⌘
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Settings"
              onClick={onOpenSettings}
            >
              ⚙️
            </button>
          </div>
        </div>
        <SearchBar value={query} onChange={setQuery} />
        <div className="filter-row" role="tablist" aria-label="Note filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="chip"
              aria-pressed={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setActiveTag(null);
              }}
            >
              {f.label}
              {f.key === "trash" && notes.trashedNotes.length > 0 && (
                <span className="chip-count">{notes.trashedNotes.length}</span>
              )}
              {f.key === "archive" && notes.archivedNotes.length > 0 && (
                <span className="chip-count">{notes.archivedNotes.length}</span>
              )}
            </button>
          ))}
        </div>
        <TagFilter
          notes={notes.visibleNotes}
          activeTag={activeTag}
          onSelectTag={(t) => setActiveTag(t === activeTag ? null : t)}
          onClear={() => setActiveTag(null)}
        />
      </header>

      <div className="screen-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {resultCount && <div className="result-count">{resultCount}</div>}

        {filtered.length === 0 ? (
          <EmptyState
            icon={isTrash ? "🗑" : isArchive ? "📦" : query ? "🔍" : "📝"}
            title={
              query
                ? "No matching notes"
                : isTrash
                  ? "Trash is empty"
                  : isArchive
                    ? "Nothing archived"
                    : filter === "favorites"
                      ? "No favorites yet"
                      : filter === "pinned"
                        ? "Nothing pinned"
                        : "No notes yet"
            }
            hint={
              query
                ? "Try a different search."
                : isTrash || isArchive
                  ? null
                  : "Tap + to create your first note."
            }
          />
        ) : (
          <div className="note-list">
            {pinnedSection.length > 0 && (
              <>
                <div className="section-label">Pinned</div>
                {pinnedSection.map((note) => (
                  <NoteCard key={note.id} note={note} {...cardProps} />
                ))}
              </>
            )}
            {recentSection.length > 0 && (
              <>
                {pinnedSection.length > 0 && <div className="section-label">Recent</div>}
                {recentSection.map((note) => (
                  <NoteCard key={note.id} note={note} {...cardProps} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {!isTrash && (
        <button type="button" className="fab" aria-label="Create new note" onClick={onCreateNote}>
          +
        </button>
      )}
    </div>
  );
}
