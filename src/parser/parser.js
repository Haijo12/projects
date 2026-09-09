// Parser: line tokens -> block AST

import { tokenize } from "./tokenizer.js";
import { parseInline } from "./inlineParser.js";

// Callout syntax: !type rest-of-line, type in {info,warning,success,note}
const CALLOUT_RE = /^!(info|warning|success|note)\b\s?(.*)$/i;

export function parse(raw) {
  const tokens = tokenize(raw);
  const blocks = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "code") {
      blocks.push({ type: "codeblock", language: token.lang, code: token.content });
      i++;
      continue;
    }

    const line = token.text ?? "";
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      i++;
      continue;
    }

    // Heading
    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        children: parseInline(heading[2]),
      });
      i++;
      continue;
    }

    // Divider
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // Callout
    const callout = trimmed.match(CALLOUT_RE);
    if (callout) {
      blocks.push({
        type: "callout",
        kind: callout[1].toLowerCase(),
        children: parseInline(callout[2]),
      });
      i++;
      continue;
    }

    // Quote (single-line; consecutive lines merge)
    if (trimmed.startsWith(">")) {
      const quoteLines = [];
      while (i < tokens.length) {
        const t = tokens[i];
        if (t.type !== "line") break;
        const s = (t.text ?? "").trim();
        if (!s.startsWith(">")) break;
        quoteLines.push(s.replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", children: parseInline(quoteLines.join(" ")) });
      continue;
    }

    // Lists (bulleted, numbered, tasks)
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    const task = trimmed.match(/^\[([ xX])\]\s*(.*)$/);
    if (bullet || numbered || task) {
      const items = [];
      let ordered = false;
      while (i < tokens.length) {
        const t = tokens[i];
        if (t.type !== "line") break;
        const s = (t.text ?? "").trim();

        const b = s.match(/^[-*]\s+(.*)$/);
        const num = s.match(/^(\d+)[.)]\s+(.*)$/);
        const tk = s.match(/^\[([ xX])\]\s*(.*)$/);

        if (tk) {
          items.push({ checked: tk[1].toLowerCase() === "x", children: parseInline(tk[2]) });
          i++;
          continue;
        }
        if (b) {
          items.push({ checked: null, children: parseInline(b[1]) });
          i++;
          continue;
        }
        if (num) {
          ordered = true;
          items.push({ checked: null, children: parseInline(num[2]) });
          i++;
          continue;
        }
        break;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // Paragraph: consume until blank/structural line
    const paraLines = [];
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type !== "line") break;
      const s = (t.text ?? "").trim();
      if (!s) break;
      if (
        s.startsWith("#") ||
        /^(-{3,}|\*{3,})$/.test(s) ||
        s.startsWith(">") ||
        /^[-*]\s+/.test(s) ||
        /^(\d+)[.)]\s+/.test(s) ||
        /^\[([ xX])\]/.test(s) ||
        CALLOUT_RE.test(s)
      ) {
        break;
      }
      paraLines.push(s);
      i++;
    }
    if (paraLines.length) {
      blocks.push({ type: "paragraph", children: parseInline(paraLines.join(" ")) });
      continue;
    }

    // Fallback: skip a line to guarantee progress
    i++;
  }

  return blocks;
}

export { parseInline };
