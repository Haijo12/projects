import { useMemo } from "react";
import { getAllTags } from "../utils/tags.js";

export default function TagFilter({ notes, activeTag, onSelectTag, onClear }) {
  const tags = useMemo(() => getAllTags(notes), [notes]);

  if (tags.length === 0 && !activeTag) return null;

  return (
    <div className="filter-row" role="group" aria-label="Filter by tag">
      {activeTag && (
        <button type="button" className="chip" aria-pressed="true" onClick={onClear}>
          {activeTag} ✕
        </button>
      )}
      {tags
        .filter(({ tag }) => tag !== activeTag)
        .map(({ tag, count }) => (
          <button
            key={tag}
            type="button"
            className="chip"
            aria-pressed="false"
            onClick={() => onSelectTag(tag)}
          >
            {tag} <span className="chip-count">{count}</span>
          </button>
        ))}
    </div>
  );
}
