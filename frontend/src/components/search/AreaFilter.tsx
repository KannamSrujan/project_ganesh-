interface AreaFilterProps {
  areas: string[];
  selectedArea: string | null;
  onSelect: (area: string | null) => void;
}

export function AreaFilter({ areas, selectedArea, onSelect }: AreaFilterProps) {
  if (areas.length === 0) return null;

  return (
    <div className="area-filter-wrapper" role="group" aria-label="Filter by area">
      <div className="area-chips">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={['area-chip', !selectedArea ? 'area-chip-active' : ''].join(' ')}
          aria-pressed={!selectedArea}
        >
          All Areas
        </button>

        {areas.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => onSelect(selectedArea === area ? null : area)}
            className={['area-chip', selectedArea === area ? 'area-chip-active' : ''].join(' ')}
            aria-pressed={selectedArea === area}
          >
            {area}
          </button>
        ))}
      </div>
    </div>
  );
}
