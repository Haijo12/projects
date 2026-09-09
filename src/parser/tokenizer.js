// Tokenizer: turns raw text into a flat list of line tokens with fence state

export function tokenize(raw) {
  const lines = String(raw ?? "").split("\n");
  const tokens = [];
  let inCode = false;
  let codeLines = [];
  let codeLang = "";

  for (const rawLine of lines) {
    if (inCode) {
      const close = rawLine.match(/^\s*```\s*$/);
      if (close) {
        tokens.push({ type: "code", lang: codeLang, content: codeLines.join("\n") });
        inCode = false;
        codeLines = [];
        codeLang = "";
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    const fence = rawLine.match(/^\s*```(.*)$/);
    if (fence) {
      inCode = true;
      codeLang = fence[1].trim();
      codeLines = [];
      continue;
    }

    tokens.push({ type: "line", text: rawLine });
  }

  // Unterminated code fence: still render content
  if (inCode) {
    tokens.push({ type: "code", lang: codeLang, content: codeLines.join("\n") });
  }

  return tokens;
}
