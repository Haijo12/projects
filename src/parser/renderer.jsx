// Renderer: AST -> React elements. Safe by construction — text is never
// injected as HTML; links get target/rel; code blocks never execute.

import React, { useState } from "react";

function isSafeUrl(url) {
  try {
    const u = new URL(url, "https://example.invalid");
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function InlineNodes({ nodes, ctx }) {
  return (
    <>
      {nodes.map((node, idx) => (
        <InlineNode key={idx} node={node} ctx={ctx} />
      ))}
    </>
  );
}

function InlineNode({ node, ctx }) {
  switch (node.type) {
    case "text":
      return <>{node.value}</>;

    case "code":
      return <code>{node.value}</code>;

    case "bold":
      return (
        <strong>
          <InlineNodes nodes={node.children} ctx={ctx} />
        </strong>
      );

    case "italic":
      return (
        <em>
          <InlineNodes nodes={node.children} ctx={ctx} />
        </em>
      );

    case "strike":
      return (
        <span className="md-inline-strike">
          <InlineNodes nodes={node.children} ctx={ctx} />
        </span>
      );

    case "highlight":
      return (
        <span className="md-inline-highlight">
          <InlineNodes nodes={node.children} ctx={ctx} />
        </span>
      );

    case "tag":
      return (
        <button
          type="button"
          className="md-tag"
          onClick={() => ctx.onTag?.(node.value)}
        >
          @{node.value}
        </button>
      );

    case "wikilink":
      return ctx.renderWikilink ? (
        ctx.renderWikilink(node)
      ) : (
        <span className="unresolved">{node.title}</span>
      );

    case "link": {
      if (!isSafeUrl(node.url)) {
        return <span>{node.label || node.url}</span>;
      }
      return (
        <a
          href={node.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {node.label || node.url}
        </a>
      );
    }

    default:
      return <>{node.value ?? ""}</>;
  }
}

function CodeBlock({ block }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <span>{block.language || "code"}</span>
        <button type="button" className="codeblock-copy" onClick={handleCopy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{block.code}</code>
      </pre>
    </div>
  );
}

function Callout({ block, ctx }) {
  const icons = { info: "ℹ️", success: "✅", warning: "⚠️", note: "📝" };
  return (
    <div className={`md-callout md-callout-${block.kind}`}>
      <span className="callout-icon" aria-hidden="true">
        {icons[block.kind] || "📝"}
      </span>
      <div>
        <InlineNodes nodes={block.children} ctx={ctx} />
      </div>
    </div>
  );
}

function TaskItem({ item, ctx }) {
  return (
    <li className={`md-task${item.checked ? " done" : ""}`}>
      <span className="md-task-box" aria-hidden="true">
        ✓
      </span>
      <span className="md-task-text">
        <InlineNodes nodes={item.children} ctx={ctx} />
      </span>
    </li>
  );
}

export function Renderer({ blocks, ctx = {} }) {
  if (!blocks || blocks.length === 0) {
    return <p className="md-body" style={{ color: "var(--text-3)" }}>Empty note</p>;
  }

  return (
    <div className="md-body">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading": {
            const Tag = `h${Math.min(3, block.level)}`;
            return (
              <Tag key={idx}>
                <InlineNodes nodes={block.children} ctx={ctx} />
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={idx}>
                <InlineNodes nodes={block.children} ctx={ctx} />
              </p>
            );
          case "quote":
            return (
              <blockquote key={idx}>
                <InlineNodes nodes={block.children} ctx={ctx} />
              </blockquote>
            );
          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag key={idx}>
                {block.items.map((item, i2) =>
                  item.checked === null ? (
                    <li key={i2}>
                      <InlineNodes nodes={item.children} ctx={ctx} />
                    </li>
                  ) : (
                    <TaskItem key={i2} item={item} ctx={ctx} />
                  )
                )}
              </ListTag>
            );
          }
          case "callout":
            return <Callout key={idx} block={block} ctx={ctx} />;
          case "codeblock":
            return <CodeBlock key={idx} block={block} />;
          case "divider":
            return <hr key={idx} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export default Renderer;
