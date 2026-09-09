import React, { memo, useRef, useState } from "react";
import { formatRelativeTime, derivePreview } from "../utils/format.js";
import {
  PinIcon,
  StarIcon,
  ArchiveIcon,
  TrashIcon,
  RestoreIcon,
  MoreIcon,
} from "./icons.jsx";

function NoteCard({
  note,
  compact = false,
  onOpen,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onTrash,
  onDuplicate,
  onRename,
  onTagClick,
  trashMode = false,
  onRestore,
  onDeletePermanent,
}) {
  const [swiped, setSwiped] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const touchStart = useRef(null);
  const longPressTimer = useRef(null);

  const preview = derivePreview(note.content, note.title);

  function handleTouchStart(e) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => {
      setMenuOpen(true);
      if (navigator.vibrate) navigator.vibrate(10);
    }, 500);
  }

  function handleTouchMove(e) {
    if (!touchStart.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    if (dx > 10 || dy > 10) clearTimeout(longPressTimer.current);
  }

  function handleTouchEnd() {
    clearTimeout(longPressTimer.current);
  }

  function handleTouchEndSwipe(e) {
    clearTimeout(longPressTimer.current);
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    // Only treat as swipe if it's a mostly-horizontal gesture
    if (Math.abs(dx) > 60 && Math.abs(dx) > dy) {
      if (dx < 0) setSwiped(true);
      else setSwiped(false);
    }
    touchStart.current = null;
  }

  function handleContextMenu(e) {
    e.preventDefault();
    setMenuOpen(true);
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div
        className={`note-card${note.pinned ? " is-pinned" : ""}${swiped ? " swiped" : ""}${compact ? " compact" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`Open note ${note.title || "Untitled"}`}
        onClick={() => {
          clearTimeout(longPressTimer.current);
          if (swiped) {
            setSwiped(false);
            return;
          }
          if (!trashMode) onOpen(note);
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !trashMode) onOpen(note);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEndSwipe}
        onTouchCancel={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        {swiped && !trashMode && (
          <div className="note-card-actions">
            <button
              type="button"
              className={`action-btn${note.pinned ? " active" : ""}`}
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
                setSwiped(false);
              }}
            >
              <PinIcon filled={note.pinned} />
            </button>
            <button
              type="button"
              className={`action-btn${note.favorite ? " active" : ""}`}
              aria-label={note.favorite ? "Unfavorite note" : "Favorite note"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
                setSwiped(false);
              }}
            >
              <StarIcon filled={note.favorite} />
            </button>
            <button
              type="button"
              className="action-btn"
              aria-label="Archive note"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(note.id);
                setSwiped(false);
              }}
            >
              <ArchiveIcon />
            </button>
            <button
              type="button"
              className="action-btn danger"
              aria-label="Move note to trash"
              onClick={(e) => {
                e.stopPropagation();
                onTrash(note.id);
                setSwiped(false);
              }}
            >
              <TrashIcon />
            </button>
          </div>
        )}

        {trashMode && (
          <div className="note-card-actions">
            <button
              type="button"
              className="action-btn"
              aria-label="Restore note"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(note.id);
              }}
            >
              <RestoreIcon />
            </button>
            <button
              type="button"
              className="action-btn danger"
              aria-label="Delete permanently"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePermanent(note.id);
              }}
            >
              <TrashIcon />
            </button>
          </div>
        )}

        <div className={trashMode ? "trash-note" : ""}>
          <div className="note-card-title">
            <span className="note-card-title-text">{note.title || "Untitled Note"}</span>
            {note.favorite && (
              <span className="fav-icon" aria-label="Favorite">
                <StarIcon filled />
              </span>
            )}
            {note.pinned && (
              <span className="pin-icon" aria-label="Pinned">
                <PinIcon filled />
              </span>
            )}
          </div>
          {preview && <div className="note-card-preview">{preview}</div>}
          {note.tags?.length > 0 && (
            <div className="note-card-tags">
              {note.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="tag-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <div className="note-card-meta">
            <span>
              {trashMode && note.deletedAt ? "Deleted " : "Updated "}
              {formatRelativeTime(trashMode ? note.deletedAt : note.updatedAt)}
            </span>
            <span
              className="more-trigger"
              role="button"
              tabIndex={0}
              aria-label="Note actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setMenuOpen(true);
                }
              }}
            >
              <MoreIcon />
            </span>
          </div>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className="backdrop" onClick={closeMenu} />
          <div
            className="sheet"
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 41, maxWidth: "none" }}
            role="menu"
          >
            <div className="sheet-handle" />
            <div className="sheet-section">{note.title || "Untitled Note"}</div>
            <button
              type="button"
              className="sheet-item"
              role="menuitem"
              onClick={() => {
                onTogglePin(note.id);
                closeMenu();
              }}
            >
              <span className="item-icon"><PinIcon filled={note.pinned} /></span>
              <span className="item-label">{note.pinned ? "Unpin" : "Pin"}</span>
            </button>
            <button
              type="button"
              className="sheet-item"
              role="menuitem"
              onClick={() => {
                onToggleFavorite(note.id);
                closeMenu();
              }}
            >
              <span className="item-icon"><StarIcon filled={note.favorite} /></span>
              <span className="item-label">{note.favorite ? "Unfavorite" : "Favorite"}</span>
            </button>
            {!trashMode && (
              <>
                <button
                  type="button"
                  className="sheet-item"
                  role="menuitem"
                  onClick={() => {
                    onRename?.(note);
                    closeMenu();
                  }}
                >
                  <span className="item-icon">Aa</span>
                  <span className="item-label">Rename</span>
                </button>
                <button
                  type="button"
                  className="sheet-item"
                  role="menuitem"
                  onClick={() => {
                    onDuplicate(note.id);
                    closeMenu();
                  }}
                >
                  <span className="item-icon">⧉</span>
                  <span className="item-label">Duplicate</span>
                </button>
                <button
                  type="button"
                  className="sheet-item"
                  role="menuitem"
                  onClick={() => {
                    onArchive(note.id);
                    closeMenu();
                  }}
                >
                  <span className="item-icon"><ArchiveIcon /></span>
                  <span className="item-label">Archive</span>
                </button>
              </>
            )}
            {trashMode ? (
              <button
                type="button"
                className="sheet-item"
                role="menuitem"
                onClick={() => {
                  onRestore(note.id);
                  closeMenu();
                }}
              >
                <span className="item-icon"><RestoreIcon /></span>
                <span className="item-label">Restore</span>
              </button>
            ) : (
              <button
                type="button"
                className="sheet-item danger"
                role="menuitem"
                onClick={() => {
                  onTrash(note.id);
                  closeMenu();
                }}
              >
                <span className="item-icon"><TrashIcon /></span>
                <span className="item-label">Move to Trash</span>
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default memo(NoteCard);
