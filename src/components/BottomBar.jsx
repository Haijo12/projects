export default function BottomBar({ mode, onModeChange, wordCount, charCount, showCounts, saveStatus }) {
  return (
    <>
      {showCounts && (wordCount > 0 || charCount > 0) && (
        <div className="editor-footer-info">
          <span>
            {wordCount} word{wordCount === 1 ? "" : "s"}
            {charCount > 0 ? ` · ${charCount} chars` : ""}
          </span>
          {saveStatus && <span>{saveStatus}</span>}
        </div>
      )}
      {!showCounts && saveStatus && (
        <div className="editor-footer-info">
          <span />
          <span>{saveStatus}</span>
        </div>
      )}
      <div className="capsule-toggle" role="tablist" aria-label="Edit or preview">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "edit"}
          aria-pressed={mode === "edit"}
          onClick={() => onModeChange("edit")}
        >
          Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          aria-pressed={mode === "preview"}
          onClick={() => onModeChange("preview")}
        >
          Preview
        </button>
      </div>
    </>
  );
}
