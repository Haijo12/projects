import { useMemo } from "react";
import { parse } from "../parser/parser.js";
import Renderer from "../parser/renderer.jsx";
import Backlinks from "./Backlinks.jsx";

export default function Viewer({ note, allNotes, onOpenNote, onTagClick, getBacklinks, onCreateNoteFor }) {
  const blocks = useMemo(() => parse(note.content), [note.content]);
  const backlinks = useMemo(() => getBacklinks(note), [note, getBacklinks]);

  const titleIndex = useMemo(() => {
    const map = new Map();
    for (const n of allNotes) {
      if (!n.deletedAt) map.set(n.title.trim().toLowerCase(), n);
    }
    return map;
  }, [allNotes]);

  const ctx = {
    onTag: (tag) => onTagClick?.("@" + tag.toLowerCase()),
    renderWikilink: (node) => {
      const target = titleIndex.get(node.title.toLowerCase());
      if (target) {
        return (
          <button
            type="button"
            className="wikilink"
            style={{ color: "var(--accent)", background: "none", fontWeight: 500, padding: 0 }}
            onClick={() => onOpenNote(target)}
          >
            {node.title}
          </button>
        );
      }
      return (
        <button
          type="button"
          className="unresolved"
          title="Note not found — tap to create"
          style={{ background: "none", padding: 0 }}
          onClick={() => onCreateNoteFor?.(node.title)}
        >
          {node.title}
        </button>
      );
    },
  };

  return (
    <div className="editor-body editor-scroll">
      <Renderer blocks={blocks} ctx={ctx} />
      <Backlinks links={backlinks} onOpen={onOpenNote} />
    </div>
  );
}
