import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Toolbar, { insertTextAt } from "./Toolbar.jsx";
import BottomBar from "./BottomBar.jsx";
import Viewer from "./Viewer.jsx";
import CommandMenu, { SLASH_COMMANDS } from "./CommandMenu.jsx";
import { countWords, countCharacters, deriveTitleFromContent, formatRelativeTime } from "../utils/format.js";
import { saveDraft, loadDraft, clearDraft } from "../storage/notesStore.js";
import { updateSettings } from "../storage/settingsStore.js";
import { exportNoteMarkdown, downloadTextFile } from "../storage/importExport.js";

const AUTOSAVE_DELAY = 500;
const DRAFT_DELAY = 300;

export default function Editor({
  note,
  allNotes,
  settings,
  online = true,
  onBack,
  onSave,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onTrash,
  getBacklinks,
  onOpenNote,
  onCreateNoteFor,
  onTagClick,
}) {
  const [mode, setMode] = useState(settings.defaultMode === "preview" ? "preview" : "edit");
  const [content, setContent] = useState(note.content);
  const [manualTitle, setManualTitle] = useState(
    note.title && note.title !== deriveTitleFromContent(note.content) ? note.title : null
  );
  const [saveStatus, setSaveStatus] = useState("");
  const [slashMenu, setSlashMenu] = useState(null); // { query, start, end }
  const [overflowOpen, setOverflowOpen] = useState(false);

  const textareaRef = useRef(null);
  const saveTimer = useRef(null);
  const draftTimer = useRef(null);
  const dirtyRef = useRef(false);
  const stateRef = useRef({ content: note.content, title: note.title });
  const statusTimeout = useRef(null);

  const derivedTitle = useMemo(() => deriveTitleFromContent(content), [content]);
  const displayTitle = manualTitle ?? derivedTitle;
  const backlinks = useMemo(() => getBacklinks(note), [note, getBacklinks]);

  // Load note content on switch; recover draft if it is newer (crash/reload)
  useEffect(() => {
    const draft = loadDraft();
    if (
      draft &&
      draft.noteId === note.id &&
      draft.at > note.updatedAt &&
      typeof draft.content === "string" &&
      draft.content !== note.content
    ) {
      setContent(draft.content);
      setManualTitle(draft.title && draft.title !== deriveTitleFromContent(draft.content) ? draft.title : null);
      dirtyRef.current = true;
      flushSave();
    } else {
      setContent(note.content);
      setManualTitle(
        note.title && note.title !== deriveTitleFromContent(note.content) ? note.title : null
      );
      clearDraft();
    }
    dirtyRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  const flashStatus = useCallback((text) => {
    setSaveStatus(text);
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    statusTimeout.current = setTimeout(() => setSaveStatus(""), 1600);
  }, []);

  const flushSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    const title = manualTitle ?? derivedTitle;
    onSave(note.id, {
      content: stateRef.current.content,
      title,
    });
    clearDraft();
    flashStatus("Saved");
  }, [manualTitle, derivedTitle, note.id, onSave, flashStatus]);

  // Flush on hide/unload so nothing is lost
  useEffect(() => {
    const onHide = () => {
      if (dirtyRef.current) {
        saveDraft(note.id, stateRef.current.content, manualTitle ?? derivedTitle);
        flushSave();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [note.id, manualTitle, derivedTitle, flushSave]);

  // Flush when leaving the editor
  useEffect(() => {
    return () => {
      // Unmount: final synchronous save via ref state (refs hold fresh values)
      if (dirtyRef.current) {
        dirtyRef.current = false;
        onSave(note.id, {
          content: stateRef.current.content,
          title: stateRef.current.title ?? deriveTitleFromContent(stateRef.current.content),
        });
        clearDraft();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  function handleContentChange(e) {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    stateRef.current.content = val;
    dirtyRef.current = true;

    // Draft net (debounced)
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(note.id, val, manualTitle ?? derivedTitle);
    }, DRAFT_DELAY);

    // Autosave
    if (settings.autosave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        flushSave();
      }, AUTOSAVE_DELAY);
    }

    // Slash command detection: "/word" right before cursor, preceded by whitespace/line start
    const before = val.slice(0, pos);
    const m = before.match(/(?:^|\s)\/([a-zA-Z]*)$/);
    if (m && m[1].length <= 15) {
      const start = pos - m[1].length - 1;
      setSlashMenu({ query: m[1], start, end: pos });
    } else if (slashMenu) {
      setSlashMenu(null);
    }
  }

  function handleTitleChange(e) {
    const val = e.target.value;
    setManualTitle(val === "" ? null : val);
    stateRef.current.title = val === "" ? null : val;
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flushSave(), AUTOSAVE_DELAY);
  }

  function handleToolbarInsert(action) {
    const ta = textareaRef.current;
    if (!ta) return;
    insertTextAt(ta, action);
    handleProgrammaticEdit(ta);
  }

  function handleProgrammaticEdit(ta) {
    const val = ta.value;
    setContent(val);
    stateRef.current.content = val;
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flushSave(), AUTOSAVE_DELAY);
  }

  function handleSlashSelect(item) {
    const menu = slashMenu;
    setSlashMenu(null);
    const ta = textareaRef.current;
    if (!ta || !menu) return;
    // Remove "/query" and insert snippet
    const snippet = item.snippet;
    insertTextAt(ta, menu.start, menu.end, snippet);
    handleProgrammaticEdit(ta);
  }

  function handleModeChange(next) {
    if (next === "preview") flushSave();
    setMode(next);
    updateSettings({ defaultMode: next });
  }

  function handleExportMarkdown() {
    const md = exportNoteMarkdown({ ...note, content: stateRef.current.content, title: displayTitle });
    const filename = (displayTitle || "note").replace(/[^\w\- ]+/g, "").trim() || "note";
    downloadTextFile(md, `${filename}.md`, "text/markdown");
    setOverflowOpen(false);
  }

  const wordCount = countWords(content);
  const charCount = countCharacters(content);
  const showCounts = settings.wordCount || settings.charCount;
  const statusText = !online ? "Offline" : saveStatus;

  const editedAgo = useMemo(() => formatRelativeTime(note.updatedAt), [note.updatedAt]);

  return (
    <div className="screen">
      <header className="editor-header safe-top">
        <button type="button" className="icon-btn" aria-label="Back to notes" onClick={() => { flushSave(); onBack(); }}>
          ←
        </button>
        <input
          type="text"
          className="editor-title-input"
          value={displayTitle}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          aria-label="Note title"
          enterKeyHint="done"
        />
        <button
          type="button"
          className="icon-btn"
          aria-label="Note actions"
          onClick={() => setOverflowOpen(true)}
        >
          ⋮
        </button>
      </header>

      {mode === "edit" ? (
        <div className="editor-body editor-scroll">
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder={"Start writing...\n\n# Heading\n**bold** _italic_ `code`\n- list item\n[ ] task\n@tag\n[[Note link]]"}
            aria-label="Note content"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck={true}
            style={{ height: "100%", border: "none" }}
          />
        </div>
      ) : (
        <Viewer
          note={{ ...note, content }}
          allNotes={allNotes}
          onOpenNote={(n) => {
            flushSave();
            onOpenNote(n);
          }}
          onTagClick={onTagClick}
          getBacklinks={getBacklinks}
          onCreateNoteFor={onCreateNoteFor}
        />
      )}

      {statusText && (
        <div
          className="save-status"
          style={{ position: "static", alignSelf: "flex-end", margin: "2px 12px" }}
        >
          {statusText}
        </div>
      )}

      {mode === "edit" && settings.showToolbar && (
        <Toolbar onInsert={handleToolbarInsert} />
      )}

      <BottomBar
        mode={mode}
        onModeChange={handleModeChange}
        wordCount={settings.wordCount ? wordCount : 0}
        charCount={settings.charCount ? charCount : 0}
        showCounts={showCounts}
        saveStatus={mode === "preview" ? null : null}
      />

      <CommandMenu
        open={Boolean(slashMenu)}
        mode="slash"
        slashQuery={slashMenu?.query || ""}
        items={SLASH_COMMANDS}
        onClose={() => setSlashMenu(null)}
        onSelect={handleSlashSelect}
      />

      {overflowOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.3)" }}
            onClick={() => setOverflowOpen(false)}
          />
          <div
            className="sheet"
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 41, maxWidth: "none" }}
            role="menu"
          >
            <div className="sheet-handle" />
            <div className="sheet-section">Edited {editedAgo}</div>
            <button
              type="button"
              className="sheet-item"
              onClick={() => {
                onTogglePin(note.id);
                setOverflowOpen(false);
              }}
            >
              <span className="item-icon">{note.pinned ? "📍" : "📌"}</span>
              <span className="item-label">{note.pinned ? "Unpin" : "Pin"}</span>
            </button>
            <button
              type="button"
              className="sheet-item"
              onClick={() => {
                onToggleFavorite(note.id);
                setOverflowOpen(false);
              }}
            >
              <span className="item-icon">{note.favorite ? "💔" : "⭐"}</span>
              <span className="item-label">{note.favorite ? "Unfavorite" : "Favorite"}</span>
            </button>
            <button type="button" className="sheet-item" onClick={handleExportMarkdown}>
              <span className="item-icon">📤</span>
              <span className="item-label">Export as Markdown</span>
            </button>
            <button
              type="button"
              className="sheet-item"
              onClick={() => {
                flushSave();
                setOverflowOpen(false);
                onArchive(note.id);
                onBack();
              }}
            >
              <span className="item-icon">📦</span>
              <span className="item-label">Archive</span>
            </button>
            <button
              type="button"
              className="sheet-item"
              onClick={() => {
                flushSave();
                setOverflowOpen(false);
                onTrash(note.id);
                onBack();
              }}
            >
              <span className="item-icon">🗑</span>
              <span className="item-label">Move to Trash</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
