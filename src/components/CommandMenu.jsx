import { useEffect, useMemo, useRef, useState } from "react";
import { useDelayedUnmount } from "../hooks/useDelayedUnmount.js";
import { PlusIcon, StarIcon, PinIcon, ArchiveIcon, TrashIcon, SettingsIcon, NoteIcon } from "./icons.jsx";

// Palette icons rendered at a controlled 20px
const sized = (Icon, props = {}) => <Icon size={20} {...props} />;

// Slash commands offered while typing "/" in the editor
export const SLASH_COMMANDS = [
  { cmd: "heading", label: "Heading", snippet: "## " },
  { cmd: "bold", label: "Bold", snippet: "**text**" },
  { cmd: "italic", label: "Italic", snippet: "_text_" },
  { cmd: "code", label: "Code", snippet: "`code`" },
  { cmd: "codeblock", label: "Code block", snippet: "```\ncode\n```" },
  { cmd: "todo", label: "Task", snippet: "[ ] " },
  { cmd: "quote", label: "Quote", snippet: "> " },
  { cmd: "divider", label: "Divider", snippet: "---" },
  { cmd: "link", label: "Link", snippet: "[label](https://)" },
  { cmd: "tag", label: "Tag", snippet: "@" },
  { cmd: "note", label: "Note link", snippet: "[[Note title]]" },
  { cmd: "info", label: "Info callout", snippet: "!info " },
  { cmd: "warning", label: "Warning callout", snippet: "!warning " },
  { cmd: "success", label: "Success callout", snippet: "!success " },
];

// Global command palette entries
export function buildPaletteCommands({ onCreate, onOpenSettings, onShowFavorites, onShowPinned, onOpenTrash, onOpenArchive, onOpenNote, notes }) {
  return [
    { icon: sized(PlusIcon), label: "Create note", hint: "", run: onCreate },
    { icon: sized(StarIcon), label: "Show favorites", hint: "", run: onShowFavorites },
    { icon: sized(PinIcon), label: "Show pinned", hint: "", run: onShowPinned },
    { icon: sized(ArchiveIcon), label: "Show archive", hint: "", run: onOpenArchive },
    { icon: sized(TrashIcon), label: "Open trash", hint: "", run: onOpenTrash },
    { icon: sized(SettingsIcon), label: "Settings", hint: "", run: onOpenSettings },
    ...(notes || []).slice(0, 8).map((n) => ({
      icon: sized(NoteIcon),
      label: `Open: ${n.title || "Untitled"}`,
      hint: "",
      run: () => onOpenNote(n),
    })),
  ];
}

export default function CommandMenu({
  open,
  onClose,
  items = [],
  placeholder = "Search or command...",
  onSelect,
  mode = "palette", // palette | slash
  slashQuery = "",
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (mode === "slash") {
      const q = slashQuery.toLowerCase();
      return items.filter((item) => item.cmd.toLowerCase().includes(q));
    }
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query, mode, slashQuery]);

  useEffect(() => {
    setSelected(0);
  }, [filtered.length]);

  useEffect(() => {
    const el = listRef.current?.children[selected];
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!overlay.mounted) return null;

  function handleSelect(item) {
    if (mode === "palette") {
      item.run?.();
    } else {
      onSelect?.(item);
    }
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[selected];
      if (item) handleSelect(item);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div
      className={`sheet-backdrop${overlay.closing ? " backdrop--out" : ""}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`sheet${overlay.closing ? " sheet--out" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "slash" ? "Slash commands" : "Command menu"}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="sheet-handle" />
        {mode === "palette" && (
          <input
            type="text"
            className="sheet-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Search commands"
            autoFocus
          />
        )}
        <div className="sheet-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="sheet-item" style={{ color: "var(--text-3)" }}>
              No matching commands
            </div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={mode === "slash" ? item.cmd : item.label}
              type="button"
              className={`sheet-item${idx === selected ? " selected" : ""}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelected(idx)}
            >
              <span className="item-icon" aria-hidden="true">
                {mode === "slash" ? "/" : item.icon}
              </span>
              <span className="item-label">{item.label}</span>
              {mode === "slash" && <span className="item-hint">/{item.cmd}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
