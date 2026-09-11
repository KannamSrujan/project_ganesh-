import { useState, useEffect, useCallback } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'

// Hyderabad default center
const HYDERABAD_CENTER: LatLngTuple = [17.385, 78.4867]
const DEFAULT_ZOOM = 12

function fixLeafletIcons () {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
    ._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  })
}

function MapClickHandler ({
  onSelect
}: {
  onSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click (e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

function MapFlyTo ({ center }: { center: LatLngTuple | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.2 })
    }
  }, [map, center])
  return null
}

interface LocationPickerProps {
  selectedLocation: { lat: number; lng: number } | null
  onLocationSelect: (coords: { lat: number; lng: number }) => void
  error?: string | null
}

export function LocationPicker ({
  selectedLocation,
  onLocationSelect,
  error
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [geoNotice, setGeoNotice] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<LatLngTuple | null>(null)

  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const handleManualSelect = useCallback(
    (lat: number, lng: number) => {
      onLocationSelect({ lat, lng })
      setGeoNotice(null)
    },
    [onLocationSelect]
  )

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice(
        'Geolocation is not supported by your browser. You can select the location manually on the map.'
      )
      return
    }

    setIsLocating(true)
    setGeoNotice(null)

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        onLocationSelect(coords)
        setFlyTarget([coords.lat, coords.lng])
        setIsLocating(false)
        setGeoNotice(
          'Location detected! You can adjust the pin on the map if needed.'
        )
      },
      err => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice(
            'Location access was denied. You can select the location manually on the map.'
          )
        } else {
          setGeoNotice(
            'Unable to determine your location. You can select the location manually on the map.'
          )
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }

  const markerPosition: LatLngTuple | null = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : null

  return (
    <div className='flex w-full flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <button
          type='button'
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:opacity-60'
          aria-busy={isLocating}
        >
          {isLocating ? '⏳ Detecting Location…' : '📍 Use My Location'}
        </button>
        <span className='text-xs text-[var(--color-text-muted)]'>
          or tap anywhere on the map to set the pin
        </span>
      </div>

      {geoNotice && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            geoNotice.includes('denied') || geoNotice.includes('Unable')
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
          role='status'
        >
          {geoNotice}
        </div>
      )}

      <div
        className={`w-full overflow-hidden rounded-[var(--radius-lg)] border ${
          error ? 'border-red-300' : 'border-[var(--color-border)]'
        }`}
      >
        <MapContainer
          center={HYDERABAD_CENTER}
          zoom={DEFAULT_ZOOM}
          className='h-[280px] w-full'
          style={{ height: '280px', width: '100%' }}
          scrollWheelZoom={false}
          aria-label='Map location picker for Ganesh mandapam'
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          <MapClickHandler onSelect={handleManualSelect} />
          <MapFlyTo center={flyTarget} />

          {markerPosition && (
            <Marker position={markerPosition}>
              <Popup autoPan>
                <div className='map-popup'>
                  <strong>📍 Mandapam Location</strong>
                  <span>
                    {selectedLocation?.lat.toFixed(5)},{' '}
                    {selectedLocation?.lng.toFixed(5)}
                  </span>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {selectedLocation ? (
        <div className='flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2'>
          <span className='text-sm font-bold text-emerald-700'>
            ✓ Location pinned
          </span>
          <span className='text-xs text-emerald-700'>
            {selectedLocation.lat.toFixed(5)}° N,{' '}
            {selectedLocation.lng.toFixed(5)}° E
          </span>
        </div>
      ) : (
        <div className='rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2'>
          <span className='text-xs text-[var(--color-text-secondary)]'>
            ⚠️ No location selected yet. Tap the map or use your current
            location.
          </span>
        </div>
      )}

      {error && (
        <p className='text-sm font-semibold text-red-600' role='alert'>
          {error}
        </p>
      )}
    </div>
  )
}
