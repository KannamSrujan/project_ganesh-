import { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';

// Hyderabad default center
const HYDERABAD_CENTER: LatLngTuple = [17.385, 78.4867];
const DEFAULT_ZOOM = 12;

function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapFlyTo({ center }: { center: LatLngTuple | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.2 });
    }
  }, [map, center]);
  return null;
}

interface LocationPickerProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  error?: string | null;
}

export function LocationPicker({
  selectedLocation,
  onLocationSelect,
  error,
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLngTuple | null>(null);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const handleManualSelect = useCallback(
    (lat: number, lng: number) => {
      onLocationSelect({ lat, lng });
      setGeoNotice(null);
    },
    [onLocationSelect],
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser. You can select the location manually on the map.');
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onLocationSelect(coords);
        setFlyTarget([coords.lat, coords.lng]);
        setIsLocating(false);
        setGeoNotice('Location detected! You can adjust the pin on the map if needed.');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice(
            'Location access was denied. You can select the location manually on the map.',
          );
        } else {
          setGeoNotice(
            'Unable to determine your location. You can select the location manually on the map.',
          );
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true },
    );
  };

  const markerPosition: LatLngTuple | null = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : null;

  return (
    <div className="location-picker-container">
      {/* Top action bar */}
      <div className="location-picker-toolbar">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="btn btn-secondary btn-sm"
          aria-busy={isLocating}
        >
          {isLocating ? '⏳ Detecting Location…' : '📍 Use My Location'}
        </button>
        <span className="location-picker-instruction">
          or tap anywhere on the map to set the pin
        </span>
      </div>

      {/* Geolocation Notice */}
      {geoNotice && (
        <div
          className={`location-picker-notice ${
            geoNotice.includes('denied') || geoNotice.includes('Unable')
              ? 'location-picker-notice-warn'
              : 'location-picker-notice-info'
          }`}
          role="status"
        >
          {geoNotice}
        </div>
      )}

      {/* Leaflet Map */}
      <div className={`map-container location-picker-map-frame ${error ? 'map-error-border' : ''}`}>
        <MapContainer
          center={HYDERABAD_CENTER}
          zoom={DEFAULT_ZOOM}
          className="mandapam-map"
          scrollWheelZoom={false}
          aria-label="Map location picker for Ganesh mandapam"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onSelect={handleManualSelect} />
          <MapFlyTo center={flyTarget} />

          {markerPosition && (
            <Marker position={markerPosition}>
              <Popup autoPan>
                <div className="map-popup">
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

      {/* Selected Coordinates Badge */}
      {selectedLocation ? (
        <div className="location-selected-status">
          <span className="location-selected-badge">✓ Location pinned</span>
          <span className="location-coords-text">
            {selectedLocation.lat.toFixed(5)}° N, {selectedLocation.lng.toFixed(5)}° E
          </span>
        </div>
      ) : (
        <div className="location-unselected-status">
          <span className="location-pending-text">
            ⚠️ No location selected yet. Tap the map or use your current location.
          </span>
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
