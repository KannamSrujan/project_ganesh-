import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Mandapam } from '../types/mandapam';
import { MandapamGrid } from './mandapam/MandapamGrid';
import { SearchBar } from './search/SearchBar';
import { AreaFilter } from './search/AreaFilter';
import { MandapamMap } from './map/MandapamMap';
import { haversineDistance } from '../utils/distance';

interface HomepageContentProps {
  allMandapams: Mandapam[];
  featuredMandapams: Mandapam[];
}

export function HomepageContent({
  allMandapams,
  featuredMandapams,
}: HomepageContentProps) {
  // ── Search / filter state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // ── Geolocation state ──────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);

  // ── Derived: available areas from actual data ──────────────────────────────
  const availableAreas = useMemo(() => {
    const areas = new Set(allMandapams.map((m) => m.area));
    return Array.from(areas).sort();
  }, [allMandapams]);

  // ── Derived: distance map ──────────────────────────────────────────────────
  const distanceMap = useMemo<Record<string, number>>(() => {
    if (!userLocation) return {};
    return Object.fromEntries(
      allMandapams.map((m) => [
        m.id,
        haversineDistance(userLocation.lat, userLocation.lng, m.latitude, m.longitude),
      ]),
    );
  }, [userLocation, allMandapams]);

  // ── Derived: filtered + sorted mandapams ──────────────────────────────────
  const filteredMandapams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let result = allMandapams.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.area.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q);

      const matchesArea = !selectedArea || m.area === selectedArea;

      return matchesSearch && matchesArea;
    });

    if (sortByDistance && userLocation) {
      result = [...result].sort(
        (a, b) => (distanceMap[a.id] ?? Infinity) - (distanceMap[b.id] ?? Infinity),
      );
    }

    return result;
  }, [allMandapams, searchQuery, selectedArea, sortByDistance, userLocation, distanceMap]);

  // ── Near Me handler ────────────────────────────────────────────────────────
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortByDistance(true);
        setIsLocating(false);
        document.getElementById('all-mandapams')?.scrollIntoView({ behavior: 'smooth' });
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access and try again.');
        } else {
          setLocationError('Unable to determine your location. Please try again.');
        }
      },
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const clearLocationSort = useCallback(() => {
    setSortByDistance(false);
    setUserLocation(null);
    setLocationError(null);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedArea(null);
    clearLocationSort();
  }, [clearLocationSort]);

  const hasActiveFilters = searchQuery || selectedArea || sortByDistance;

  return (
    <div className="homepage">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-content">
          <h1 className="hero-heading">
            Discover Ganesh Mandapams<br className="hero-break" />
            <span className="hero-highlight">Across Hyderabad</span>
          </h1>
          <p className="hero-subtext">
            Find famous and nearby Ganesh mandapams, explore their locations,
            and get directions.
          </p>
          <div className="hero-actions">
            <button
              id="near-me-btn"
              type="button"
              onClick={handleNearMe}
              disabled={isLocating}
              className="btn btn-primary btn-large"
              aria-busy={isLocating}
            >
              {isLocating ? '⏳ Locating…' : '📍 Find Near Me'}
            </button>
            <a href="#all-mandapams" className="btn btn-outline btn-large">
              Explore Mandapams
            </a>
          </div>

          {/* Location feedback */}
          {locationError && (
            <div className="location-error" role="alert">
              ⚠️ {locationError}
            </div>
          )}
          {sortByDistance && !locationError && (
            <div className="location-success">
              ✅ Sorted by distance from your location.{' '}
              <button
                type="button"
                onClick={clearLocationSort}
                className="link-btn"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── SEARCH & FILTER ─────────────────────────────────────────────── */}
      <section className="search-section" aria-label="Search and filter">
        <div className="container">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <AreaFilter
            areas={availableAreas}
            selectedArea={selectedArea}
            onSelect={setSelectedArea}
          />
        </div>
      </section>

      {/* ── FEATURED / POPULAR ──────────────────────────────────────────── */}
      {featuredMandapams.length > 0 && (
        <section className="section" aria-label="Popular mandapams">
          <div className="container">
            <h2 className="section-heading">🔥 Popular Mandapams</h2>
            <MandapamGrid
              mandapams={featuredMandapams}
              distances={distanceMap}
            />
          </div>
        </section>
      )}

      {/* ── EXPLORE BY AREA ──────────────────────────────────────────────── */}
      {availableAreas.length > 0 && (
        <section className="section section-alt" aria-label="Explore by area">
          <div className="container">
            <h2 className="section-heading">🗺️ Explore by Area</h2>
            <div className="explore-areas">
              {availableAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => {
                    setSelectedArea((prev) => (prev === area ? null : area));
                    document
                      .getElementById('all-mandapams')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={[
                    'explore-area-chip',
                    selectedArea === area ? 'explore-area-chip-active' : '',
                  ].join(' ')}
                  aria-pressed={selectedArea === area}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MAP PREVIEW ─────────────────────────────────────────────────── */}
      <section className="section" aria-label="Map of mandapams">
        <div className="container">
          <h2 className="section-heading">📍 Mandapam Map</h2>
          <p className="section-subtext">
            All verified Ganesh mandapams across Hyderabad.
          </p>
          <div className="map-container">
            <MandapamMap
              mandapams={allMandapams}
              userLocation={userLocation}
            />
          </div>
        </div>
      </section>

      {/* ── ALL MANDAPAMS ────────────────────────────────────────────────── */}
      <section id="all-mandapams" className="section section-alt" aria-label="All mandapams">
        <div className="container">
          <div className="section-header-row">
            <h2 className="section-heading">
              {selectedArea ? `Mandapams in ${selectedArea}` : 'All Mandapams'}
            </h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn btn-ghost btn-sm"
              >
                ✕ Clear filters
              </button>
            )}
          </div>

          <MandapamGrid
            mandapams={filteredMandapams}
            distances={sortByDistance ? distanceMap : undefined}
            heading="count"
            emptyMessage={
              allMandapams.length === 0
                ? 'No mandapams added yet. Be the first to add one!'
                : selectedArea
                  ? `No mandapams found in ${selectedArea}.`
                  : 'No mandapams match your search.'
            }
            onClearFilters={hasActiveFilters ? clearAllFilters : undefined}
          />
        </div>
      </section>

      {/* ── ADD MANDAPAM CTA ─────────────────────────────────────────────── */}
      <section className="cta-section" aria-label="Add a mandapam">
        <div className="container cta-content">
          <div className="cta-icon">🛕</div>
          <h2 className="cta-heading">Know a Ganesh Mandapam We&apos;re Missing?</h2>
          <p className="cta-subtext">
            Help other Hyderabad residents discover it.
          </p>
          <Link to="/submit" className="btn btn-primary btn-large">
            ➕ Add a Mandapam
          </Link>
        </div>
      </section>
    </div>
  );
}
