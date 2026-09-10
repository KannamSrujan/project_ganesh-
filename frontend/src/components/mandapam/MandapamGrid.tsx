import type { Mandapam } from '../../types/mandapam';
import { MandapamCard } from './MandapamCard';

interface MandapamGridProps {
  mandapams: Mandapam[];
  /** Per-card distances in km — keyed by mandapam id */
  distances?: Record<string, number>;
  /** Label shown above the grid */
  heading?: string;
  /** Message when results list is empty */
  emptyMessage?: string;
  /** Callback to clear filters */
  onClearFilters?: () => void;
}

export function MandapamGrid({
  mandapams,
  distances,
  heading,
  emptyMessage = 'No mandapams found.',
  onClearFilters,
}: MandapamGridProps) {
  if (mandapams.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🔍</span>
        <p className="empty-state-text">{emptyMessage}</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="btn btn-outline mt-2"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {heading && (
        <p className="results-count">
          {mandapams.length} mandapam{mandapams.length !== 1 ? 's' : ''} found
        </p>
      )}
      <div className="mandapam-grid">
        {mandapams.map((m) => (
          <MandapamCard
            key={m.id}
            mandapam={m}
            distanceKm={distances?.[m.id]}
          />
        ))}
      </div>
    </div>
  );
}
