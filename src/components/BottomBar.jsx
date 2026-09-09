export default function BottomBar({ mode, onModeChange, wordCount, charCount, showCounts, statusText }) {
  const countsActive = showCounts && (wordCount > 0 || charCount > 0);
  const showInfoRow = countsActive || Boolean(statusText);

  return (
    <>
      {showInfoRow && (
        <div className="editor-footer-info">
          <span>
            {countsActive
              ? `${wordCount} word${wordCount === 1 ? "" : "s"}${charCount > 0 ? ` · ${charCount} chars` : ""}`
              : ""}
          </span>
          {statusText && (
            <span className={`save-state save-${mode === "edit" && statusText === "Saving…" ? "busy" : "idle"}`}>
              {statusText}
            </span>
          )}
        </div>
      )}
      <div className="capsule-toggle" role="tablist" aria-label="Edit or preview">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "edit"}
          onClick={() => onModeChange("edit")}
        >
          Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          onClick={() => onModeChange("preview")}
        >
          Preview
        </button>
      </div>
    </>
  );
}
