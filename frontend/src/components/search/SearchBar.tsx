interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search mandapams or areas...',
}: SearchBarProps) {
  return (
    <div className="search-bar-wrapper">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        id="mandapam-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Search mandapams"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="search-clear"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
