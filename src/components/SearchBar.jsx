import { SearchIcon, CloseIcon } from "./icons.jsx";

export default function SearchBar({ value, onChange, placeholder = "Search notes…", onEscape }) {
  return (
    <div className="search-wrap">
      <div className="search-bar">
        <SearchIcon className="search-icon" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onEscape?.();
          }}
          placeholder={placeholder}
          aria-label="Search notes"
          autoComplete="off"
          enterKeyHint="search"
          inputMode="search"
        />
        {value && (
          <button
            type="button"
            className="tap-target search-clear"
            aria-label="Clear search"
            onClick={() => onChange("")}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
