import React, { memo, useRef, useState } from "react";
import { formatRelativeTime, derivePreview } from "../utils/format.js";

function NoteCard({
  note,
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
    if (dx < -60) setSwiped(true);
    else if (dx > 60) setSwiped(false);
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
        className={`note-card${note.pinned ? " is-pinned" : ""}${swiped ? " swiped" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`Open note ${note.title || "Untitled"}`}
        onClick={() => (trashMode ? null : onOpen(note))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen(note);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEndSwipe}
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
              📌
            </button>
            <button
              type="button"
              className={`action-btn${note.favorite ? " active" : ""}`}
              aria-label={note.favorite ? "Unfavorite note" : "Favorite note"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
            >
              ⭐
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
              📦
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
              🗑
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
              ♻️
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
              ✕
            </button>
          </div>
        )}

        <div className={trashMode ? "trash-note" : ""}>
          <div className="note-card-title">
            {note.pinned && <span className="pin-icon" aria-label="Pinned">📌</span>}
            {note.favorite && <span className="fav-icon" aria-label="Favorite">⭐</span>}
            <span>{note.title || "Untitled Note"}</span>
          </div>
          {preview && <div className="note-card-preview">{preview}</div>}
          {(note.tags?.length > 0) && (
            <div className="note-card-tags">
              {note.tags.slice(0, 4).map((tag) => (
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
          </div>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={closeMenu}
          />
          <div
            className="sheet"
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 41, maxWidth: "none", borderRadius: "20px 20px 0 0" }}
            role="menu"
          >
            <div className="sheet-handle" />
            <button
              type="button"
              className="sheet-item"
              role="menuitem"
              onClick={() => {
                onTogglePin(note.id);
                closeMenu();
              }}
            >
              <span className="item-icon">{note.pinned ? "📌" : "📍"}</span>
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
              <span className="item-icon">{note.favorite ? "💔" : "⭐"}</span>
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
                  <span className="item-icon">✏️</span>
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
                  <span className="item-icon">📦</span>
                  <span className="item-label">Archive</span>
                </button>
              </>
            )}
            {trashMode ? (
              <>
                <button
                  type="button"
                  className="sheet-item"
                  role="menuitem"
                  onClick={() => {
                    onRestore(note.id);
                    closeMenu();
                  }}
                >
                  <span className="item-icon">♻️</span>
                  <span className="item-label">Restore</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="sheet-item"
                role="menuitem"
                onClick={() => {
                  onTrash(note.id);
                  closeMenu();
                }}
              >
                <span className="item-icon">🗑</span>
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
