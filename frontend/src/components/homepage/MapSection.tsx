import { MandapamMap } from '../map/MandapamMap'
import type { Mandapam } from '../../types/mandapam'

interface MapSectionProps {
  allMandapams: Mandapam[]
  userLocation: { lat: number; lng: number } | null
}

export function MapSection ({ allMandapams, userLocation }: MapSectionProps) {
  return (
    <section className='py-16' aria-label='Map of mandapams'>
      <div className='container'>
        <h2 className='mb-4 text-2xl font-bold tracking-[-0.02em] text-[var(--color-text)]'>
          📍 Mandapam Map
        </h2>
        <p className='mb-5 text-sm text-[var(--color-text-secondary)]'>
          All verified Ganesh mandapams across Hyderabad.
        </p>
        <div className='overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white'>
          <MandapamMap mandapams={allMandapams} userLocation={userLocation} />
        </div>
      </div>
    </section>
  )
}
