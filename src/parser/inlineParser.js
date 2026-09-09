// Inline parser: text -> inline AST nodes.
// Produces structured nodes; rendering is React-based so no HTML injection.

import { extractTags } from "../utils/tags.js";

export function parseInline(text) {
  const nodes = [];
  let buf = "";
  let i = 0;
  const n = text.length;

  const flush = () => {
    if (buf) {
      nodes.push({ type: "text", value: buf });
      buf = "";
    }
  };

  while (i < n) {
    const rest = text.slice(i);

    // Code span: `code`
    if (rest.startsWith("`")) {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        flush();
        nodes.push({ type: "code", value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Wiki link [[Title]]
    if (rest.startsWith("[[")) {
      const end = text.indexOf("]]", i + 2);
      if (end !== -1) {
        flush();
        const title = text.slice(i + 2, end).trim();
        nodes.push({ type: "wikilink", title, resolved: false });
        i = end + 2;
        continue;
      }
    }

    // Markdown link [label](url)
    const mdLink = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
    if (mdLink) {
      flush();
      nodes.push({ type: "link", label: mdLink[1], url: mdLink[2] });
      i += mdLink[0].length;
      continue;
    }

    // Autolink https://...
    const auto = rest.match(/^https?:\/\/[^\s)]+/);
    if (auto) {
      flush();
      nodes.push({ type: "link", label: auto[0], url: auto[0] });
      i += auto[0].length;
      continue;
    }

    // Tag @name
    const tag = rest.match(/^@([a-zA-Z0-9_-]+)/);
    if (tag) {
      flush();
      nodes.push({ type: "tag", value: tag[1] });
      i += tag[0].length;
      continue;
    }

    // Bold **text**
    if (rest.startsWith("**")) {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        nodes.push({ type: "bold", children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // Highlight ==text==
    if (rest.startsWith("==")) {
      const end = text.indexOf("==", i + 2);
      if (end !== -1) {
        flush();
        nodes.push({ type: "highlight", children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // Strikethrough ~~text~~
    if (rest.startsWith("~~")) {
      const end = text.indexOf("~~", i + 2);
      if (end !== -1) {
        flush();
        nodes.push({ type: "strike", children: parseInline(text.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // Italic _text_ (word-boundary-ish)
    if (rest.startsWith("_")) {
      const end = text.indexOf("_", i + 1);
      if (end !== -1) {
        const inner = text.slice(i + 1, end);
        if (inner.length > 0 && !/\s/.test(inner)) {
          flush();
          nodes.push({ type: "italic", children: parseInline(inner) });
          i = end + 1;
          continue;
        }
      }
    }

    buf += text[i];
    i++;
  }

  flush();
  return nodes;
}
