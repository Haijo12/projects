// Quick insert toolbar — operates on the textarea via a ref API.
// insertAround wraps selection; insertAtCursor places cursor sensibly.

const BUTTONS = [
  { label: "#", title: "Heading", action: "heading" },
  { label: "**", title: "Bold", action: "bold" },
  { label: "_", title: "Italic", action: "italic" },
  { label: "`", title: "Inline code", action: "code" },
  { label: "```", title: "Code block", action: "codeblock" },
  { label: "-", title: "List", action: "list" },
  { label: ">", title: "Quote", action: "quote" },
  { label: "[ ]", title: "Task", action: "task" },
  { label: "@", title: "Tag", action: "tag" },
  { label: "[[", title: "Note link", action: "wikilink" },
];

export const toolbarActions = {
  heading: { before: "## ", after: "" },
  bold: { before: "**", after: "**" },
  italic: { before: "_", after: "_" },
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
      {BUTTONS.map((btn) => (
        <button
          key={btn.action}
          type="button"
          className="toolbar-btn"
          title={btn.title}
          aria-label={`Insert ${btn.title}`}
          onClick={() => onInsert(btn.action)}
        >
          {btn.label}
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
