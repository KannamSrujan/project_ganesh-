import { Link } from 'react-router-dom'
import type { Mandapam } from '../../types/mandapam'
import { Badge } from '../ui/Badge'
import { formatDistance } from '../../utils/distance'
import { resolveImageUrl } from '../../utils/imageUrl'

interface MandapamCardProps {
  mandapam: Mandapam
  /** Distance from user in km — shown only when Near Me is active */
  distanceKm?: number
}

export function MandapamCard ({ mandapam, distanceKm }: MandapamCardProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mandapam.latitude},${mandapam.longitude}`
  const displayImage = resolveImageUrl(mandapam.image_url)

  return (
    <article className='group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]'>
      <div className='relative aspect-[16/9] overflow-hidden bg-[var(--color-surface-muted)]'>
        {displayImage ? (
          <img
            src={displayImage}
            alt={mandapam.name}
            className='h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]'
            loading='lazy'
          />
        ) : (
          <div
            className='flex h-full w-full items-center justify-center bg-[var(--color-surface-muted)]'
            aria-hidden='true'
          >
            <span className='text-5xl opacity-60'>🕉️</span>
          </div>
        )}

        <div className='absolute left-3 top-3 flex flex-wrap gap-1.5'>
          {mandapam.is_featured && <Badge variant='featured'>Featured</Badge>}
          {mandapam.is_verified && <Badge variant='verified'>Verified</Badge>}
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-2 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--color-primary-dark)]'>
            📍 {mandapam.area}
          </span>
          {distanceKm !== undefined && (
            <span className='rounded-full bg-[var(--color-primary-soft)] px-2 py-1 text-[0.7rem] font-semibold text-[var(--color-text-secondary)]'>
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>

        <h3 className='text-lg font-bold text-[var(--color-text)] line-clamp-2'>
          {mandapam.name}
        </h3>

        {mandapam.description && (
          <p className='text-sm leading-6 text-[var(--color-text-secondary)] line-clamp-2'>
            {mandapam.description}
          </p>
        )}

        {mandapam.address && (
          <p className='truncate text-xs text-[var(--color-text-muted)]'>
            {mandapam.address}
          </p>
        )}

        <div className='mt-auto flex flex-wrap gap-2 pt-2'>
          <Link
            to={`/mandapams/${mandapam.id}`}
            className='flex-1 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
          >
            View Details
          </Link>
          <a
            href={directionsUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='flex-1 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
            aria-label={`Get directions to ${mandapam.name}`}
          >
            Directions
          </a>
        </div>
      </div>
    </article>
  )
}
