export default function SearchBar({ value, onChange, placeholder = "Search notes..." }) {
  return (
    <div className="search-wrap">
      <div className="search-bar">
        <span aria-hidden="true" style={{ color: "var(--text-3)" }}>🔍</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search notes"
          autoComplete="off"
          enterKeyHint="search"
        />
        {value && (
          <button
            type="button"
            className="tap-target"
            aria-label="Clear search"
            onClick={() => onChange("")}
            style={{ width: 32, height: 32 }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
