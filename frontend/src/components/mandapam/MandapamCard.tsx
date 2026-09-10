import { Link } from 'react-router-dom';
import type { Mandapam } from '../../types/mandapam';
import { Badge } from '../ui/Badge';
import { formatDistance } from '../../utils/distance';
import { resolveImageUrl } from '../../utils/imageUrl';

interface MandapamCardProps {
  mandapam: Mandapam;
  /** Distance from user in km — shown only when Near Me is active */
  distanceKm?: number;
}

export function MandapamCard({ mandapam, distanceKm }: MandapamCardProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mandapam.latitude},${mandapam.longitude}`;
  const displayImage = resolveImageUrl(mandapam.image_url);

  return (
    <article className="mandapam-card group">
      {/* Image */}
      <div className="card-image-wrapper">
        {displayImage ? (
          <img
            src={displayImage}
            alt={mandapam.name}
            className="card-image-img"
            loading="lazy"
          />
        ) : (
          <div className="card-image-fallback" aria-hidden="true">
            <span className="card-image-fallback-icon">🕉️</span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="card-badges">
          {mandapam.is_featured && (
            <Badge variant="featured">⭐ Featured</Badge>
          )}
          {mandapam.is_verified && (
            <Badge variant="verified">✓ Verified</Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="card-meta">
          <span className="card-area">📍 {mandapam.area}</span>
          {distanceKm !== undefined && (
            <span className="card-distance">{formatDistance(distanceKm)}</span>
          )}
        </div>

        <h3 className="card-title">{mandapam.name}</h3>

        {mandapam.description && (
          <p className="card-description">{mandapam.description}</p>
        )}

        {mandapam.address && (
          <p className="card-address">{mandapam.address}</p>
        )}

        {/* Actions */}
        <div className="card-actions">
          <Link
            to={`/mandapams/${mandapam.id}`}
            className="btn btn-primary"
          >
            View Details
          </Link>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            aria-label={`Get directions to ${mandapam.name}`}
          >
            🗺️ Directions
          </a>
        </div>
      </div>
    </article>
  );
}
