import { useEffect, useMemo, useState } from "react";
import NoteCard from "./NoteCard.jsx";
import TagFilter from "./TagFilter.jsx";
import EmptyState from "./EmptyState.jsx";
import { searchNotes } from "../utils/search.js";
import { Search, Settings, ArrowLeft, X, Plus, FileText } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pinned", label: "Pinned" },
  { key: "favorites", label: "Favorites" },
  { key: "archive", label: "Archive" },
  { key: "trash", label: "Trash" },
];

export default function HomeScreen({
  notes,
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
  initialFilter = null,
}) {
  const [filter, setFilter] = useState(initialFilter || "all");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const resultCount = query.trim()
    ? `${filtered.length} note${filtered.length === 1 ? "" : "s"} found`
    : null;

  // Listen for filter/tag requests from the command palette / editor
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

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

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
      <header className="home-header safe-top">
        {searchOpen ? (
          <div className="search-field-row">
            <button
              type="button"
              className="icon-btn"
              aria-label="Close search"
              onClick={closeSearch}
            >
              <ArrowLeft size={22} />
            </button>
            <input
              type="text"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeSearch();
              }}
              placeholder="Search notes…"
              aria-label="Search notes"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="icon-btn"
                aria-label="Clear search row"
                onClick={() => setQuery("")}
              >
                <X size={20} />
              </button>
            )}
          </div>
        ) : (
          <div className="app-header">
            <h1>Notes</h1>
            <div className="header-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label="Search notes"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={22} />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Settings"
                onClick={onOpenSettings}
              >
                <Settings size={22} />
              </button>
            </div>
          </div>
        )}

        {!searchOpen && (
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
        )}

        {!searchOpen && (
          <TagFilter
            notes={notes.visibleNotes}
            activeTag={activeTag}
            onSelectTag={(t) => setActiveTag(t === activeTag ? null : t)}
            onClear={() => setActiveTag(null)}
          />
        )}
      </header>

      <div className="screen-scroll">
        {resultCount && <div className="result-count">{resultCount}</div>}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={44} strokeWidth={1.5} />}
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
                  : "Create your first note to get started."
            }
          >
            {!query && !isTrash && !isArchive && filter === "all" && !activeTag && (
              <button type="button" className="btn btn-primary" onClick={onCreateNote}>
                New Note
              </button>
            )}
          </EmptyState>
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
                {pinnedSection.length > 0 && <div className="section-label">Notes</div>}
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
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
