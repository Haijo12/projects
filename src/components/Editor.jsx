import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDelayedUnmount } from "../hooks/useDelayedUnmount.js";
import Toolbar, { insertTextAt } from "./Toolbar.jsx";
import BottomBar from "./BottomBar.jsx";
import Viewer from "./Viewer.jsx";
import CommandMenu, { SLASH_COMMANDS } from "./CommandMenu.jsx";
import { ArrowLeft, MoreVertical, Check, Loader2 } from "lucide-react";
import { PinIcon, StarIcon, ArchiveIcon, TrashIcon, ExportIcon } from "./icons.jsx";
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
  // null = derive the title from content; a string = user-set title
  const [manualTitle, setManualTitle] = useState(
    note.title && note.title !== deriveTitleFromContent(note.content) ? note.title : null
  );
  // "", "saving", "saved", "recovered", "unsaved" (autosave off)
  const [saveState, setSaveState] = useState("");
  const [slashMenu, setSlashMenu] = useState(null); // { query, start, end }
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflow = useDelayedUnmount(overflowOpen, 180);

  const textareaRef = useRef(null);
  const saveTimer = useRef(null);
  const draftTimer = useRef(null);
  const dirtyRef = useRef(false);
  // Refs hold the latest values so timers/cleanups never save stale content.
  const stateRef = useRef({
    content: note.content,
    title: note.title && note.title !== deriveTitleFromContent(note.content) ? note.title : null,
  });
  const statusTimeout = useRef(null);
  const initializedFor = useRef(null);

  const derivedTitle = useMemo(() => deriveTitleFromContent(content), [content]);
  const displayTitle = manualTitle ?? derivedTitle;
  const backlinks = useMemo(() => getBacklinks(note), [note, getBacklinks]);

  const flashStatus = useCallback((text) => {
    setSaveState(text);
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    statusTimeout.current = setTimeout(() => setSaveState(""), 1600);
  }, []);

  // Single save exit point. Reads latest values from refs, so it is safe to
  // call from timers, event listeners, blur, unmount — any closure age.
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
    const content = stateRef.current.content;
    const title = stateRef.current.title ?? deriveTitleFromContent(content);
    onSave(note.id, { content, title });
    clearDraft(note.id);
    setSaveState("saved");
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    statusTimeout.current = setTimeout(() => setSaveState(""), 1500);
  }, [note.id, onSave]);

  // Mark-edit helper shared by typing and programmatic (toolbar/slash) edits.
  const markEdited = useCallback(() => {
    dirtyRef.current = true;
    // Draft recovery net (debounced, per note) — survives a crash between saves.
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(note.id, stateRef.current.content, stateRef.current.title ?? deriveTitleFromContent(stateRef.current.content));
    }, DRAFT_DELAY);
    if (settings.autosave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flushSave(), AUTOSAVE_DELAY);
      setSaveState((s) => (s === "saving" ? s : "saving"));
    } else {
      setSaveState((s) => (s === "unsaved" ? s : "unsaved"));
    }
  }, [note.id, settings.autosave, flushSave]);

  // Load note content on switch/mount; recover a newer draft if one exists
  // (crash/reload) and persist it immediately so it is never at risk twice.
  useEffect(() => {
    if (initializedFor.current === note.id) return;
    initializedFor.current = note.id;

    const draft = loadDraft(note.id);
    if (
      draft &&
      draft.at > note.updatedAt &&
      draft.content !== note.content
    ) {
      const recTitle =
        typeof draft.title === "string" && draft.title && draft.title !== deriveTitleFromContent(draft.content)
          ? draft.title
          : null;
      setContent(draft.content);
      stateRef.current.content = draft.content;
      setManualTitle(recTitle);
      stateRef.current.title = recTitle;
      onSave(note.id, {
        content: draft.content,
        title: recTitle ?? deriveTitleFromContent(draft.content),
      });
      clearDraft(note.id);
      flashStatus("recovered");
    } else {
      setContent(note.content);
      stateRef.current.content = note.content;
      const t =
        note.title && note.title !== deriveTitleFromContent(note.content) ? note.title : null;
      setManualTitle(t);
      stateRef.current.title = t;
      clearDraft(note.id);
    }
    dirtyRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  // Flush on hide/unload so nothing is lost when Android backgrounds/kills us.
  useEffect(() => {
    const persistNow = () => {
      if (!dirtyRef.current) return;
      saveDraft(
        note.id,
        stateRef.current.content,
        stateRef.current.title ?? deriveTitleFromContent(stateRef.current.content)
      );
      flushSave();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persistNow();
    };
    window.addEventListener("pagehide", persistNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", persistNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [note.id, flushSave]);

  // Flush when leaving the editor (unmount)
  useEffect(() => {
    return () => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        const content = stateRef.current.content;
        onSave(note.id, {
          content,
          title: stateRef.current.title ?? deriveTitleFromContent(content),
        });
        clearDraft(note.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, onSave]);

  function handleContentChange(e) {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    stateRef.current.content = val;
    markEdited();

    // Slash command detection: "/word" right before cursor, after whitespace/line start
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
    const title = val === "" ? null : val;
    setManualTitle(title);
    stateRef.current.title = title;
    markEdited();
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
    markEdited();
  }

  function handleSlashSelect(item) {
    const menu = slashMenu;
    setSlashMenu(null);
    const ta = textareaRef.current;
    if (!ta || !menu) return;
    // Remove "/query" and insert snippet
    insertTextAt(ta, menu.start, menu.end, item.snippet);
    handleProgrammaticEdit(ta);
  }

  function handleModeChange(next) {
    if (next === "preview") flushSave();
    setMode(next);
    updateSettings({ defaultMode: next });
  }

  function handleExportMarkdown() {
    flushSave();
    const md = exportNoteMarkdown({
      ...note,
      content: stateRef.current.content,
      title: displayTitle,
    });
    const filename = (displayTitle || "note").replace(/[^\w\- ]+/g, "").trim() || "note";
    downloadTextFile(md, `${filename}.md`, "text/markdown");
    setOverflowOpen(false);
  }

  const wordCount = countWords(content);
  const charCount = countCharacters(content);
  const showCounts = settings.wordCount || settings.charCount;

  const statusText = useMemo(() => {
    if (!online) return "Offline";
    switch (saveState) {
      case "saving":
        return "Saving…";
      case "saved":
        return "Saved";
      case "recovered":
        return "Draft recovered";
      case "unsaved":
        return "Unsaved changes";
      default:
        return "";
    }
  }, [online, saveState]);

  const statusIcon = useMemo(() => {
    switch (saveState) {
      case "saving":
        return <Loader2 size={13} className="spin" />;
      case "saved":
        return <Check size={13} />;
      case "recovered":
        return <Check size={13} />;
      default:
        return null;
    }
  }, [saveState]);

  const editedAgo = useMemo(() => formatRelativeTime(note.updatedAt), [note.updatedAt]);

  return (
    <div className="screen screen--editor">
      <header className="editor-header safe-top">
        <button
          type="button"
          className="icon-btn"
          aria-label="Back to notes"
          onClick={() => {
            flushSave();
            onBack();
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <input
          type="text"
          className="editor-title-input"
          value={displayTitle}
          onChange={handleTitleChange}
          onBlur={flushSave}
          placeholder="Untitled Note"
          aria-label="Note title"
          enterKeyHint="done"
        />
        <button
          type="button"
          className="icon-btn"
          aria-label="Note actions"
          onClick={() => {
            flushSave();
            setOverflowOpen(true);
          }}
        >
          <MoreVertical size={22} />
        </button>
      </header>

      {mode === "edit" ? (
        <div className="editor-body editor-scroll">
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={content}
            onChange={handleContentChange}
            onBlur={flushSave}
            placeholder={"Start writing…\n\n# Heading\n**bold** _italic_ `code`\n- list item\n[ ] task\n@tag\n[[Note link]]"}
            aria-label="Note content"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck={true}
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

      {mode === "edit" && settings.showToolbar && <Toolbar onInsert={handleToolbarInsert} />}

      <BottomBar
        mode={mode}
        onModeChange={handleModeChange}
        wordCount={settings.wordCount ? wordCount : 0}
        charCount={settings.charCount ? charCount : 0}
        showCounts={showCounts}
        statusText={statusText}
        statusIcon={statusIcon}
      />

      <CommandMenu
        open={Boolean(slashMenu)}
        mode="slash"
        slashQuery={slashMenu?.query || ""}
        items={SLASH_COMMANDS}
        onClose={() => setSlashMenu(null)}
        onSelect={handleSlashSelect}
      />

      {overflow.mounted && (
        <>
          <div
            className={`backdrop${overflow.closing ? " backdrop--out" : ""}`}
            onClick={() => setOverflowOpen(false)}
          />
          <div
            className={`sheet${overflow.closing ? " sheet--out" : ""}`}
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
              <span className="item-icon"><PinIcon filled={note.pinned} /></span>
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
              <span className="item-icon"><StarIcon filled={note.favorite} /></span>
              <span className="item-label">{note.favorite ? "Unfavorite" : "Favorite"}</span>
            </button>
            <button type="button" className="sheet-item" onClick={handleExportMarkdown}>
              <span className="item-icon"><ExportIcon /></span>
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
              <span className="item-icon"><ArchiveIcon /></span>
              <span className="item-label">Archive</span>
            </button>
            <button
              type="button"
              className="sheet-item danger"
              onClick={() => {
                flushSave();
                setOverflowOpen(false);
                onTrash(note.id);
                onBack();
              }}
            >
              <span className="item-icon"><TrashIcon /></span>
              <span className="item-label">Move to Trash</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
