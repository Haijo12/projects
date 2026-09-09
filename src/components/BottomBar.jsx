import { PenLine, Eye } from "lucide-react";

export default function BottomBar({ mode, onModeChange, wordCount, charCount, showCounts, statusText, statusIcon }) {
  const countsActive = showCounts && (wordCount > 0 || charCount > 0);
  const showInfoRow = countsActive || Boolean(statusText);
  const isBusy = statusText === "Saving…";

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
            <span className={`save-state ${isBusy ? "save-busy" : "save-idle"}`}>
              {statusIcon}
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
          <PenLine size={15} />
          Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          onClick={() => onModeChange("preview")}
        >
          <Eye size={15} />
          Preview
        </button>
      </div>
    </>
  );
}
