// Quick insert toolbar — operates on the textarea via a ref API.
// insertAround wraps selection; insertAtCursor places cursor sensibly.
import { Bold, Italic, Strikethrough, Code, SquareCode, List, ListChecks, Quote, AtSign, Link2, Heading2 } from "lucide-react";

const BUTTONS = [
  { icon: Heading2, title: "Heading", action: "heading" },
  { icon: Bold, title: "Bold", action: "bold" },
  { icon: Italic, title: "Italic", action: "italic" },
  { icon: Strikethrough, title: "Strikethrough", action: "strike" },
  { icon: Code, title: "Inline code", action: "code" },
  { icon: SquareCode, title: "Code block", action: "codeblock" },
  { icon: List, title: "List", action: "list" },
  { icon: ListChecks, title: "Checklist", action: "task" },
  { icon: Quote, title: "Quote", action: "quote" },
  { icon: AtSign, title: "Tag", action: "tag" },
  { icon: Link2, title: "Note link", action: "wikilink" },
];

export const toolbarActions = {
  heading: { before: "## ", after: "" },
  bold: { before: "**", after: "**" },
  italic: { before: "_", after: "_" },
  strike: { before: "~~", after: "~~" },
  code: { before: "`", after: "`" },
  codeblock: { before: "```\n", after: "\n```" },
  list: { before: "- ", after: "" },
  quote: { before: "> ", after: "" },
  task: { before: "[ ] ", after: "" },
  tag: { before: "@", after: "" },
  wikilink: { before: "[[", after: "]]" },
};

export default function Toolbar({ onInsert }) {
  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
      {BUTTONS.map(({ icon: Icon, title, action }) => (
        <button
          key={action}
          type="button"
          className="toolbar-btn"
          title={title}
          aria-label={`Insert ${title}`}
          onClick={() => onInsert(action)}
        >
          <Icon size={18} strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}

// Shared helpers used by Editor to apply insertions to a textarea
export function insertTextAt(textarea, startOrAction, endArg, snippetArg) {
  if (!textarea) return;
  const { selectionStart: start, selectionEnd: end, value } = textarea;
  if (typeof endArg === "number" && typeof snippetArg === "string") {
    // Direct replacement: insert snippet at [startOrAction, endArg)
    const next = value.slice(0, startOrAction) + snippetArg + value.slice(endArg);
    const cursor = startOrAction + snippetArg.length;
    applyEdit(textarea, next, cursor);
    return;
  }
  const action = startOrAction;
  const wrap = toolbarActions[action];
  if (!wrap) return;
  const selected = value.slice(start, end);
  const next =
    value.slice(0, start) + wrap.before + selected + wrap.after + value.slice(end);
  const cursorPos =
    selected.length > 0
      ? start + wrap.before.length + selected.length + wrap.after.length
      : start + wrap.before.length;
  applyEdit(textarea, next, cursorPos);
}

export function applyEdit(textarea, nextValue, cursorPos) {
  if (!textarea) return;
  // Use native setter so React onChange fires correctly
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  ).set;
  setter.call(textarea, nextValue);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.setSelectionRange(cursorPos, cursorPos);
  textarea.focus();
}
