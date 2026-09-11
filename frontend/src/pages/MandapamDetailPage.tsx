import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SiteHeader } from '../components/ui/SiteHeader'
import { Badge } from '../components/ui/Badge'
import { ShareButton } from '../components/mandapam/ShareButton'
import { SingleMandapamMapWrapper } from '../components/mandapam/SingleMandapamMapWrapper'
import { resolveImageUrl } from '../utils/imageUrl'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  clearSingleMandapam,
  loadMandapamById
} from '../features/mandapams/mandapamsSlice'

export function MandapamDetailPage () {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { singleMandapam, loadingSingle, singleError } = useAppSelector(
    state => state.mandapams
  )

  useEffect(() => {
    if (!id) {
      dispatch(clearSingleMandapam())
      return
    }

    dispatch(loadMandapamById(id))

    return () => {
      dispatch(clearSingleMandapam())
    }
  }, [dispatch, id])

  if (loadingSingle) {
    return (
      <>
        <SiteHeader />
        <div className='flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-text-secondary)]'>
          <span className='text-5xl opacity-70' aria-hidden='true'>
            🕉️
          </span>
          <p className='text-base font-medium'>Loading mandapam details…</p>
        </div>
      </>
    )
  }

  if (singleError || !singleMandapam) {
    return (
      <>
        <SiteHeader />
        <main className='flex-1 pb-16'>
          <div className='mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center'>
            <span className='text-5xl opacity-60' aria-hidden='true'>
              🔍
            </span>
            <h2 className='text-2xl font-bold text-[var(--color-text)]'>
              Mandapam Not Found
            </h2>
            <p className='text-base text-[var(--color-text-secondary)]'>
              The requested Ganesh mandapam could not be found or has not been
              verified yet.
            </p>
            <Link
              to='/'
              className='mt-2 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
            >
              ← Back to Explore
            </Link>
          </div>
        </main>
      </>
    )
  }

  const mandapam = singleMandapam

  if (!mandapam) {
    return null
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mandapam.latitude},${mandapam.longitude}`
  const displayImage = resolveImageUrl(mandapam.image_url)

  return (
    <>
      <SiteHeader />

      <nav
        className='border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]'
        aria-label='Breadcrumb'
      >
        <div className='container py-3'>
          <Link
            to='/'
            className='inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]'
          >
            ← Explore Mandapams
          </Link>
        </div>
      </nav>

      <main className='flex-1 bg-white pb-16'>
        <article className='mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8'>
          <div className='relative aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]'>
            {displayImage ? (
              <img
                src={displayImage}
                alt={mandapam.name}
                className='h-full w-full object-cover'
              />
            ) : (
              <div
                className='flex h-full w-full items-center justify-center bg-[var(--color-surface-muted)]'
                aria-hidden='true'
              >
                <span className='text-6xl opacity-70'>🕉️</span>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-center gap-2'>
              {mandapam.is_featured && (
                <Badge variant='featured'>Featured Mandapam</Badge>
              )}
              {mandapam.is_verified && (
                <Badge variant='verified'>Verified</Badge>
              )}
            </div>

            <h1 className='text-3xl font-extrabold tracking-[-0.05em] text-[var(--color-text)] sm:text-4xl'>
              {mandapam.name}
            </h1>
          </div>

          <section
            className='rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5'
            aria-label='Location details'
          >
            <div className='flex items-center gap-3 text-lg font-bold text-[var(--color-text)]'>
              <span className='text-xl' aria-hidden='true'>
                📍
              </span>
              <span>{mandapam.area}, Hyderabad</span>
            </div>
            {mandapam.address && (
              <p className='mt-2 pl-8 text-sm leading-6 text-[var(--color-text-secondary)]'>
                {mandapam.address}
              </p>
            )}
          </section>

          <div className='flex flex-wrap gap-3' aria-label='Primary actions'>
            <a
              href={directionsUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] sm:flex-none'
              aria-label={`Get directions to ${mandapam.name} on Google Maps`}
            >
              Get Directions
            </a>
            <ShareButton
              mandapamName={mandapam.name}
              area={mandapam.area}
              className='inline-flex flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] sm:flex-none'
            />
          </div>

          <section
            className='flex flex-col gap-3'
            aria-label='Mandapam map location'
          >
            <h2 className='flex items-center gap-2 text-xl font-bold text-[var(--color-text)]'>
              <span aria-hidden='true'>🗺️</span>
              <span>Location Map</span>
            </h2>
            <SingleMandapamMapWrapper
              latitude={mandapam.latitude}
              longitude={mandapam.longitude}
              name={mandapam.name}
              area={mandapam.area}
            />
          </section>

          {mandapam.description && (
            <section
              className='flex flex-col gap-3'
              aria-label='About this mandapam'
            >
              <h2 className='flex items-center gap-2 text-xl font-bold text-[var(--color-text)]'>
                <span aria-hidden='true'>ℹ️</span>
                <span>About this Mandapam</span>
              </h2>
              <div className='rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5'>
                <p className='whitespace-pre-line text-[0.98rem] leading-7 text-[var(--color-text-secondary)]'>
                  {mandapam.description}
                </p>
              </div>
            </section>
          )}

          <section
            className='flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 sm:flex-row sm:items-center sm:justify-between'
            aria-label='Share with others'
          >
            <div className='flex flex-col gap-1'>
              <h2 className='text-base font-bold text-[var(--color-text)]'>
                Visiting with family & friends?
              </h2>
              <p className='text-sm text-[var(--color-text-secondary)]'>
                Share this mandapam location and darshan details easily.
              </p>
            </div>
            <ShareButton
              mandapamName={mandapam.name}
              area={mandapam.area}
              className='inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
            />
          </section>

          <div className='text-center'>
            <Link
              to='/'
              className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
            >
              ← Back to All Mandapams
            </Link>
          </div>
        </article>
      </main>

      <footer className='border-t border-[var(--color-border)] bg-white'>
        <div className='container flex flex-col items-center gap-1 py-7 text-center'>
          <p className='text-sm font-semibold text-[var(--color-text)]'>
            © {new Date().getFullYear()} Ganesh Darshan Hyderabad
          </p>
          <p className='text-xs text-[var(--color-text-muted)]'>
            Community-driven directory of Ganesh mandapams across Hyderabad.
          </p>
        </div>
      </footer>
    </>
  )
}
