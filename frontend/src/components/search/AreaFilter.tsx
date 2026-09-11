interface AreaFilterProps {
  areas: string[]
  selectedArea: string | null
  onSelect: (area: string | null) => void
}

export function AreaFilter ({ areas, selectedArea, onSelect }: AreaFilterProps) {
  if (areas.length === 0) return null

  return (
    <div
      className='mx-auto max-w-2xl overflow-hidden'
      role='group'
      aria-label='Filter by area'
    >
      <div className='flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        <button
          type='button'
          onClick={() => onSelect(null)}
          className={[
            'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
            !selectedArea
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
              : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
          ].join(' ')}
          aria-pressed={!selectedArea}
        >
          All Areas
        </button>

        {areas.map(area => (
          <button
            key={area}
            type='button'
            onClick={() => onSelect(selectedArea === area ? null : area)}
            className={[
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
              selectedArea === area
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
            ].join(' ')}
            aria-pressed={selectedArea === area}
          >
            {area}
          </button>
        ))}
      </div>
    </div>
  )
}
